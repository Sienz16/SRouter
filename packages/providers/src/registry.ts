import type {
    AIProvider,
    ChatCompletionChunk,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ModelObject,
    ProviderDefinition,
} from "@srouter/types";
import { PROVIDER_CATALOG } from "./catalog.js";
import { MockProvider } from "./mock.js";

export class ProviderRegistry {
    private providers: Map<string, AIProvider> = new Map();
    private defaultProvider: AIProvider;
    private catalog: ProviderDefinition[] = [...PROVIDER_CATALOG];

    constructor(defaultProvider?: AIProvider) {
        this.defaultProvider = defaultProvider ?? new MockProvider();
        this.registerProvider(this.defaultProvider);
    }

    registerProvider(provider: AIProvider): void {
        this.providers.set(provider.id, provider);
        // Update catalog status if matched
        const catItem = this.catalog.find((c) => c.id === provider.id);
        if (catItem) {
            catItem.status = { state: "connected", connectedCount: 1 };
        }
    }

    getProvider(providerId: string): AIProvider | undefined {
        return this.providers.get(providerId);
    }

    getCatalog(): ProviderDefinition[] {
        return this.catalog;
    }

    async getProviderForModel(modelId: string): Promise<AIProvider> {
        for (const provider of this.providers.values()) {
            const models = await provider.listModels();
            if (models.some((m) => m.id === modelId)) {
                return provider;
            }
        }

        // Check catalog for model owned_by or prefix matching
        for (const cat of this.catalog) {
            if (cat.models.some((m) => m.id === modelId)) {
                const registered = this.providers.get(cat.id);
                if (registered) return registered;
            }
        }

        return this.defaultProvider;
    }

    async listAllModels(): Promise<ModelObject[]> {
        const allModels: ModelObject[] = [];
        const seenIds = new Set<string>();

        // 1. Models from registered providers
        for (const provider of this.providers.values()) {
            const models = await provider.listModels();
            for (const model of models) {
                if (!seenIds.has(model.id)) {
                    seenIds.add(model.id);
                    allModels.push(model);
                }
            }
        }

        // 2. Add catalog models so all supported models show in list
        for (const cat of this.catalog) {
            for (const model of cat.models) {
                if (!seenIds.has(model.id)) {
                    seenIds.add(model.id);
                    allModels.push(model);
                }
            }
        }

        return allModels;
    }

    async chatCompletion(
        req: ChatCompletionRequest,
    ): Promise<ChatCompletionResponse> {
        const provider = await this.getProviderForModel(req.model);
        return provider.chatCompletion(req);
    }

    async *chatCompletionStream(
        req: ChatCompletionRequest,
    ): AsyncGenerator<ChatCompletionChunk, void, void> {
        const provider = await this.getProviderForModel(req.model);
        yield* provider.chatCompletionStream(req);
    }
}
