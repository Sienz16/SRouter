import { logRequestDB } from "@srouter/db";
import type { ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse } from "@srouter/types";
import { registry } from "@/services/registry.js";

export class ChatLogic {
    public static async processNonStreamingCompletion(body: ChatCompletionRequest, startTime: number): Promise<ChatCompletionResponse> {
        try {
            const response = await registry.chatCompletion(body);
            const latencyMs = Date.now() - startTime;

            logRequestDB({
                providerId: body.model.split("/")[0] || "default",
                model: body.model,
                promptTokens: response.usage?.prompt_tokens ?? 0,
                completionTokens: response.usage?.completion_tokens ?? 0,
                totalTokens: response.usage?.total_tokens ?? 0,
                statusCode: 200,
                latencyMs,
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
                latencyMs: Date.now() - startTime,
            });
            throw err;
        }
    }

    public static async *processStreamingCompletion(body: ChatCompletionRequest, startTime: number): AsyncGenerator<ChatCompletionChunk, void, void> {
        const totalTokens = 0;
        try {
            const generator = registry.chatCompletionStream(body);
            for await (const chunk of generator) {
                yield chunk;
            }

            logRequestDB({
                providerId: body.model.split("/")[0] || "default",
                model: body.model,
                promptTokens: 10,
                completionTokens: totalTokens,
                totalTokens: 10 + totalTokens,
                statusCode: 200,
                latencyMs: Date.now() - startTime,
            });
        } catch (err) {
            logRequestDB({
                providerId: body.model.split("/")[0] || "default",
                model: body.model,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                statusCode: 500,
                latencyMs: Date.now() - startTime,
            });
            throw err;
        }
    }
}
