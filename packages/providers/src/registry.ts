import {
    isProviderBaseId,
    providerAlias,
    providerBaseId,
    providerTypeForAlias
} from "@srouter/constants";
import type {
    AIProvider,
    ChatCompletionChunk,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ModelObject,
    ProviderDefinition
} from "@srouter/types";

export function getProviderAlias(providerId: string): string {
    return providerAlias(providerBaseId(providerId));
}

// Strip any {alias}/ or {providerId}/ prefix from a model id, returning the bare id.
function stripModelPrefix(modelId: string, alias: string, providerId: string): string {
    if (modelId.startsWith(`${alias}/`)) return modelId.slice(alias.length + 1);
    if (modelId.startsWith(`${providerId}/`)) return modelId.slice(providerId.length + 1);
    const baseId = providerBaseId(providerId);
    if (modelId.startsWith(`${baseId}/`)) return modelId.slice(baseId.length + 1);
    const slash = modelId.indexOf("/");
    if (slash >= 0) return modelId.slice(slash + 1);
    return modelId;
}

interface CachedProviderModels {
    models: ModelObject[];
    cachedAt: number;
}

export class ProviderRegistry {
    private providers: Map<string, AIProvider> = new Map();
    private defaultProvider: AIProvider;
    private modelsCache: Map<string, CachedProviderModels> = new Map();
    private modelsInflight: Map<string, Promise<ModelObject[]>> = new Map();
    private modelsTtlMs: number = 5 * 60 * 1000; // 5 minutes default TTL

    constructor(defaultProvider?: AIProvider, modelsTtlMs?: number) {
        if (modelsTtlMs !== undefined) {
            this.modelsTtlMs = modelsTtlMs;
        }
        this.defaultProvider = defaultProvider ?? {
            id: "default",
            name: "Default Provider",
            category: "api_key",
            protocol: "openai",
            listModels: async () => [],
            chatCompletion: async (req: ChatCompletionRequest) => {
                throw new Error(
                    `No active provider connection found for model "${req.model}". Please connect a provider account in the Providers tab or verify the model name.`
                );
            },
            chatCompletionStream: async function* (
                req: ChatCompletionRequest
            ): AsyncGenerator<ChatCompletionChunk, void, void> {
                throw new Error(
                    `No active provider connection found for model "${req.model}". Please connect a provider account in the Providers tab or verify the model name.`
                );
            }
        };
        this.registerProvider(this.defaultProvider);
    }

    setModelsTtlMs(ttlMs: number): void {
        this.modelsTtlMs = ttlMs;
    }

    clearModelsCache(providerId?: string): void {
        if (providerId) {
            this.modelsCache.delete(providerId);
            this.modelsInflight.delete(providerId);
        } else {
            this.modelsCache.clear();
            this.modelsInflight.clear();
        }
    }

    async getProviderModels(provider: AIProvider, forceRefresh = false): Promise<ModelObject[]> {
        if (!provider || provider.id === "default") return [];

        const now = Date.now();
        const cached = this.modelsCache.get(provider.id);

        if (!forceRefresh && cached && now - cached.cachedAt < this.modelsTtlMs) {
            return cached.models;
        }

        const inflight = this.modelsInflight.get(provider.id);
        if (inflight && !forceRefresh) {
            return inflight;
        }

        const fetchPromise = (async () => {
            try {
                const models = await provider.listModels();
                const safeModels = Array.isArray(models) ? models : [];
                this.modelsCache.set(provider.id, {
                    models: safeModels,
                    cachedAt: Date.now()
                });
                return safeModels;
            } catch (err) {
                if (cached) {
                    return cached.models;
                }
                return [];
            } finally {
                this.modelsInflight.delete(provider.id);
            }
        })();

        this.modelsInflight.set(provider.id, fetchPromise);
        return fetchPromise;
    }

    registerProvider(provider: AIProvider): void {
        this.providers.set(provider.id, provider);
        this.clearModelsCache(provider.id);
    }

    unregisterProvider(providerId: string): boolean {
        this.clearModelsCache(providerId);
        return this.providers.delete(providerId);
    }

    getProvider(providerId: string): AIProvider | undefined {
        return this.providers.get(providerId);
    }

    getAllProviders(): Map<string, AIProvider> {
        return this.providers;
    }

    /**
     * Live catalog derived from registered providers. One entry per base driver
     * id, collapsing multi-account connections (e.g. openai_1700000000 → openai).
     */
    getCatalog(): ProviderDefinition[] {
        const seen = new Set<string>();
        const catalog: ProviderDefinition[] = [];

        for (const provider of this.providers.values()) {
            if (provider.id === "default") continue;
            const baseId = providerBaseId(provider.id);
            if (seen.has(baseId)) continue;
            seen.add(baseId);

            const connectedCount = Array.from(this.providers.keys()).filter(
                (id) => id === baseId || id.startsWith(`${baseId}_`) || id.startsWith(`${baseId}-`)
            ).length;

            catalog.push({
                id: baseId,
                name: provider.name,
                category: provider.category ?? "custom",
                protocol: provider.protocol ?? "openai",
                requiresApiKey: false,
                supportsCustomUrl: true,
                status: { state: "connected", connectedCount },
                models: []
            });
        }

        return catalog;
    }

    async getProviderForModel(modelId: string): Promise<AIProvider> {
        const candidates: AIProvider[] = [];

        // 1. Direct match from registered providers' listModels() (cached)
        const activeProviders = Array.from(this.providers.values()).filter(
            (p) => p.id !== "default"
        );

        const modelLists = await Promise.all(
            activeProviders.map(async (provider) => {
                const models = await this.getProviderModels(provider);
                return { provider, models };
            })
        );

        for (const { provider, models } of modelLists) {
            const alias = getProviderAlias(provider.id);
            const baseId = providerBaseId(provider.id);
            if (
                models.some((m) => {
                    const bareId = stripModelPrefix(m.id, alias, provider.id);
                    return (
                        m.id === modelId ||
                        `${alias}/${bareId}` === modelId ||
                        `${baseId}/${bareId}` === modelId ||
                        bareId === modelId
                    );
                })
            ) {
                candidates.push(provider);
            }
        }

        // 2. Prefix matching for provider ID or alias (e.g., qd/*, qoder/*, antigravity/*, openai/*)
        if (candidates.length === 0) {
            const prefix = modelId.includes("/") ? (modelId.split("/")[0] ?? modelId) : modelId;
            const targetBaseId = providerTypeForAlias(prefix) ?? prefix;
            for (const [id, provider] of this.providers.entries()) {
                if (id === "default") continue;
                const baseId = providerBaseId(id);
                const alias = providerAlias(baseId);
                if (
                    isProviderBaseId(id, prefix) ||
                    isProviderBaseId(id, targetBaseId) ||
                    prefix === alias ||
                    targetBaseId === baseId
                ) {
                    candidates.push(provider);
                }
            }
        }

        if (candidates.length > 0) {
            // Round-robin load balancing across all connected accounts
            const index = Math.floor(Math.random() * candidates.length);
            return candidates[index] ?? candidates[0] ?? this.defaultProvider;
        }

        if (this.defaultProvider.id !== "default") {
            return this.defaultProvider;
        }

        throw new Error(
            `No active provider connection found for model "${modelId}". Please connect a provider account in the Providers tab (e.g. Qoder, OpenAI, Antigravity) or verify the model prefix.`
        );
    }

    async listAllModels(providerFilter?: string, forceRefresh = false): Promise<ModelObject[]> {
        const allModels: ModelObject[] = [];
        const seenIds = new Set<string>();

        const matchesFilter = (alias: string): boolean => {
            if (!providerFilter) return true;
            const filter = providerFilter.toLowerCase();
            return alias.toLowerCase() === filter || alias.toLowerCase().startsWith(filter);
        };

        const addModel = (model: ModelObject, alias: string, providerId: string): void => {
            if (!matchesFilter(alias)) return;
            const bareId = stripModelPrefix(model.id, alias, providerId);
            const id = `${alias}/${bareId}`;
            if (!seenIds.has(id)) {
                seenIds.add(id);
                allModels.push({ id, object: "model", owned_by: alias });
            }
        };

        const activeProviders = Array.from(this.providers.values()).filter(
            (p) => p.id !== "default"
        );

        // Fetch / retrieve cached models concurrently across all active providers
        const results = await Promise.all(
            activeProviders.map(async (provider) => {
                const alias = getProviderAlias(provider.id);
                const liveModels = await this.getProviderModels(provider, forceRefresh);
                return { providerId: provider.id, alias, liveModels };
            })
        );

        for (const { providerId, alias, liveModels } of results) {
            for (const model of liveModels) {
                addModel(model, alias, providerId);
            }
        }

        return allModels;
    }

    async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const provider = await this.getProviderForModel(req.model);
        return provider.chatCompletion(req);
    }

    async *chatCompletionStream(
        req: ChatCompletionRequest
    ): AsyncGenerator<ChatCompletionChunk, void, void> {
        const provider = await this.getProviderForModel(req.model);
        yield* provider.chatCompletionStream(req);
    }
}
