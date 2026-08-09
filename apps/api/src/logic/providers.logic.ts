import type { ProviderDefinition } from "@srouter/types";
import { registry } from "@/services/registry.js";

export interface GroupedCatalog {
    custom: ProviderDefinition[];
    oauth: ProviderDefinition[];
    free_tier: ProviderDefinition[];
    api_key: ProviderDefinition[];
}

export interface CatalogSummary {
    total: number;
    categories: GroupedCatalog;
}

export class ProvidersLogic {
    public static listProviders(): ProviderDefinition[] {
        return registry.getCatalog();
    }

    public static getCatalog(): CatalogSummary {
        const catalog = registry.getCatalog();

        const categories: GroupedCatalog = {
            custom: catalog.filter((p) => p.category === "custom"),
            oauth: catalog.filter((p) => p.category === "oauth"),
            free_tier: catalog.filter((p) => p.category === "free_tier"),
            api_key: catalog.filter((p) => p.category === "api_key"),
        };

        return {
            total: catalog.length,
            categories,
        };
    }
}
