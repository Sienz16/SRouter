import type { CreateAPIKeyZod, CreateProviderZod } from "@srouter/types";

// Response envelopes used by the API
export interface ListResponse<T> {
    object: "list";
    data: T[];
}

export interface UsageStats {
    object: "usage";
    totalRequests: number;
    totalTokens: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCachedTokens: number;
    totalCacheCreationTokens: number;
    totalReasoningTokens: number;
    totalEstimatedCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    costLabel: string;
    estimated: boolean;
    byModel: Array<{
        model: string;
        totalRequests: number;
        totalInputTokens: number;
        totalOutputTokens: number;
        totalCachedTokens: number;
        estCost: number;
    }>;
}

export interface RequestLogEntry {
    id: string;
    apiKeyId?: string;
    providerId: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    statusCode: number;
    latencyMs: number;
    cachedTokens?: number;
    cacheCreationTokens?: number;
    reasoningTokens?: number;
    estimatedCost?: number;
    createdAt: number;
}

export interface DBAPIKey {
    id: string;
    key: string;
    name: string;
    enabled: boolean;
    rateLimit: number;
    quotaLimit: number;
    usageTokens: number;
    createdAt: number;
}

export type { CreateAPIKeyZod, CreateProviderZod };
