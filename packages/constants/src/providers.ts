import type { ProviderCategory } from "@srouter/types";

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
