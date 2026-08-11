import { getRecentLogsDB, getUsageByModelDB, getUsageSummaryDB, type RequestLogEntry, type UsageSummary } from "@srouter/db";
import { formatCost } from "@srouter/pricing";

export interface UsageSummaryResult extends UsageSummary {
    object: "usage";
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

export class LogsLogic {
    public static getRecentLogs(limit: number = 50): RequestLogEntry[] {
        return getRecentLogsDB(limit);
    }

    public static getUsageStats(): UsageSummaryResult {
        const summary = getUsageSummaryDB();
        const byModel = getUsageByModelDB();

        return {
            object: "usage",
            ...summary,
            costLabel: formatCost(summary.totalEstimatedCost),
            estimated: true,
            byModel,
        };
    }
}
