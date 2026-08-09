import { zValidator } from "@hono/zod-validator";
import type { ZodSchema } from "zod";

/**
 * Custom Hono Zod JSON validation middleware
 * Ensures all validation errors return OpenAI-standard error JSON format
 */
export function validateJson<T extends ZodSchema>(schema: T) {
    return zValidator("json", schema, (result, c) => {
        if (!result.success) {
            const firstIssue = result.error.issues[0];
            const param = firstIssue.path.join(".") || undefined;

            return c.json(
                {
                    error: {
                        message: firstIssue.message,
                        type: "invalid_request_error",
                        param,
                        code: firstIssue.code,
                    },
                },
                400,
            );
        }
    });
}
