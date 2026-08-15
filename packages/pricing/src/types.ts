export interface ModelPrice {
    id?: string;
    name?: string;
    input: number;
    output: number;
    cached?: number;
    reasoning?: number;
    cache_creation?: number;
}

export type ProviderModelMap = Record<string, ModelPrice[]>;

export interface RawPricingDataset {
    version?: string;
    updatedAt?: string;
    defaults: ModelPrice;
    models: ProviderModelMap | Record<string, ModelPrice>;
    aliases: Record<string, string>;
}

export interface PricingDataset {
    version?: string;
    updatedAt?: string;
    defaults: ModelPrice;
    models: Record<string, ModelPrice>;
    providerModels?: ProviderModelMap;
    aliases: Record<string, string>;
}
