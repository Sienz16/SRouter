import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface ErrorResponseOptions {
    type?: string;
    code?: string;
    param?: string;
}

export interface OpenAIErrorPayload {
    error: {
        message: string;
        type: string;
        code?: string;
        param?: string;
    };
}

/**
 * Formats an OpenAI-compliant error payload object.
 */
export function formatErrorPayload(
    message: string,
    options: ErrorResponseOptions = {}
): OpenAIErrorPayload {
    return {
        error: {
            message,
            type: options.type ?? "api_error",
            ...(options.code ? { code: options.code } : {}),
            ...(options.param ? { param: options.param } : {})
        }
    };
}

/**
 * Returns a Hono JSON Response for successful operations.
 */
export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200): Response {
    return c.json(data, status);
}

/**
 * Returns a Hono JSON Response in OpenAI-compliant error format.
 */
export function err(
    c: Context,
    message: string,
    status: ContentfulStatusCode = 500,
    options: ErrorResponseOptions = {}
): Response {
    return c.json(formatErrorPayload(message, options), status);
}
