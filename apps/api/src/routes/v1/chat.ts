import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { logRequestDB } from "@srouter/db";
import {
    type ChatCompletionRequest,
    ChatCompletionRequestSchema,
} from "@srouter/types";
import { validateJson } from "../../middleware/validator.js";
import { registry } from "../../services/registry.js";

export const chatRoute = new Hono();

// POST /v1/chat/completions with Zod validation middleware
chatRoute.post(
    "/chat/completions",
    validateJson(ChatCompletionRequestSchema),
    async (c) => {
        const startTime = Date.now();
        const body = c.req.valid("json") as ChatCompletionRequest;

        // 1. Streaming response (SSE)
        if (body.stream) {
            return streamSSE(c, async (stream) => {
                const totalTokens = 0;
                try {
                    const generator = registry.chatCompletionStream(body);
                    for await (const chunk of generator) {
                        await stream.writeSSE({
                            data: JSON.stringify(chunk),
                        });
                    }
                    await stream.writeSSE({
                        data: "[DONE]",
                    });

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
                    const errorMessage =
                        err instanceof Error ? err.message : String(err);

                    logRequestDB({
                        providerId: body.model.split("/")[0] || "default",
                        model: body.model,
                        promptTokens: 0,
                        completionTokens: 0,
                        totalTokens: 0,
                        statusCode: 500,
                        latencyMs: Date.now() - startTime,
                    });

                    await stream.writeSSE({
                        data: JSON.stringify({
                            error: {
                                message:
                                    errorMessage ||
                                    "Error occurred during streaming",
                                type: "api_error",
                            },
                        }),
                    });
                }
            });
        }

        // 2. Non-streaming response (JSON)
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

            return c.json(response);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : String(err);

            logRequestDB({
                providerId: body.model.split("/")[0] || "default",
                model: body.model,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                statusCode: 500,
                latencyMs: Date.now() - startTime,
            });

            return c.json(
                {
                    error: {
                        message: errorMessage || "Internal server error",
                        type: "api_error",
                    },
                },
                500,
            );
        }
    },
);
