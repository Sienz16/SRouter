import type { ProviderCategory, ProviderProtocol } from "@srouter/types";

// ─── Provider base URLs ───

export const OPENAI_BASE_URL = "https://api.openai.com/v1";
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
export const NEOSANTARA_BASE_URL = "https://api.neosantara.xyz/v1";
export const COMMANDCODE_BASE_URL = "https://api.commandcode.ai/alpha/generate";
export const CODEX_BASE_URL = "https://chatgpt.com/backend-api/codex/responses";
export const CODEX_MODELS_URL = "https://chatgpt.com/backend-api/codex/models";
export const ANTIGRAVITY_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
export const ANTIGRAVITY_IDE_BASE_URL = "https://daily-cloudcode-pa.googleapis.com";
export const QODER_OPENAPI_BASE = "https://openapi.qoder.sh";
export const QODER_CENTER_BASE = "https://center.qoder.sh";
export const QODER_CHAT_BASE = "https://api3.qoder.sh";
export const QODER_CHAT_BASE_ALT = "https://api2.qoder.sh";
export const QODER_LOGIN_URL = "https://qoder.com/device/selectAccounts";
export const QODER_DEVICE_TOKEN_URL = `${QODER_OPENAPI_BASE}/api/v1/deviceToken/poll`;
export const QODER_USERINFO_URL = `${QODER_OPENAPI_BASE}/api/v1/userinfo`;
export const QODER_QUOTA_USAGE_URL = `${QODER_OPENAPI_BASE}/api/v2/quota/usage`;
export const QODER_REFRESH_TOKEN_URL = `${QODER_CENTER_BASE}/algo/api/v3/user/refresh_token`;
export const QODER_JOB_TOKEN_EXCHANGE_URL = `${QODER_OPENAPI_BASE}/api/v1/jobToken/exchange`;
export const QODER_CHAT_SIG_PATH = "/api/v2/service/pro/sse/agent_chat_generation";
export const QODER_CHAT_URL = `${QODER_CHAT_BASE}/algo${QODER_CHAT_SIG_PATH}?FetchKeys=llm_model_result&AgentId=agent_common`;
export const QODER_CHAT_URL_ENCODED = `${QODER_CHAT_URL}&Encode=1`;
export const QODER_MODEL_LIST_URL = `${QODER_CHAT_BASE}/algo/api/v2/model/list`;

export const QODER_IDE_VERSION = "1.0.0";
export const QODER_CLIENT_TYPE = "5";
export const QODER_DATA_POLICY = "disagree";
export const QODER_LOGIN_VERSION = "v2";
export const QODER_MACHINE_OS = "x86_64_windows";
export const QODER_MACHINE_TYPE = "5";

export const QODER_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDA8iMH5c02LilrsERw9t6Pv5Nc
4k6Pz1EaDicBMpdpxKduSZu5OANqUq8er4GM95omAGIOPOh+Nx0spthYA2BqGz+l
6HRkPJ7S236FZz73In/KVuLnwI8JJ2CbuJap8kvheCCZpmAWpb/cPx/3Vr/J6I17
XcW+ML9FoCI6AOvOzwIDAQAB
-----END PUBLIC KEY-----`;

// ─── Provider category metadata ───
export const PROVIDER_CATEGORIES: ProviderCategory[] = ["custom", "oauth", "free_tier", "api_key"];

export const CATEGORY_ORDER: ProviderCategory[] = ["oauth", "api_key", "free_tier", "custom"];

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
    oauth: "OAuth session",
    api_key: "API key",
    free_tier: "Free tier",
    custom: "Custom",
};

export const CATEGORY_DESCRIPTIONS: Record<ProviderCategory, string> = {
    oauth: "Signed in through a provider account rather than a key.",
    api_key: "Authenticated with a platform key you supply.",
    free_tier: "Free or rate-limited public endpoints.",
    custom: "Endpoints you registered on this gateway.",
};

export function isProviderCategory(value: string): value is ProviderCategory {
    return PROVIDER_CATEGORIES.includes(value as ProviderCategory);
}

// ─── Known provider catalog ───

/**
 * Built-in providers known to the gateway. This is the single source of truth
 * for provider ids and metadata; `seed.ts` derives its seed rows from here and
 * other consumers (registry, quota, token refresh) look providers up via the
 * helpers below instead of hardcoding ids.
 */
export interface KnownProvider {
    id: string;
    name: string;
    category: ProviderCategory;
    protocol: ProviderProtocol;
    baseUrl?: string;
    /** Model-id prefix override (e.g. openai_codex → "openai"). Defaults to id. */
    alias?: string;
    requiresApiKey: boolean;
    requiresOAuth?: boolean;
    supportsCustomUrl?: boolean;
    /** Shown when the driver has no active connection yet. */
    statusMessage: string;
}

export const KNOWN_PROVIDERS: KnownProvider[] = [
    {
        id: "kiro",
        name: "Kiro",
        category: "api_key",
        protocol: "custom",
        requiresApiKey: true,
        supportsCustomUrl: true,
        statusMessage: "Kiro credential missing",
    },
    {
        id: "neosantara",
        name: "Neosantara",
        category: "api_key",
        protocol: "openai",
        baseUrl: NEOSANTARA_BASE_URL,
        requiresApiKey: true,
        supportsCustomUrl: true,
        statusMessage: "Neosantara API key missing",
    },
    {
        id: "openai_codex",
        name: "OpenAI Codex / ChatGPT",
        category: "oauth",
        protocol: "openai",
        alias: "openai",
        requiresApiKey: false,
        requiresOAuth: true,
        statusMessage: "OAuth token missing",
    },
    {
        id: "anthropic",
        name: "Anthropic Claude",
        category: "oauth",
        protocol: "anthropic",
        alias: "claude",
        requiresApiKey: false,
        requiresOAuth: true,
        statusMessage: "OAuth token missing",
    },
    {
        id: "antigravity",
        name: "Google Antigravity",
        category: "oauth",
        protocol: "openai",
        baseUrl: ANTIGRAVITY_BASE_URL,
        requiresApiKey: false,
        requiresOAuth: true,
        statusMessage: "Antigravity OAuth token missing",
    },
    {
        id: "commandcode",
        name: "Command Code",
        category: "api_key",
        protocol: "openai",
        baseUrl: COMMANDCODE_BASE_URL,
        requiresApiKey: true,
        supportsCustomUrl: true,
        statusMessage: "Command Code API key missing",
    },
    {
        id: "qoder",
        name: "Qoder",
        category: "oauth",
        protocol: "openai",
        alias: "qd",
        baseUrl: QODER_CHAT_URL_ENCODED,
        requiresApiKey: false,
        requiresOAuth: true,
        supportsCustomUrl: true,
        statusMessage: "Qoder token or session missing",
    },
];

export const KNOWN_PROVIDER_MAP: Record<string, KnownProvider> = Object.fromEntries(
    KNOWN_PROVIDERS.map((provider) => [provider.id, provider]),
);

export function providerById(id: string): KnownProvider | undefined {
    return KNOWN_PROVIDER_MAP[id];
}

export function isKnownProvider(id: string): boolean {
    return KNOWN_PROVIDER_MAP[id] !== undefined;
}

/**
 * Collapse a provider account id to its base driver id (e.g.
 * openai_codex_1700000000 → openai, kiro-2 → kiro).
 */
export function providerBaseId(id: string): string {
    return id.split("_")[0]?.split("-")[0] ?? id;
}

/**
 * Whether `id` is the base id itself or a multi-account variant of it
 * (`${baseId}_…` or `${baseId}-…`).
 */
export function isProviderBaseId(id: string, baseId: string): boolean {
    return id === baseId || id.startsWith(`${baseId}_`) || id.startsWith(`${baseId}-`);
}

/** Model-id prefix for a base id, honoring the catalog `alias` override. */
export function providerAlias(baseId: string): string {
    return KNOWN_PROVIDER_MAP[baseId]?.alias ?? baseId;
}

/**
 * Resolve a model-id alias to a provider type. The stale "claude" alias is
 * preserved as a no-op for backward compatibility.
 */
export function providerTypeForAlias(alias: string): string | null {
    if (alias === "claude") return "claude";
    const provider = KNOWN_PROVIDERS.find((p) => p.alias === alias || p.id === alias);
    return provider ? provider.id : null;
}
