import { Hono, type Context } from "hono";
import { upsertProviderDB } from "@srouter/db";
import {
    generatePKCE,
    OpenAICodexOAuth,
    OpenAIProvider,
} from "@srouter/providers";
import { registry } from "../../services/registry.js";

export const authRoute = new Hono();

export interface PKCESession {
    codeVerifier: string;
    clientId: string;
    redirectUri: string;
    createdAt: number;
}

// In-memory PKCE session store keyed by state
const pkceSessions = new Map<string, PKCESession>();

function cleanupExpiredSessions(): void {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000;
    for (const [state, session] of pkceSessions.entries()) {
        if (now - session.createdAt > maxAge) {
            pkceSessions.delete(state);
        }
    }
}

// 1. GET /v1/auth/openai/login - Initiate OAuth PKCE Login Flow
authRoute.get("/auth/openai/login", (c) => {
    cleanupExpiredSessions();
    const customClientId =
        c.req.query("client_id") || "app_EMoamEEZ73f0CkXaXp7hrann";
    const redirectUri =
        c.req.query("redirect_uri") || "http://localhost:1455/auth/callback";

    const oauthInstance = new OpenAICodexOAuth({
        clientId: customClientId,
        redirectUri,
    });

    const pkce = generatePKCE();
    pkceSessions.set(pkce.state, {
        codeVerifier: pkce.codeVerifier,
        clientId: customClientId,
        redirectUri,
        createdAt: Date.now(),
    });

    const authorizeUrl = oauthInstance.getAuthorizationUrl(pkce);

    // If client prefers JSON response vs HTTP redirect
    if (c.req.query("format") === "json") {
        return c.json({
            authorizeUrl,
            state: pkce.state,
            codeVerifier: pkce.codeVerifier,
            redirectUri,
        });
    }

    return c.redirect(authorizeUrl);
});

// Callback handler reusable by both port 3000 (/v1/auth/openai/callback) and port 1455 (/auth/callback)
export async function handleOAuthCallback(c: Context) {
    cleanupExpiredSessions();
    const code = c.req.query("code");
    const state = c.req.query("state");

    if (!code || !state) {
        return c.json(
            {
                error: {
                    message:
                        "Missing required 'code' or 'state' parameters in OAuth callback",
                },
            },
            400,
        );
    }

    const session = pkceSessions.get(state);
    if (!session) {
        return c.json(
            { error: { message: "Invalid or expired OAuth state parameter" } },
            400,
        );
    }

    pkceSessions.delete(state);

    try {
        const oauthInstance = new OpenAICodexOAuth({
            clientId: session.clientId,
            redirectUri: session.redirectUri,
        });
        const tokens = await oauthInstance.exchangeCodeForTokens(
            code,
            session.codeVerifier,
        );

        // 1. Save directly to SQLite database
        const providerConfig = upsertProviderDB({
            id: "openai_codex",
            providerId: "openai_codex",
            name: "OpenAI Codex (OAuth)",
            category: "oauth",
            protocol: "openai",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            enabled: true,
            createdAt: Date.now(),
        });

        // 2. Register active OpenAIProvider with access token in memory registry
        const providerInstance = new OpenAIProvider({
            id: "openai_codex",
            name: "OpenAI Codex (OAuth)",
            accessToken: tokens.accessToken,
        });
        registry.registerProvider(providerInstance);

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

// 2. GET /v1/auth/openai/callback - OAuth Callback Receiver (Direct DB Save)
authRoute.get("/auth/openai/callback", (c) => handleOAuthCallback(c));

// Helper for Token Importing
const handleTokenImport = async (c: Context) => {
    let body: { accessToken: string; refreshToken?: string; name?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: { message: "Invalid JSON body" } }, 400);
    }

    if (!body.accessToken) {
        return c.json(
            { error: { message: "Field 'accessToken' is required" } },
            400,
        );
    }

    const providerName = body.name || "OpenAI Codex (OAuth Token)";

    // 1. Save directly to SQLite database
    const providerConfig = upsertProviderDB({
        id: "openai_codex",
        providerId: "openai_codex",
        name: providerName,
        category: "oauth",
        protocol: "openai",
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        enabled: true,
        createdAt: Date.now(),
    });

    // 2. Register in memory registry
    const providerInstance = new OpenAIProvider({
        id: "openai_codex",
        name: providerName,
        accessToken: body.accessToken,
    });
    registry.registerProvider(providerInstance);

    return c.json(
        {
            success: true,
            message:
                "OpenAI Codex Access Token registered and saved directly to SQLite database!",
            provider: providerConfig,
        },
        201,
    );
};

// 3. POST /v1/auth/openai/token & POST /v1/auth/openai/import-token (9Router-style token import)
authRoute.post("/auth/openai/token", handleTokenImport);
authRoute.post("/auth/openai/import-token", handleTokenImport);
