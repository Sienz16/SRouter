import { Hono } from "hono";
import { upsertProviderDB } from "@srouter/db";
import {
    generatePKCE,
    OpenAICodexOAuth,
    OpenAIProvider,
} from "@srouter/providers";
import { registry } from "../../services/registry.js";

export const authRoute = new Hono();

// In-memory PKCE session store keyed by state
const pkceSessions = new Map<
    string,
    { codeVerifier: string; createdAt: number }
>();

const oauth = new OpenAICodexOAuth();

// 1. GET /v1/auth/openai/login - Initiate OAuth PKCE Login Flow
authRoute.get("/auth/openai/login", (c) => {
    const pkce = generatePKCE();
    pkceSessions.set(pkce.state, {
        codeVerifier: pkce.codeVerifier,
        createdAt: Date.now(),
    });

    const authorizeUrl = oauth.getAuthorizationUrl(pkce);

    // If client prefers JSON response vs HTTP redirect
    if (c.req.query("format") === "json") {
        return c.json({
            authorizeUrl,
            state: pkce.state,
            codeVerifier: pkce.codeVerifier,
        });
    }

    return c.redirect(authorizeUrl);
});

// 2. GET /v1/auth/openai/callback - OAuth Callback Receiver (Direct DB Save)
authRoute.get("/auth/openai/callback", async (c) => {
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
        const tokens = await oauth.exchangeCodeForTokens(
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

        return c.json({
            success: true,
            message:
                "Successfully authenticated with OpenAI Codex! Tokens automatically saved to SQLite database.",
            provider: providerConfig,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return c.json({ error: { message: errorMessage } }, 500);
    }
});

// 3. POST /v1/auth/openai/token - Manual Access Token Direct DB Save
authRoute.post("/auth/openai/token", async (c) => {
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

    const providerName = body.name || "OpenAI Codex (Manual Token)";

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
});
