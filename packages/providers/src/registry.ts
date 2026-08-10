import type { AIProvider, ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, ModelObject, ProviderDefinition } from "@srouter/types";
export class ProviderRegistry {
    private providers: Map<string, AIProvider> = new Map();
    private defaultProvider: AIProvider;
    private catalog: ProviderDefinition[] = [];

    constructor(defaultProvider?: AIProvider) {
        this.defaultProvider = defaultProvider ?? {
            id: "default",
            name: "Default Provider",
            category: "api_key",
            protocol: "openai",
            listModels: async () => [],
            chatCompletion: async (req: ChatCompletionRequest) => {
                throw new Error("No default provider set for chatCompletion");
            },
            chatCompletionStream: async function* (req: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk, void, void> {
                throw new Error("No default provider set for chatCompletionStream");
            },
        };
        this.registerProvider(this.defaultProvider);
    }

    registerProvider(provider: AIProvider): void {
        this.providers.set(provider.id, provider);
        // Update catalog status if matched (supports prefix for multi-account e.g. antigravity_1700000000)
        const baseId = provider.id.split("_")[0]?.split("-")[0] ?? provider.id;
        const catItem = this.catalog.find((c) => c.id === provider.id || c.id === baseId);
        if (catItem) {
            const connectedCount = Array.from(this.providers.keys()).filter((k) => k === catItem.id || k.startsWith(`${catItem.id}_`) || k.startsWith(`${catItem.id}-`)).length;
            catItem.status = { state: "connected", connectedCount };
        }
    }

    getProvider(providerId: string): AIProvider | undefined {
        return this.providers.get(providerId);
    }

    getCatalog(): ProviderDefinition[] {
        return this.catalog;
    }

    async getProviderForModel(modelId: string): Promise<AIProvider> {
        const candidates: AIProvider[] = [];

        // 1. Direct match from registered providers' listModels()
        for (const provider of this.providers.values()) {
            if (provider.id === "default") continue;
            const models = await provider.listModels();
            if (models.some((m) => m.id === modelId)) {
                candidates.push(provider);
            }
        }

        // 2. Prefix matching for provider ID (e.g., antigravity/gemini-3.6-flash -> antigravity_*)
        if (candidates.length === 0) {
            const prefix = modelId.includes("/") ? (modelId.split("/")[0] ?? modelId) : modelId;
            for (const [id, provider] of this.providers.entries()) {
                if (id === "default") continue;
                if (id === prefix || id.startsWith(`${prefix}_`) || id.startsWith(`${prefix}-`)) {
                    candidates.push(provider);
                }
            }
        }

        // 3. Catalog matching across all registered accounts
        if (candidates.length === 0) {
            for (const cat of this.catalog) {
                if (cat.models.some((m) => m.id === modelId)) {
                    for (const [id, provider] of this.providers.entries()) {
                        if (id === "default") continue;
                        if (id === cat.id || id.startsWith(`${cat.id}_`) || id.startsWith(`${cat.id}-`)) {
                            candidates.push(provider);
                        }
                    }
                }
            }
        }

        if (candidates.length > 0) {
            // Round-robin load balancing across all connected accounts
            const index = Math.floor(Math.random() * candidates.length);
            return candidates[index] ?? candidates[0] ?? this.defaultProvider;
        }

        return this.defaultProvider;
    }

    async listAllModels(): Promise<ModelObject[]> {
        const allModels: ModelObject[] = [];
        const seenIds = new Set<string>();

        // 1. Models from registered/connected providers ONLY
        for (const provider of this.providers.values()) {
            if (provider.id === "default") continue;

            // Fetch live models from provider endpoint using its accessToken / apiKey
            const liveModels = await provider.listModels();
            for (const model of liveModels) {
                if (!seenIds.has(model.id)) {
                    seenIds.add(model.id);
                    allModels.push(model);
                }
            }

            // Include catalog models corresponding ONLY to connected providers
            const baseId = provider.id.split("_")[0]?.split("-")[0] ?? provider.id;
            const catItem = this.catalog.find((c) => c.id === provider.id || c.id === baseId);
            if (catItem) {
                for (const model of catItem.models) {
                    if (!seenIds.has(model.id)) {
                        seenIds.add(model.id);
                        allModels.push(model);
                    }
                }
            }
        }

        // 2. If no active providers connected, return catalog models of providers marked as connected/ready
        if (allModels.length === 0) {
            for (const cat of this.catalog) {
                if (cat.status.state === "connected" || cat.status.state === "ready") {
                    for (const model of cat.models) {
                        if (!seenIds.has(model.id)) {
                            seenIds.add(model.id);
                            allModels.push(model);
                        }
                    }
                }
            }
        }

        return allModels;
    }

    async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const provider = await this.getProviderForModel(req.model);
        return provider.chatCompletion(req);
    }

    async *chatCompletionStream(req: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk, void, void> {
        const provider = await this.getProviderForModel(req.model);
        yield* provider.chatCompletionStream(req);
    }
}
