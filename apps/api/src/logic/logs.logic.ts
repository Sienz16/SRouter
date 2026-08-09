import { getRecentLogsDB, getUsageSummaryDB, type RequestLogEntry } from "@srouter/db";

export interface UsageSummaryResult {
    totalRequests: number;
    totalTokens: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
}

export class LogsLogic {
    public static getRecentLogs(limit: number = 50): RequestLogEntry[] {
        return getRecentLogsDB(limit);
    }

    public static getUsageStats(): UsageSummaryResult {
        return getUsageSummaryDB();
    }
}
