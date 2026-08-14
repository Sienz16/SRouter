import { isProviderBaseId } from "@srouter/constants";
import type {
    LiveModelQuotaItem,
    ProviderQuotaAccount,
    ProviderUsageMetric,
    QuotaResponse,
} from "@srouter/types";
import { getProviderModelUsageDB } from "./logs.js";
import { getAllProvidersDB } from "./providers.js";

function formatResetIn(resetTimeStr?: string): string {
    if (!resetTimeStr) return "24h 0m";
    const resetTime = new Date(resetTimeStr).getTime();
    const now = Date.now();
    const diffMs = resetTime - now;
    if (diffMs <= 0) return "0m";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

interface CloudCodeFetchAvailableModelsResponse {
    models?: Record<
        string,
        {
            displayName?: string;
            quotaInfo?: {
                remainingFraction?: number;
                resetTime?: string;
            };
        }
    >;
}

export async function fetchAntigravityLiveQuota(
    providerId: string,
    accountName: string,
    accessToken: string,
    enabled = true,
): Promise<ProviderQuotaAccount> {
    if (!accessToken || !(accessToken.startsWith("ya29.") || accessToken.length > 20)) {
        throw new Error("Antigravity quota requires a valid access token");
    }

    const res = await fetch("https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "User-Agent": "Antigravity/1.0 (VSCode)",
            "x-goog-api-client": "gl-node/18.0.0 gd/1.0.0",
        },
        body: JSON.stringify({}),
    });

    if (!res.ok) {
        throw new Error(`Antigravity quota fetch failed: HTTP ${res.status}`);
    }

    const data = (await res.json()) as CloudCodeFetchAvailableModelsResponse;
    if (!data.models || Object.keys(data.models).length === 0) {
        throw new Error("Antigravity quota fetch returned no models");
    }

    const quotas: LiveModelQuotaItem[] = Object.entries(data.models).map(([modelId, item]) => {
        const remainingFraction = item.quotaInfo?.remainingFraction ?? 1.0;
        const percentageValue = Math.round(remainingFraction * 100);
        const limit = 1000;
        const used = Math.round((1 - remainingFraction) * limit);
        const resetIn = formatResetIn(item.quotaInfo?.resetTime);

        let status: "ok" | "warning" | "exhausted" = "ok";
        if (percentageValue <= 5) status = "exhausted";
        else if (percentageValue <= 20) status = "warning";

        return {
            name: item.displayName || modelId,
            used,
            limit,
            percentage: `${percentageValue}%`,
            percentageValue,
            resetIn,
            resetTime: item.quotaInfo?.resetTime,
            status,
        };
    });

    return {
        id: providerId,
        provider: "Antigravity",
        account: accountName,
        enabled,
        quotaType: "live_provider_quota",
        totalQuotas: quotas.length,
        quotas,
    };
}

export async function getProviderQuotaAccount(p: {
    id: string;
    providerId: string;
    name: string;
    apiKey?: string;
    accessToken?: string;
    enabled: boolean;
}): Promise<ProviderQuotaAccount> {
    const isAntigravity =
        isProviderBaseId(p.providerId, "antigravity") || isProviderBaseId(p.id, "antigravity");
    const isOpenAICodex =
        isProviderBaseId(p.providerId, "openai_codex") || isProviderBaseId(p.id, "openai_codex");
    const isOpenAI = isProviderBaseId(p.providerId, "openai") || isProviderBaseId(p.id, "openai");
    const isAnthropic =
        isProviderBaseId(p.providerId, "anthropic") || isProviderBaseId(p.id, "anthropic");

    const token = p.accessToken || p.apiKey || "";

    if (isAntigravity) {
        return await fetchAntigravityLiveQuota(
            p.id,
            p.name || "seaavey@gmail.com",
            token,
            p.enabled,
        );
    }

    // For OpenAI Codex, OpenAI, Anthropic, or Custom Providers:
    // Report REAL usage metrics aggregated from SRouter's database (request_logs)
    const usageRows = getProviderModelUsageDB(p.id);
    const usageMetrics: ProviderUsageMetric[] = usageRows.map((row) => ({
        model: row.model,
        totalRequests: row.totalRequests,
        totalTokens: row.totalTokens,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
    }));

    let providerName = p.name || p.providerId || p.id;
    if (isOpenAICodex) providerName = "OpenAI Codex";
    else if (isOpenAI) providerName = "OpenAI";
    else if (isAnthropic) providerName = "Anthropic";

    return {
        id: p.id,
        provider: providerName,
        account: p.name || `${providerName} Account`,
        enabled: p.enabled,
        quotaType: "usage_logged",
        usageMetrics,
    };
}

export async function getQuotaSummaryDB(): Promise<QuotaResponse> {
    const dbProviders = getAllProvidersDB();
    const providerAccounts: ProviderQuotaAccount[] = [];

    for (const p of dbProviders) {
        try {
            const account = await getProviderQuotaAccount(p);
            providerAccounts.push(account);
        } catch {
            // Skip providers whose quota cannot be fetched
        }
    }

    return {
        object: "quota",
        totalAccounts: providerAccounts.length,
        providers: providerAccounts,
    };
}
