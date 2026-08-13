// Pricing rates for AI models — all rates in $/1M tokens.
// Only models currently available in SRouter are listed:
//   - CommandCode Provider API (52 models)
//   - Antigravity (5 models)
// Unknown models fall back to DEFAULT_PRICING (estimated only, not actual billing).

export interface ModelPrice {
    input: number;
    output: number;
    cached?: number;
    reasoning?: number;
    cache_creation?: number;
}

/**
 * Canonical model pricing — keyed by base model name (provider prefix stripped).
 */
export const MODEL_PRICING: Record<string, ModelPrice> = {
    // === CommandCode: Claude ===
    "claude-sonnet-5": {
        input: 2.0,
        output: 10.0,
        cached: 0.2,
        reasoning: 10.0,
        cache_creation: 2.5,
    },
    "claude-sonnet-4-6": {
        input: 3.0,
        output: 15.0,
        cached: 0.3,
        reasoning: 15.0,
        cache_creation: 3.75,
    },
    "claude-fable-5": {
        input: 10.0,
        output: 50.0,
        cached: 1.0,
        reasoning: 50.0,
        cache_creation: 12.5,
    },
    "claude-opus-5": {
        input: 5.0,
        output: 25.0,
        cached: 0.5,
        reasoning: 25.0,
        cache_creation: 6.25,
    },
    "claude-opus-4-8": {
        input: 5.0,
        output: 25.0,
        cached: 0.5,
        reasoning: 25.0,
        cache_creation: 6.25,
    },
    "claude-opus-4-7": {
        input: 5.0,
        output: 25.0,
        cached: 0.5,
        reasoning: 25.0,
        cache_creation: 6.25,
    },
    "claude-haiku-4-5-20251001": {
        input: 1.0,
        output: 5.0,
        cached: 0.1,
        reasoning: 5.0,
        cache_creation: 1.25,
    },

    // === CommandCode: GPT ===
    "gpt-5.6-sol": { input: 5.0, output: 30.0, cached: 0.5, reasoning: 30.0, cache_creation: 5.0 },
    "gpt-5.6-terra": {
        input: 2.5,
        output: 15.0,
        cached: 0.25,
        reasoning: 15.0,
        cache_creation: 2.5,
    },
    "gpt-5.6-luna": { input: 1.0, output: 6.0, cached: 0.1, reasoning: 6.0, cache_creation: 1.0 },
    "gpt-5.5": { input: 5.0, output: 30.0, cached: 0.5, reasoning: 30.0, cache_creation: 5.0 },
    "gpt-5.4": { input: 2.5, output: 15.0, cached: 0.25, reasoning: 15.0, cache_creation: 2.5 },
    "gpt-5.3-codex": {
        input: 1.75,
        output: 14.0,
        cached: 0.175,
        reasoning: 14.0,
        cache_creation: 1.75,
    },
    "gpt-5.4-mini": {
        input: 0.75,
        output: 4.5,
        cached: 0.075,
        reasoning: 4.5,
        cache_creation: 0.75,
    },

    // === CommandCode: DeepSeek ===
    "deepseek-v4-pro": {
        input: 0.435,
        output: 0.87,
        cached: 0.003625,
        reasoning: 0.87,
        cache_creation: 0.435,
    },
    "deepseek-v4-flash": {
        input: 0.14,
        output: 0.28,
        cached: 0.0028,
        reasoning: 0.28,
        cache_creation: 0.14,
    },

    // === CommandCode: Kimi (Moonshot) ===
    "Kimi-K3": { input: 3.0, output: 15.0, cached: 0.3, reasoning: 15.0, cache_creation: 3.0 },
    "Kimi-K2.7-Code": {
        input: 0.95,
        output: 4.0,
        cached: 0.19,
        reasoning: 4.0,
        cache_creation: 0.95,
    },
    "Kimi-K2.7-Code-Highspeed": {
        input: 1.9,
        output: 8.0,
        cached: 0.38,
        reasoning: 8.0,
        cache_creation: 1.9,
    },
    "Kimi-K2.6": { input: 1.0, output: 4.0, cached: 0.5, reasoning: 6.0, cache_creation: 1.0 },
    "Kimi-K2.5": { input: 1.2, output: 4.8, cached: 0.6, reasoning: 7.2, cache_creation: 1.2 },

    // === CommandCode: GLM (Z.ai) ===
    "GLM-5.2": { input: 1.4, output: 4.4, cached: 0.26, reasoning: 4.4, cache_creation: 1.4 },
    "GLM-5.2-Fast": { input: 1.4, output: 4.4, cached: 0.26, reasoning: 4.4, cache_creation: 1.4 },
    "GLM-5.1": { input: 1.05, output: 3.5, cached: 0.525, reasoning: 3.5, cache_creation: 1.05 },
    "GLM-5": { input: 1.0, output: 4.0, cached: 0.5, reasoning: 6.0, cache_creation: 1.0 },

    // === CommandCode: MiniMax ===
    "MiniMax-M3": { input: 0.3, output: 1.2, cached: 0.06, reasoning: 1.8, cache_creation: 0.3 },
    "MiniMax-M2.7": { input: 0.5, output: 2.0, cached: 0.25, reasoning: 3.0, cache_creation: 0.5 },
    "MiniMax-M2.5": { input: 0.6, output: 2.4, cached: 0.3, reasoning: 3.6, cache_creation: 0.6 },

    // === CommandCode: Xiaomi MiMo ===
    "mimo-v2.5-pro": { input: 1.0, output: 3.0, cached: 0.2, reasoning: 3.0, cache_creation: 1.0 },
    "mimo-v2.5": { input: 0.4, output: 2.0, cached: 0.08, reasoning: 2.0, cache_creation: 0.4 },

    // === CommandCode: Qwen ===
    "Qwen3.8-Max": { input: 2.0, output: 6.0, cached: 0.25, reasoning: 6.0, cache_creation: 2.5 },
    "Qwen3.7-Max": {
        input: 1.25,
        output: 3.75,
        cached: 0.25,
        reasoning: 3.75,
        cache_creation: 1.25,
    },
    "Qwen3.7-Plus": { input: 0.4, output: 1.6, cached: 0.08, reasoning: 1.6, cache_creation: 0.4 },
    "Qwen3.7-Flash": {
        input: 0.25,
        output: 1.0,
        cached: 0.05,
        reasoning: 1.0,
        cache_creation: 0.25,
    },
    "Qwen3.6-Max-Preview": {
        input: 0.54,
        output: 3.21,
        cached: 0.08,
        reasoning: 3.21,
        cache_creation: 0.54,
    },
    "Qwen3.6-Plus": {
        input: 0.54,
        output: 3.21,
        cached: 0.08,
        reasoning: 3.21,
        cache_creation: 0.54,
    },

    // === CommandCode: StepFun ===
    "Step-3.7-Flash": {
        input: 0.2,
        output: 1.15,
        cached: 0.04,
        reasoning: 1.15,
        cache_creation: 0.2,
    },
    "Step-3.5-Flash": {
        input: 0.1,
        output: 0.3,
        cached: 0.02,
        reasoning: 0.3,
        cache_creation: 0.1,
    },

    // === CommandCode: Tencent ===
    "hy3-paid": {
        input: 0.066,
        output: 0.26,
        cached: 0.029,
        reasoning: 0.26,
        cache_creation: 0.066,
    },

    // === CommandCode: Gemini ===
    "gemini-3.6-flash": {
        input: 1.5,
        output: 7.5,
        cached: 0.15,
        reasoning: 11.25,
        cache_creation: 1.875,
    },
    "gemini-3.5-flash": {
        input: 1.5,
        output: 9.0,
        cached: 0.15,
        reasoning: 9.0,
        cache_creation: 0.08333,
    },
    "gemini-3.5-flash-lite": {
        input: 0.3,
        output: 2.5,
        cached: 0.03,
        reasoning: 3.75,
        cache_creation: 0.08333,
    },
    "gemini-3.1-flash-lite": {
        input: 0.25,
        output: 1.5,
        cached: 0.025,
        reasoning: 2.25,
        cache_creation: 0.25,
    },

    // === CommandCode: Lainnya ===
    "fugu-ultra": { input: 5.0, output: 30.0, cached: 0.5, reasoning: 30.0, cache_creation: 5.0 },
    "nemotron-3-ultra-550b-a55b": {
        input: 0.3,
        output: 0.9,
        cached: 0.1,
        reasoning: 0.9,
        cache_creation: 0.3,
    },
    inkling: { input: 1.0, output: 4.0, cached: 0.5, reasoning: 6.0, cache_creation: 1.0 },
    "inkling-small": { input: 0.5, output: 2.0, cached: 0.25, reasoning: 3.0, cache_creation: 0.5 },
    "laguna-s-2.1-free": { input: 0.0, output: 0.0 },
    "muse-spark-1.1": {
        input: 0.5,
        output: 2.0,
        cached: 0.25,
        reasoning: 3.0,
        cache_creation: 0.5,
    },
    "muse-spark-1.2": {
        input: 0.5,
        output: 2.0,
        cached: 0.25,
        reasoning: 3.0,
        cache_creation: 0.5,
    },
    "muse-spark-1.2-contributor": {
        input: 0.5,
        output: 2.0,
        cached: 0.25,
        reasoning: 3.0,
        cache_creation: 0.5,
    },
    "grok-4.5": { input: 2.0, output: 6.0, cached: 0.5, reasoning: 6.0, cache_creation: 2.0 },

    // === Antigravity ===
    "gemini-2.5-pro": {
        input: 2.0,
        output: 12.0,
        cached: 0.25,
        reasoning: 18.0,
        cache_creation: 2.0,
    },
    "gemini-2.5-flash": {
        input: 0.3,
        output: 2.5,
        cached: 0.03,
        reasoning: 3.75,
        cache_creation: 0.3,
    },
    "gemini-2.0-flash": {
        input: 0.1,
        output: 0.4,
        cached: 0.01,
        reasoning: 0.6,
        cache_creation: 0.1,
    },
    "gemini-1.5-pro": {
        input: 1.25,
        output: 5.0,
        cached: 0.625,
        reasoning: 7.5,
        cache_creation: 1.25,
    },

    // === Anthropic ===
    "claude-3-7-sonnet-20250219": {
        input: 3.0,
        output: 15.0,
        cached: 1.5,
        reasoning: 15.0,
        cache_creation: 3.0,
    },
    "claude-3-5-sonnet-20241022": {
        input: 3.0,
        output: 15.0,
        cached: 1.5,
        reasoning: 15.0,
        cache_creation: 3.0,
    },
    "claude-3-5-haiku-20241022": {
        input: 0.8,
        output: 4.0,
        cached: 0.4,
        reasoning: 4.0,
        cache_creation: 0.8,
    },
};

/** Default pricing when the model isn't in the catalog. */
export const DEFAULT_PRICING: ModelPrice = {
    input: 2.0,
    output: 8.0,
    cached: 1.0,
    reasoning: 12.0,
    cache_creation: 2.0,
};

/**
 * Resolve pricing for a model. Strips the provider prefix
 * ("commandcode/deepseek/deepseek-v4-flash" → "deepseek-v4-flash") and matches
 * case-insensitively. Falls back to DEFAULT_PRICING for unknown models.
 */
export function getPricingForModel(_provider: string | undefined, model: string): ModelPrice {
    if (!model) return DEFAULT_PRICING;

    const baseModel = model.includes("/") ? (model.split("/").pop() ?? model) : model;
    const direct = MODEL_PRICING[baseModel];
    if (direct) return direct;

    const lower = baseModel.toLowerCase();
    for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
        if (key.toLowerCase() === lower) return pricing;
    }

    return DEFAULT_PRICING;
}

/**
 * Calculate cost in dollars from token counts and pricing.
 * prompt_tokens is cache-inclusive: cached + cache_creation are subsets,
 * so subtract both to avoid charging them at the full input rate.
 */
export function calculateCostFromTokens(
    tokens: {
        prompt_tokens?: number;
        input_tokens?: number;
        completion_tokens?: number;
        output_tokens?: number;
        cached_tokens?: number;
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
        reasoning_tokens?: number;
    },
    pricing: ModelPrice,
): number {
    if (!tokens || !pricing) return 0;

    let cost = 0;

    const inputTokens = tokens.prompt_tokens || tokens.input_tokens || 0;
    const cachedTokens = tokens.cached_tokens || tokens.cache_read_input_tokens || 0;
    const cacheCreationTokens = tokens.cache_creation_input_tokens || 0;
    const nonCachedInput = Math.max(0, inputTokens - cachedTokens - cacheCreationTokens);

    cost += nonCachedInput * (pricing.input / 1_000_000);

    if (cachedTokens > 0) {
        cost += cachedTokens * ((pricing.cached ?? pricing.input) / 1_000_000);
    }

    const outputTokens = tokens.completion_tokens || tokens.output_tokens || 0;
    cost += outputTokens * (pricing.output / 1_000_000);

    const reasoningTokens = tokens.reasoning_tokens || 0;
    if (reasoningTokens > 0) {
        cost += reasoningTokens * ((pricing.reasoning ?? pricing.output) / 1_000_000);
    }

    if (cacheCreationTokens > 0) {
        cost += cacheCreationTokens * ((pricing.cache_creation ?? pricing.input) / 1_000_000);
    }

    return cost;
}

/**
 * Format cost for display.
 */
export function formatCost(cost: number): string {
    if (cost === null || cost === undefined || isNaN(cost)) return "$0.00";
    return `$${cost.toFixed(2)}`;
}
