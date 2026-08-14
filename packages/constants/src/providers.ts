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
        requiresApiKey: false,
        requiresOAuth: true,
        statusMessage: "OAuth token missing",
    },
    {
        id: "antigravity",
        name: "Antigravity Cloud",
        category: "oauth",
        protocol: "openai",
        baseUrl: ANTIGRAVITY_BASE_URL,
        requiresApiKey: false,
        requiresOAuth: true,
        statusMessage: "Antigravity OAuth token missing",
    },
    {
        id: "groq",
        name: "Groq Cloud",
        category: "free_tier",
        protocol: "openai",
        requiresApiKey: true,
        statusMessage: "Groq API key missing",
    },
    {
        id: "openrouter",
        name: "OpenRouter Free",
        category: "free_tier",
        protocol: "openai",
        requiresApiKey: true,
        statusMessage: "OpenRouter API key missing",
    },
    {
        id: "openai_api_key",
        name: "OpenAI Platform API Key",
        category: "api_key",
        protocol: "openai",
        baseUrl: OPENAI_BASE_URL,
        requiresApiKey: true,
        statusMessage: "OpenAI API key missing",
    },
    {
        id: "anthropic_api_key",
        name: "Anthropic Platform API Key",
        category: "api_key",
        protocol: "anthropic",
        baseUrl: ANTHROPIC_BASE_URL,
        requiresApiKey: true,
        statusMessage: "Anthropic API key missing",
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
