import {
    DEFAULT_PROVIDERS,
    isSeedProvider,
    NEOSANTARA_BASE_URL,
    SEED_MARKER,
} from "@srouter/constants";
import { getAllProvidersDB, upsertProviderDB } from "@srouter/db";
import {
    AntigravityExecutor,
    AnthropicExecutor,
    CodexExecutor,
    CommandCodeExecutor,
    KiroExecutor,
    OpenAIExecutor,
} from "@srouter/executors";
import { ProviderRegistry } from "@srouter/providers";

// Create a global ProviderRegistry instance
export const registry = new ProviderRegistry();

/**
 * Seed built-in driver rows into the providers table on first startup, so the
 * dashboard catalog is DB-driven but never empty. Rows are flagged with the
 * seed marker so they are not treated as real connections.
 */
export function seedDefaultProviders(): void {
    if (getAllProvidersDB().length > 0) return;

    const now = Date.now();
    for (const seed of DEFAULT_PROVIDERS) {
        upsertProviderDB({
            id: seed.id,
            providerId: seed.id,
            name: seed.name,
            category: seed.category,
            protocol: seed.protocol,
            baseUrl: seed.baseUrl,
            enabled: true,
            providerSpecificData: { [SEED_MARKER]: "true" },
            createdAt: now,
        });
    }
}

/**
 * Load saved OAuth & Custom providers from SQLite Database on startup
 */
export function loadSavedProvidersFromDB(): void {
    const savedProviders = getAllProvidersDB();
    for (const p of savedProviders) {
        if (!p.enabled) continue;
        // Seed rows describe drivers, not connections; they never get executors.
        if (isSeedProvider(p)) continue;

        const providerType = p.providerId || p.id;
        const baseUrl = p.baseUrl;

        switch (true) {
            case providerType === "kiro" || p.id.startsWith("kiro"):
                registry.registerProvider(
                    new KiroExecutor({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                        refreshToken: p.refreshToken,
                        providerSpecificData: p.providerSpecificData,
                    }),
                );
                break;
            case providerType === "commandcode" || p.id.startsWith("commandcode"):
                registry.registerProvider(
                    new CommandCodeExecutor({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                    }),
                );
                break;
            case providerType === "antigravity" || p.id.startsWith("antigravity"):
                registry.registerProvider(
                    new AntigravityExecutor({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                        refreshToken: p.refreshToken,
                    }),
                );
                break;
            case providerType === "openai_codex" || p.id.startsWith("openai_codex"):
                registry.registerProvider(
                    new CodexExecutor({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                        refreshToken: p.refreshToken,
                        accountId: p.accountId,
                    }),
                );
                break;
            case providerType === "neosantara" || p.id.startsWith("neosantara"):
                registry.registerProvider(
                    new OpenAIExecutor({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl: baseUrl || NEOSANTARA_BASE_URL,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                    }),
                );
                break;
            case p.protocol === "openai" ||
                p.category === "oauth" ||
                providerType === "openai_codex" ||
                providerType === "openai" ||
                providerType === "custom_openai":
                registry.registerProvider(
                    new OpenAIExecutor({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                    }),
                );
                break;
            case p.protocol === "anthropic" ||
                providerType === "anthropic" ||
                providerType === "custom_anthropic":
                registry.registerProvider(
                    new AnthropicExecutor({
                        id: p.id || p.providerId,
                        name: p.name,
                        baseUrl,
                        apiKey: p.apiKey,
                        accessToken: p.accessToken,
                    }),
                );
                break;
            default:
                break;
        }
    }
}

// Seed built-in driver rows, then auto load saved DB providers
seedDefaultProviders();
loadSavedProvidersFromDB();
