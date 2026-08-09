import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import type { ChatCompletionRequest } from "@srouter/types";
import { ChatLogic } from "../logic/chat.logic.js";

export class ChatController {
    public static async createCompletion(c: Context): Promise<Response> {
        const startTime = Date.now();
        const body = c.req.valid("json" as never) as ChatCompletionRequest;

        // 1. Streaming response (SSE)
        if (body.stream) {
            return streamSSE(c, async (stream) => {
                try {
                    const generator = ChatLogic.processStreamingCompletion(body, startTime);
                    for await (const chunk of generator) {
                        await stream.writeSSE({
                            data: JSON.stringify(chunk),
                        });
                    }
                    await stream.writeSSE({
                        data: "[DONE]",
                    });
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    await stream.writeSSE({
                        data: JSON.stringify({
                            error: {
                                message: errorMessage || "Error occurred during streaming",
                                type: "api_error",
                            },
                        }),
                    });
                }
            });
        }

        // 2. Non-streaming response (JSON)
        try {
            const response = await ChatLogic.processNonStreamingCompletion(body, startTime);
            return c.json(response);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
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
    }
}
