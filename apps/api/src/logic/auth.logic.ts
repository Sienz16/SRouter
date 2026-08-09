import { upsertProviderDB } from "@srouter/db";
import { generatePKCE, OpenAICodexOAuth, OpenAIProvider, type PKCEPair } from "@srouter/providers";
import type { ProviderConfig } from "@srouter/types";
import { registry } from "../services/registry.js";

export interface PKCESession {
    codeVerifier: string;
    clientId: string;
    redirectUri: string;
    createdAt: number;
}

export interface OAuthLoginParams {
    clientId?: string;
    redirectUri?: string;
}

export interface OAuthLoginResult {
    authorizeUrl: string;
    state: string;
    codeVerifier: string;
    redirectUri: string;
}

export interface TokenImportParams {
    accessToken: string;
    refreshToken?: string;
    name?: string;
}

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

export class AuthLogic {
    public static initiateOAuthPKCE(params: OAuthLoginParams): OAuthLoginResult {
        cleanupExpiredSessions();
        const clientId = params.clientId || "app_EMoamEEZ73f0CkXaXp7hrann";
        const redirectUri = params.redirectUri || "http://localhost:1455/auth/callback";

        const oauthInstance = new OpenAICodexOAuth({
            clientId,
            redirectUri,
        });

        const pkce: PKCEPair = generatePKCE();
        pkceSessions.set(pkce.state, {
            codeVerifier: pkce.codeVerifier,
            clientId,
            redirectUri,
            createdAt: Date.now(),
        });

        const authorizeUrl = oauthInstance.getAuthorizationUrl(pkce);

        return {
            authorizeUrl,
            state: pkce.state,
            codeVerifier: pkce.codeVerifier,
            redirectUri,
        };
    }

    public static async processOAuthCallback(code: string, state: string): Promise<ProviderConfig> {
        cleanupExpiredSessions();

        const session = pkceSessions.get(state);
        if (!session) {
            throw new Error("Invalid or expired OAuth state parameter");
        }

        pkceSessions.delete(state);

        const oauthInstance = new OpenAICodexOAuth({
            clientId: session.clientId,
            redirectUri: session.redirectUri,
        });

        const tokens = await oauthInstance.exchangeCodeForTokens(code, session.codeVerifier);

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

        const providerInstance = new OpenAIProvider({
            id: "openai_codex",
            name: "OpenAI Codex (OAuth)",
            accessToken: tokens.accessToken,
        });
        registry.registerProvider(providerInstance);

        return providerConfig;
    }

    public static processTokenImport(params: TokenImportParams): ProviderConfig {
        const providerName = params.name || "OpenAI Codex (OAuth Token)";

        const providerConfig = upsertProviderDB({
            id: "openai_codex",
            providerId: "openai_codex",
            name: providerName,
            category: "oauth",
            protocol: "openai",
            accessToken: params.accessToken,
            refreshToken: params.refreshToken,
            enabled: true,
            createdAt: Date.now(),
        });

        const providerInstance = new OpenAIProvider({
            id: "openai_codex",
            name: providerName,
            accessToken: params.accessToken,
        });
        registry.registerProvider(providerInstance);

        return providerConfig;
    }
}
