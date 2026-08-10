import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import type { ChatCompletionRequest } from "@srouter/types";
import { ChatLogic } from "@/logic/chat.logic.js";
import { err, formatErrorPayload, ok } from "@/utils/response.js";

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
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    await stream.writeSSE({
                        data: JSON.stringify(formatErrorPayload(errorMessage || "Error occurred during streaming")),
                    });
                }
            });
        }

        // 2. Non-streaming response (JSON)
        try {
            const response = await ChatLogic.processNonStreamingCompletion(body, startTime);
            return ok(c, response);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err(c, errorMessage || "Internal server error", 500);
        }
    }
}
