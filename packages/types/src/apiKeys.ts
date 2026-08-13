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
