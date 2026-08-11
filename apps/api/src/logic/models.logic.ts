import type { ModelObject } from "@srouter/types";
import { registry } from "@/services/registry.js";

export class ModelsLogic {
    public static async getAllModels(provider?: string): Promise<ModelObject[]> {
        return await registry.listAllModels(provider);
    }

    public static async getModelById(modelId: string): Promise<ModelObject | undefined> {
        const models = await registry.listAllModels();
        return models.find((m) => m.id === modelId);
    }
}
