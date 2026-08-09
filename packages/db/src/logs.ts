import { db } from './db.js';

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
    createdAt: number;
}

export function logRequestDB(entry: Omit<RequestLogEntry, 'id' | 'createdAt'>): RequestLogEntry {
    const id = `log_${Math.random().toString(36).substring(2, 11)}`;
    const createdAt = Date.now();

    const query = db.prepare(`
        INSERT INTO request_logs (id, api_key_id, provider_id, model, prompt_tokens, completion_tokens, total_tokens, status_code, latency_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    query.run(
        id,
        entry.apiKeyId ?? null,
        entry.providerId,
        entry.model,
        entry.promptTokens,
        entry.completionTokens,
        entry.totalTokens,
        entry.statusCode,
        entry.latencyMs,
        createdAt
    );

    return {
        id,
        ...entry,
        createdAt,
    };
}

export function getRecentLogsDB(limit = 50): RequestLogEntry[] {
    const query = db.prepare('SELECT * FROM request_logs ORDER BY created_at DESC LIMIT ?');
    const rows = query.all(limit);

    return rows.map((row) => ({
        id: String(row.id ?? ''),
        apiKeyId: row.api_key_id ? String(row.api_key_id) : undefined,
        providerId: String(row.provider_id ?? ''),
        model: String(row.model ?? ''),
        promptTokens: Number(row.prompt_tokens ?? 0),
        completionTokens: Number(row.completion_tokens ?? 0),
        totalTokens: Number(row.total_tokens ?? 0),
        statusCode: Number(row.status_code ?? 0),
        latencyMs: Number(row.latency_ms ?? 0),
        createdAt: Number(row.created_at ?? 0),
    }));
}

export function getUsageSummaryDB(): {
    totalRequests: number;
    totalTokens: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
} {
    const query = db.prepare(`
        SELECT 
            COUNT(*) as totalRequests,
            COALESCE(SUM(total_tokens), 0) as totalTokens,
            COALESCE(SUM(prompt_tokens), 0) as totalPromptTokens,
            COALESCE(SUM(completion_tokens), 0) as totalCompletionTokens
        FROM request_logs
    `);

    const result = query.get();

    return {
        totalRequests: Number(result?.totalRequests ?? 0),
        totalTokens: Number(result?.totalTokens ?? 0),
        totalPromptTokens: Number(result?.totalPromptTokens ?? 0),
        totalCompletionTokens: Number(result?.totalCompletionTokens ?? 0),
    };
}
