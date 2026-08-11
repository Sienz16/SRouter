import type { Context } from "hono";
import { AuthLogic } from "@/logic/auth.logic.js";
import { err, ok } from "@/utils/response.js";

export interface OAuthCallbackBody {
    code?: string;
    state?: string;
    callbackUrl?: string;
}

export interface TokenImportBody {
    accessToken: string;
    refreshToken?: string;
    baseUrl?: string;
    name?: string;
}

export class AuthController {
    // Initiate OAuth PKCE Login Flow
    public static loginOpenAI(c: Context): Response {
        const customClientId = c.req.query("client_id") || undefined;
        const redirectUri = c.req.query("redirect_uri") || undefined;
        const prompt = c.req.query("prompt") || undefined;

        const result = AuthLogic.initiateOAuthPKCE({
            clientId: customClientId,
            redirectUri,
            prompt,
        });

        if (c.req.query("format") === "json") {
            return ok(c, result);
        }

        return c.redirect(result.authorizeUrl);
    }

    // Callback handler reusable by both main app and secondary OAuth listener (port 1455)
    public static async handleOAuthCallback(c: Context): Promise<Response> {
        let code = c.req.query("code") || undefined;
        let state = c.req.query("state") || undefined;

        if ((!code || !state) && c.req.method === "POST") {
            try {
                const body = await c.req.json<OAuthCallbackBody>();
                if (body.callbackUrl) {
                    try {
                        const parsedUrl = new URL(body.callbackUrl);
                        code = code || parsedUrl.searchParams.get("code") || undefined;
                        state = state || parsedUrl.searchParams.get("state") || undefined;
                    } catch {
                        // Ignore invalid URL string
                    }
                }
                code = code || body.code;
                state = state || body.state;
            } catch {
                // Ignore JSON parse error
            }
        }

        if (!code || !state) {
            return err(c, "Missing required 'code' or 'state' parameters in OAuth callback", 400, {
                type: "invalid_request_error",
            });
        }

        try {
            const providerConfig = await AuthLogic.processOAuthCallback(code, state);

            if (c.req.method === "POST" || c.req.header("accept")?.includes("application/json")) {
                return ok(c, {
                    success: true,
                    message: "Login OpenAI Codex Berhasil!",
                    provider: providerConfig,
                });
            }

            return c.json({
                success: true,
                message: "Login OpenAI Codex Berhasil!",
                provider: providerConfig,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err(c, errorMessage, 500);
        }
    }

    // Helper for Token Importing
    public static async importToken(c: Context): Promise<Response> {
        let body: TokenImportBody;
        try {
            body = await c.req.json<TokenImportBody>();
        } catch {
            return err(c, "Invalid JSON body", 400, { type: "invalid_request_error" });
        }

        if (!body.accessToken) {
            return err(c, "Field 'accessToken' is required", 400, { type: "invalid_request_error" });
        }

        const providerConfig = AuthLogic.processTokenImport(body);

        return ok(
            c,
            {
                success: true,
                message: "OpenAI Codex Access Token registered and saved directly to SQLite database!",
                provider: providerConfig,
            },
            201,
        );
    }

    // --- Antigravity OAuth Handlers ---
    public static loginAntigravity(c: Context): Response {
        const customClientId = c.req.query("client_id") || undefined;
        const redirectUri = c.req.query("redirect_uri") || undefined;
        const prompt = c.req.query("prompt") || undefined;

        try {
            const result = AuthLogic.initiateAntigravityOAuthPKCE({
                clientId: customClientId,
                redirectUri,
                prompt,
            });

            if (c.req.query("format") === "json") {
                return ok(c, result);
            }

            return c.redirect(result.authorizeUrl);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err(c, errorMessage, 400, { type: "invalid_request_error" });
        }
    }

    public static async handleAntigravityOAuthCallback(c: Context): Promise<Response> {
        let code = c.req.query("code") || undefined;
        let state = c.req.query("state") || undefined;

        if ((!code || !state) && c.req.method === "POST") {
            try {
                const body = await c.req.json<OAuthCallbackBody>();
                if (body.callbackUrl) {
                    try {
                        const parsedUrl = new URL(body.callbackUrl);
                        code = code || parsedUrl.searchParams.get("code") || undefined;
                        state = state || parsedUrl.searchParams.get("state") || undefined;
                    } catch {
                        // Ignore invalid URL string
                    }
                }
                code = code || body.code;
                state = state || body.state;
            } catch {
                // Ignore JSON parse error
            }
        }

        if (!code || !state) {
            return err(c, "Missing required 'code' or 'state' parameters in OAuth callback", 400, {
                type: "invalid_request_error",
            });
        }

        try {
            const providerConfig = await AuthLogic.processAntigravityOAuthCallback(code, state);

            if (c.req.method === "POST" || c.req.header("accept")?.includes("application/json")) {
                return ok(c, {
                    success: true,
                    message: "Login Antigravity OAuth Berhasil!",
                    provider: providerConfig,
                });
            }

            return c.json({
                success: true,
                message: "Login Antigravity OAuth Berhasil!",
                provider: providerConfig,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err(c, errorMessage, 500);
        }
    }

    public static async importAntigravityToken(c: Context): Promise<Response> {
        let body: TokenImportBody;
        try {
            body = await c.req.json<TokenImportBody>();
        } catch {
            return err(c, "Invalid JSON body", 400, { type: "invalid_request_error" });
        }

        if (!body.accessToken) {
            return err(c, "Field 'accessToken' is required", 400, { type: "invalid_request_error" });
        }

        const providerConfig = AuthLogic.processAntigravityTokenImport(body);

        return ok(
            c,
            {
                success: true,
                message: "Antigravity Access Token registered and saved directly to SQLite database!",
                provider: providerConfig,
            },
            201,
        );
    }

    // --- CommandCode Provider Handlers ---
    public static async importCommandCodeToken(c: Context): Promise<Response> {
        let body: TokenImportBody;
        try {
            body = await c.req.json<TokenImportBody>();
        } catch {
            return err(c, "Invalid JSON body", 400, { type: "invalid_request_error" });
        }

        if (!body.accessToken) {
            return err(c, "Field 'accessToken' is required", 400, { type: "invalid_request_error" });
        }

        const providerConfig = AuthLogic.processCommandCodeTokenImport(body);

        return ok(
            c,
            {
                success: true,
                message: "Command Code API Key registered and saved directly to SQLite database!",
                provider: providerConfig,
            },
            201,
        );
    }

    // --- Anthropic Provider Handlers ---
    public static async importAnthropicToken(c: Context): Promise<Response> {
        let body: TokenImportBody;
        try {
            body = await c.req.json<TokenImportBody>();
        } catch {
            return err(c, "Invalid JSON body", 400, { type: "invalid_request_error" });
        }

        if (!body.accessToken) {
            return err(c, "Field 'accessToken' is required", 400, { type: "invalid_request_error" });
        }

        const providerConfig = AuthLogic.processAnthropicTokenImport(body);

        return ok(
            c,
            {
                success: true,
                message: "Anthropic API Key registered and saved directly to SQLite database!",
                provider: providerConfig,
            },
            201,
        );
    }
}
