import { getAllProvidersDB } from "@srouter/db";
import { AntigravityProvider, AnthropicProvider, OpenAIProvider, ProviderRegistry } from "@srouter/providers";

// Create a global ProviderRegistry instance
export const registry = new ProviderRegistry();

// 1. Register env-configured OpenAI Provider if present
if (process.env.OPENAI_API_KEY) {
    registry.registerProvider(
        new OpenAIProvider({
            id: "openai",
            name: "OpenAI",
            apiKey: process.env.OPENAI_API_KEY,
            baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        }),
    );
}

// 2. Register env-configured Anthropic Provider if present
if (process.env.ANTHROPIC_API_KEY) {
    registry.registerProvider(
        new AnthropicProvider({
            id: "anthropic",
            name: "Anthropic",
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1",
        }),
    );
}

/**
 * Load saved OAuth & Custom providers from SQLite Database on startup
 */
export function loadSavedProvidersFromDB(): void {
    try {
        const savedProviders = getAllProvidersDB();
        for (const p of savedProviders) {
            if (!p.enabled) continue;

            const providerType = p.providerId || p.id;
            const baseUrl = p.baseUrl || (providerType === "antigravity" || p.id.startsWith("antigravity") ? process.env.ANTIGRAVITY_BASE_URL : undefined);

            if (providerType === "antigravity" || p.id.startsWith("antigravity")) {
                registry.registerProvider(
                    new AntigravityProvider({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                    }),
                );
            } else if (p.protocol === "openai" || p.category === "oauth" || providerType === "openai_codex" || providerType === "openai" || providerType === "custom_openai") {
                registry.registerProvider(
                    new OpenAIProvider({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                    }),
                );
            } else if (p.protocol === "anthropic" || providerType === "anthropic" || providerType === "custom_anthropic") {
                registry.registerProvider(
                    new AnthropicProvider({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                    }),
                );
            }
        }
    } catch {
        // database load fallback
    }
}

// Auto load saved DB providers
loadSavedProvidersFromDB();
