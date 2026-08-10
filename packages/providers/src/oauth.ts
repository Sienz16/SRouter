import crypto from "node:crypto";

export interface OAuthTokenResponse {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
    tokenType: string;
}

export interface PKCEPair {
    codeVerifier: string;
    codeChallenge: string;
    state: string;
}

/**
 * Generates PKCE code_verifier and S256 code_challenge
 */
export function generatePKCE(): PKCEPair {
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const state = crypto.randomBytes(16).toString("base64url");
    const hash = crypto.createHash("sha256").update(codeVerifier).digest();
    const codeChallenge = hash.toString("base64url");

    return {
        codeVerifier,
        codeChallenge,
        state,
    };
}

export interface OpenAIOAuthOptions {
    clientId?: string;
    redirectUri?: string;
    scope?: string;
    authorizeUrl?: string;
    tokenUrl?: string;
    prompt?: string;
}

export class OpenAICodexOAuth {
    private clientId: string;
    private redirectUri: string;
    private scope: string;
    private authorizeUrl: string;
    private tokenUrl: string;
    private prompt?: string;

    constructor(options: OpenAIOAuthOptions = {}) {
        // Official OpenAI OAuth Public Client ID (from Context7 openai-oauth docs)
        this.clientId = options.clientId ?? process.env.OPENAI_OAUTH_CLIENT_ID ?? "app_EMoamEEZ73f0CkXaXp7hrann";
        this.redirectUri = options.redirectUri ?? process.env.OPENAI_OAUTH_REDIRECT_URI ?? "http://localhost:1455/auth/callback";
        this.scope = options.scope ?? "openid profile email offline_access";
        this.authorizeUrl = options.authorizeUrl ?? "https://auth.openai.com/oauth/authorize";
        this.tokenUrl = options.tokenUrl ?? "https://auth.openai.com/oauth/token";
        this.prompt = options.prompt ?? process.env.OPENAI_OAUTH_PROMPT ?? "login";
    }

    /**
     * Generates PKCE parameters and returns authorization URL (Context7 OpenAI OAuth Compliant)
     */
    getAuthorizationUrl(pkce: PKCEPair): string {
        const params: Record<string, string> = {
            response_type: "code",
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
            code_challenge: pkce.codeChallenge,
            code_challenge_method: "S256",
            state: pkce.state,
        };

        if (this.prompt) {
            params.prompt = this.prompt;
        }

        const queryString = Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join("&");

        return `${this.authorizeUrl}?${queryString}`;
    }

    /**
     * Exchanges authorization code and code_verifier for Access Token
     */
    async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthTokenResponse> {
        const res = await fetch(this.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: this.clientId,
                code,
                code_verifier: codeVerifier,
                redirect_uri: this.redirectUri,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`OpenAI OAuth Exchange Failed (${res.status}): ${errorText}`);
        }

        const data = (await res.json()) as {
            access_token: string;
            refresh_token?: string;
            id_token?: string;
            expires_in?: number;
            token_type?: string;
        };

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            idToken: data.id_token,
            expiresIn: data.expires_in,
            tokenType: data.token_type ?? "Bearer",
        };
    }

    /**
     * Refreshes an expired access token using refresh_token
     */
    async refreshTokens(refreshToken: string): Promise<OAuthTokenResponse> {
        const res = await fetch(this.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: this.clientId,
                refresh_token: refreshToken,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`OpenAI OAuth Refresh Failed (${res.status}): ${errorText}`);
        }

        const data = (await res.json()) as {
            access_token: string;
            refresh_token?: string;
            expires_in?: number;
            token_type?: string;
        };

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
            expiresIn: data.expires_in,
            tokenType: data.token_type ?? "Bearer",
        };
    }
}
