import type { ModelObject } from "@srouter/types";
import { registry } from "@/services/registry.js";

export class ModelsLogic {
    public static async getAllModels(
        provider?: string,
        forceRefresh = false
    ): Promise<ModelObject[]> {
        return await registry.listAllModels(provider, forceRefresh);
    }

    public static async getModelById(
        modelId: string,
        forceRefresh = false
    ): Promise<ModelObject | undefined> {
        const models = await registry.listAllModels(undefined, forceRefresh);
        return models.find((m) => m.id === modelId);
    }

    public static refreshModels(forceRefresh = false): Promise<ModelObject[]> {
        return registry.refreshModels(forceRefresh);
    }

    public static clearCache(providerId?: string): void {
        registry.clearModelsCache(providerId);
    }
}
