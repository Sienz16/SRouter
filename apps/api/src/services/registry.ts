import { getAllProvidersDB } from "@srouter/db";
import { AnthropicProvider, MockProvider, OpenAIProvider, OpenRouterProvider, ProviderRegistry } from "@srouter/providers";

// Create a global ProviderRegistry instance with Mock fallback
export const registry = new ProviderRegistry(new MockProvider());

// 1. Register OpenRouter Provider for live public model listing
registry.registerProvider(new OpenRouterProvider());

// 2. Register env-configured OpenAI Provider if present
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

// 3. Register env-configured Anthropic Provider if present
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

            if (p.providerId === "openai_codex" || p.providerId === "openai" || p.providerId === "custom_openai") {
                registry.registerProvider(
                    new OpenAIProvider({
                        id: p.providerId,
                        name: p.name,
                        baseUrl: p.baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                    }),
                );
            } else if (p.providerId === "anthropic" || p.providerId === "custom_anthropic") {
                registry.registerProvider(
                    new AnthropicProvider({
                        id: p.providerId,
                        name: p.name,
                        baseUrl: p.baseUrl,
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
