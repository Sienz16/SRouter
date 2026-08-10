import type { OAuthTokenResponse, PKCEPair } from "./base.js";

export interface AntigravityOAuthOptions {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scope?: string;
    authorizeUrl?: string;
    tokenUrl?: string;
    prompt?: string;
}

export class AntigravityOAuth {
    private clientId: string;
    private clientSecret?: string;
    private redirectUri: string;
    private scope: string;
    private authorizeUrl: string;
    private tokenUrl: string;
    private prompt?: string;

    constructor(options: AntigravityOAuthOptions = {}) {
        // Official Antigravity Google OAuth Public Client ID & Secret (used by 9router, opencode, OpenClaw)
        this.clientId = options.clientId ?? process.env.ANTIGRAVITY_OAUTH_CLIENT_ID ?? "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com";
        this.clientSecret = options.clientSecret ?? process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET ?? "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";
        this.redirectUri = options.redirectUri ?? process.env.ANTIGRAVITY_OAUTH_REDIRECT_URI ?? "http://localhost:1455/auth/antigravity/callback";
        this.scope = options.scope ?? process.env.ANTIGRAVITY_OAUTH_SCOPE ?? "openid profile email https://www.googleapis.com/auth/cloud-platform";
        this.authorizeUrl = options.authorizeUrl ?? process.env.ANTIGRAVITY_OAUTH_AUTHORIZE_URL ?? "https://accounts.google.com/o/oauth2/v2/auth";
        this.tokenUrl = options.tokenUrl ?? process.env.ANTIGRAVITY_OAUTH_TOKEN_URL ?? "https://oauth2.googleapis.com/token";
        this.prompt = options.prompt ?? process.env.ANTIGRAVITY_OAUTH_PROMPT ?? "consent";
    }

    /**
     * Generates PKCE parameters and returns authorization URL for Google Antigravity OAuth
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
            access_type: "offline",
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
        const params: Record<string, string> = {
            grant_type: "authorization_code",
            client_id: this.clientId,
            code,
            code_verifier: codeVerifier,
            redirect_uri: this.redirectUri,
        };

        if (this.clientSecret) {
            params.client_secret = this.clientSecret;
        }

        const res = await fetch(this.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(params),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Antigravity OAuth Exchange Failed (${res.status}): ${errorText}`);
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
        const params: Record<string, string> = {
            grant_type: "refresh_token",
            client_id: this.clientId,
            refresh_token: refreshToken,
        };

        if (this.clientSecret) {
            params.client_secret = this.clientSecret;
        }

        const res = await fetch(this.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(params),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Antigravity OAuth Refresh Failed (${res.status}): ${errorText}`);
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
