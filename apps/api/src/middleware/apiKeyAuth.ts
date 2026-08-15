import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import {
    adminAuthStore,
    getAPIKeyByKeyDB,
    getRequireApiKeyDB,
    type AdminAuthStore,
} from "@srouter/db";
import { err } from "@/utils/response.js";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/services/adminAuth.js";

export interface ApiKeyAuthOptions {
    store?: AdminAuthStore;
    now?: () => number;
}

export function createApiKeyAuth(options: ApiKeyAuthOptions = {}) {
    const store = options.store ?? adminAuthStore;
    const now = options.now ?? (() => Date.now());

    return async function apiKeyAuth(c: Context, next: Next) {
        if (verifyAdminSession(store, getCookie(c, ADMIN_SESSION_COOKIE), now())) {
            c.set("authType", "admin_session");
            return await next();
        }

        const isRequired = getRequireApiKeyDB();
        const authHeader = c.req.header("Authorization") || c.req.header("authorization");
        const xApiKey =
            c.req.header("x-api-key") || c.req.header("X-Api-Key") || c.req.header("X-API-KEY");

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
                c.set("authType", "api_key");
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
    };
}

export const apiKeyAuth = createApiKeyAuth();
