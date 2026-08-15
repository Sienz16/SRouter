import { logRequestDB } from "@srouter/db";
import { extractUsageBreakdown, estimateCostForUsage } from "@srouter/translator";
import type {
    ChatCompletionChunk,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    ToolCall
} from "@srouter/types";
import { registry } from "@/services/registry.js";
import { ensureFreshToken } from "@/services/tokenRefresh.js";
import {
    executeInterceptedSearch,
    shouldInterceptToolCall
} from "@/services/toolInterceptor.js";

const MAX_INTERCEPT_DEPTH = 3;

interface AssembledStreamingToolCall {
    id: string;
    name: string;
    arguments: string;
}

export class ChatLogic {
    public static async processNonStreamingCompletion(
        body: ChatCompletionRequest,
        startTime: number,
        depth = 0
    ): Promise<ChatCompletionResponse> {
        try {
            // Lazy token refresh: ensure the target provider's token is fresh before dispatch
            const providerId = body.model.split("/")[0] || "default";
            await ensureFreshToken(providerId);

            const response = await registry.chatCompletion(body);
            const choice = response.choices?.[0];
            const toolCalls = choice?.message?.tool_calls;

            // Check if model returned tool calls that should be intercepted server-side
            if (
                depth < MAX_INTERCEPT_DEPTH &&
                Array.isArray(toolCalls) &&
                toolCalls.length > 0 &&
                toolCalls.some((tc) => shouldInterceptToolCall(tc.function.name, body.tools))
            ) {
                const updatedMessages: ChatMessage[] = [...body.messages, choice.message];

                for (const tc of toolCalls) {
                    if (shouldInterceptToolCall(tc.function.name, body.tools)) {
                        const { toolCallId, result } = await executeInterceptedSearch(tc);
                        updatedMessages.push({
                            role: "tool",
                            tool_call_id: toolCallId,
                            content: JSON.stringify(result)
                        });
                    }
                }

                const followUpRequest: ChatCompletionRequest = {
                    ...body,
                    messages: updatedMessages
                };
                return await this.processNonStreamingCompletion(
                    followUpRequest,
                    startTime,
                    depth + 1
                );
            }

            const latencyMs = Date.now() - startTime;
            const provider = body.model.split("/")[0] || "default";
            const breakdown = extractUsageBreakdown(provider, response.usage);

            logRequestDB({
                providerId: provider,
                model: body.model,
                promptTokens: breakdown.promptTokens,
                completionTokens: breakdown.completionTokens,
                totalTokens: breakdown.totalTokens,
                cachedTokens: breakdown.cachedTokens,
                cacheCreationTokens: breakdown.cacheCreationTokens,
                reasoningTokens: breakdown.reasoningTokens,
                estimatedCost: estimateCostForUsage(provider, body.model, breakdown),
                statusCode: 200,
                latencyMs
            });

            return response;
        } catch (err) {
            logRequestDB({
                providerId: body.model.split("/")[0] || "default",
                model: body.model,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                statusCode: 500,
                latencyMs: Date.now() - startTime
            });
            throw err;
        }
    }

    public static async *processStreamingCompletion(
        body: ChatCompletionRequest,
        startTime: number,
        depth = 0
    ): AsyncGenerator<ChatCompletionChunk, void, void> {
        const provider = body.model.split("/")[0] || "default";
        let usage: unknown = null;
        try {
            // Lazy token refresh also applies to streaming requests
            await ensureFreshToken(provider);

            const generator = registry.chatCompletionStream(body);

            // Streaming tool call assembly buffers
            const bufferedChunks: ChatCompletionChunk[] = [];
            const toolCallsMap = new Map<number, AssembledStreamingToolCall>();
            let hasToolCalls = false;
            let assistantContent = "";

            for await (const chunk of generator) {
                if (chunk.usage) {
                    usage = chunk.usage;
                }

                const choice = chunk.choices?.[0];
                const delta = choice?.delta;

                // Track content text
                if (delta?.content) {
                    assistantContent += delta.content;
                }

                // Track tool calls in delta
                if (Array.isArray(delta?.tool_calls) && delta.tool_calls.length > 0) {
                    hasToolCalls = true;
                    for (const tc of delta.tool_calls) {
                        const idx = tc.index ?? toolCallsMap.size;
                        const existing = toolCallsMap.get(idx) || {
                            id: tc.id || `call_${Date.now()}_${idx}`,
                            name: tc.function?.name || "",
                            arguments: ""
                        };
                        if (tc.id) existing.id = tc.id;
                        if (tc.function?.name) existing.name = tc.function.name;
                        if (tc.function?.arguments) existing.arguments += tc.function.arguments;
                        toolCallsMap.set(idx, existing);
                    }
                }

                if (hasToolCalls) {
                    bufferedChunks.push(chunk);
                } else {
                    yield chunk;
                }
            }

            const assembledToolCalls = Array.from(toolCallsMap.values());
            const hasInterceptableCall =
                depth < MAX_INTERCEPT_DEPTH &&
                assembledToolCalls.some((tc) => shouldInterceptToolCall(tc.name, body.tools));

            if (hasInterceptableCall) {
                // Construct assistant message with all tool calls
                const assistantToolCalls: ToolCall[] = assembledToolCalls.map((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: {
                        name: tc.name,
                        arguments: tc.arguments
                    }
                }));

                const assistantMessage: ChatMessage = {
                    role: "assistant",
                    content: assistantContent || null,
                    tool_calls: assistantToolCalls
                };

                const updatedMessages: ChatMessage[] = [...body.messages, assistantMessage];

                // Execute intercepted searches
                for (const tc of assembledToolCalls) {
                    if (shouldInterceptToolCall(tc.name, body.tools)) {
                        const { toolCallId, result } = await executeInterceptedSearch({
                            id: tc.id,
                            function: { name: tc.name, arguments: tc.arguments }
                        });
                        updatedMessages.push({
                            role: "tool",
                            tool_call_id: toolCallId,
                            content: JSON.stringify(result)
                        });
                    }
                }

                // Follow up stream with search context added
                const followUpRequest: ChatCompletionRequest = {
                    ...body,
                    messages: updatedMessages
                };
                yield* this.processStreamingCompletion(followUpRequest, startTime, depth + 1);
                return;
            }

            // If not intercepted, flush all buffered tool call chunks to client
            for (const chunk of bufferedChunks) {
                yield chunk;
            }

            const breakdown = extractUsageBreakdown(provider, usage);
            logRequestDB({
                providerId: provider,
                model: body.model,
                promptTokens: breakdown.promptTokens,
                completionTokens: breakdown.completionTokens,
                totalTokens: breakdown.totalTokens,
                cachedTokens: breakdown.cachedTokens,
                cacheCreationTokens: breakdown.cacheCreationTokens,
                reasoningTokens: breakdown.reasoningTokens,
                estimatedCost: estimateCostForUsage(provider, body.model, breakdown),
                statusCode: 200,
                latencyMs: Date.now() - startTime
            });
        } catch (err) {
            logRequestDB({
                providerId: provider,
                model: body.model,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                statusCode: 500,
                latencyMs: Date.now() - startTime
            });
            throw err;
        }
    }
}
