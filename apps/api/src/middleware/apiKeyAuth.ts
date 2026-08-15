import type { Context, Next } from "hono";
import { getAPIKeyByKeyDB, getRequireApiKeyDB } from "@srouter/db";
import { err } from "@/utils/response.js";

export async function apiKeyAuth(c: Context, next: Next) {
    const isRequired = getRequireApiKeyDB();
    const authHeader = c.req.header("Authorization") || c.req.header("authorization");
    const xApiKey =
        c.req.header("x-api-key") || c.req.header("X-Api-Key") || c.req.header("X-API-KEY");
    const clientHeader = c.req.header("X-SRouter-Client") || c.req.header("x-srouter-client");

    // Allow internal web playground / dashboard requests
    if (clientHeader === "web-internal" || clientHeader === "playground") {
        return await next();
    }

    let bearerKey: string | null = null;
    if (xApiKey) {
        bearerKey = xApiKey.trim();
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
        bearerKey = authHeader.slice(7).trim();
    } else if (authHeader) {
        bearerKey = authHeader.trim();
    }

    if (bearerKey) {
        const apiKeyRow = getAPIKeyByKeyDB(bearerKey);
        if (apiKeyRow) {
            if (!apiKeyRow.enabled) {
                return err(c, "The provided SRouter API Key is disabled", 401, {
                    type: "invalid_request_error",
                    code: "api_key_disabled",
                });
            }
            c.set("apiKeyRow", apiKeyRow);
            return await next();
        }

        // If a key was provided but not found in DB and auth is required
        if (isRequired) {
            return err(c, "Invalid SRouter API Key", 401, {
                type: "invalid_request_error",
                code: "invalid_api_key",
            });
        }
    }

    if (isRequired && !bearerKey) {
        return err(
            c,
            "Missing SRouter API Key. Please provide a valid key via 'Authorization: Bearer <key>' header or disable 'Require API Key' in Settings.",
            401,
            {
                type: "invalid_request_error",
                code: "missing_api_key",
            },
        );
    }

    return await next();
}
