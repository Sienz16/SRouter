import { calculateCostFromTokens, getPricingForModel } from "@srouter/pricing";

export interface UsageBreakdown {
    promptTokens: number;
    completionTokens: number;
    cachedTokens: number;
    cacheCreationTokens: number;
    reasoningTokens: number;
    totalTokens: number;
}

/**
 * Extract a normalized token breakdown from a provider's usage object.
 * Provider-aware: anthropic uses cache_read_input_tokens, openai-compatible
 * uses prompt_tokens_details.cached_tokens, etc.
 */
export function extractUsageBreakdown(provider: string | undefined, usage: unknown): UsageBreakdown {
    const empty: UsageBreakdown = {
        promptTokens: 0,
        completionTokens: 0,
        cachedTokens: 0,
        cacheCreationTokens: 0,
        reasoningTokens: 0,
        totalTokens: 0,
    };

    if (!usage || typeof usage !== "object") return empty;

    const u = usage as Record<string, unknown>;
    const n = (v: unknown): number => (typeof v === "number" && !isNaN(v) ? v : 0);

    const providerKey = provider?.toLowerCase() ?? "";

    // Anthropic native shape
    if (providerKey.includes("anthropic")) {
        const input = n(u.input_tokens);
        const output = n(u.output_tokens);
        const cached = n(u.cache_read_input_tokens);
        const cacheCreation = n(u.cache_creation_input_tokens);
        return {
            promptTokens: input,
            completionTokens: output,
            cachedTokens: cached,
            cacheCreationTokens: cacheCreation,
            reasoningTokens: n((u as { reasoning?: { reasoning_tokens?: unknown } }).reasoning?.reasoning_tokens),
            totalTokens: input + output,
        };
    }

    // OpenAI / compatible shape
    const promptDetails = (u.prompt_tokens_details ?? {}) as { cached_tokens?: unknown };
    const completionDetails = (u.completion_tokens_details ?? {}) as { reasoning_tokens?: unknown };
    const prompt = n(u.prompt_tokens);
    const completion = n(u.completion_tokens);
    const total = n(u.total_tokens);

    return {
        promptTokens: prompt,
        completionTokens: completion,
        cachedTokens: n(promptDetails.cached_tokens),
        cacheCreationTokens: 0,
        reasoningTokens: n(completionDetails.reasoning_tokens),
        totalTokens: total || prompt + completion,
    };
}

/**
 * Estimate the cost (USD) of a usage breakdown for a given model.
 * Estimated only — not actual billing.
 */
export function estimateCostForUsage(provider: string | undefined, model: string, breakdown: UsageBreakdown): number {
    const pricing = getPricingForModel(provider, model);
    return calculateCostFromTokens(
        {
            prompt_tokens: breakdown.promptTokens,
            completion_tokens: breakdown.completionTokens,
            cached_tokens: breakdown.cachedTokens,
            cache_creation_input_tokens: breakdown.cacheCreationTokens,
            reasoning_tokens: breakdown.reasoningTokens,
        },
        pricing,
    );
}
