import type { Context } from "hono";
import { AuthLogic } from "../logic/auth.logic.js";

export interface OAuthCallbackBody {
    code?: string;
    state?: string;
    callbackUrl?: string;
}

export interface TokenImportBody {
    accessToken: string;
    refreshToken?: string;
    name?: string;
}

export class AuthController {
    // Initiate OAuth PKCE Login Flow
    public static loginOpenAI(c: Context): Response {
        const customClientId = c.req.query("client_id") || undefined;
        const redirectUri = c.req.query("redirect_uri") || undefined;

        const result = AuthLogic.initiateOAuthPKCE({
            clientId: customClientId,
            redirectUri,
        });

        if (c.req.query("format") === "json") {
            return c.json(result);
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
            return c.json(
                {
                    error: {
                        message: "Missing required 'code' or 'state' parameters in OAuth callback",
                    },
                },
                400,
            );
        }

        try {
            const providerConfig = await AuthLogic.processOAuthCallback(code, state);

            if (c.req.method === "POST" || c.req.header("accept")?.includes("application/json")) {
                return c.json({
                    success: true,
                    message: "Login OpenAI Codex Berhasil!",
                    provider: providerConfig,
                });
            }

            return c.html(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>SRouter - OpenAI Login Success</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
                        .icon { font-size: 3rem; margin-bottom: 1rem; }
                        h2 { margin-top: 0; color: #38bdf8; }
                        p { color: #94a3b8; line-height: 1.6; }
                        .badge { background: #059669; color: white; font-weight: 600; padding: 0.5rem 1rem; border-radius: 9999px; display: inline-block; margin-top: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="icon">🎉</div>
                        <h2>Login OpenAI Codex Berhasil!</h2>
                        <p>Access token & Refresh token telah <strong>tersimpan secara otomatis ke database SQLite (srouter.db)</strong>.</p>
                        <div class="badge">SRouter Ready</div>
                    </div>
                </body>
                </html>
            `);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            return c.json({ error: { message: errorMessage } }, 500);
        }
    }

    // Helper for Token Importing
    public static async importToken(c: Context): Promise<Response> {
        let body: TokenImportBody;
        try {
            body = await c.req.json<TokenImportBody>();
        } catch {
            return c.json({ error: { message: "Invalid JSON body" } }, 400);
        }

        if (!body.accessToken) {
            return c.json({ error: { message: "Field 'accessToken' is required" } }, 400);
        }

        const providerConfig = AuthLogic.processTokenImport(body);

        return c.json(
            {
                success: true,
                message: "OpenAI Codex Access Token registered and saved directly to SQLite database!",
                provider: providerConfig,
            },
            201,
        );
    }
}
