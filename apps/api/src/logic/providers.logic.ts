import { DEFAULT_PROVIDER_MAP, isProviderCategory, isSeedProvider } from "@srouter/constants";
import type {
    ProviderCategory,
    ProviderConfig,
    ProviderDefinition,
    ProviderProtocol,
} from "@srouter/types";
import { getAllProvidersDB, upsertProviderDB } from "@srouter/db";
import { loadSavedProvidersFromDB, registry } from "@/services/registry.js";

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

export interface CreateProviderPayload {
    id?: string;
    name: string;
    category: ProviderCategory;
    protocol: ProviderProtocol;
    baseUrl?: string;
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    providerSpecificData?: Record<string, string>;
}

function isProviderProtocol(value: string): value is ProviderProtocol {
    return ["openai", "anthropic", "gemini", "custom"].includes(value);
}

/**
 * Resolves a provider/connection id to its base driver id. Known drivers are
 * matched by id or `id_<suffix>` / `id-<suffix>` prefixes so multi-account
 * connections collapse under one driver (e.g. openai_codex_1700000000 →
 * openai_codex). Custom ids that match no known driver keep their full id.
 */
function baseIdOf(providerId: string): string {
    for (const id of Object.keys(DEFAULT_PROVIDER_MAP)) {
        if (
            providerId === id ||
            providerId.startsWith(`${id}_`) ||
            providerId.startsWith(`${id}-`)
        ) {
            return id;
        }
    }
    return providerId;
}

function providerDefinitionFromConfig(connection: ProviderConfig): ProviderDefinition {
    return {
        id: connection.id,
        name: connection.name,
        category:
            connection.category && isProviderCategory(connection.category)
                ? connection.category
                : "custom",
        protocol:
            connection.protocol && isProviderProtocol(connection.protocol)
                ? connection.protocol
                : "openai",
        defaultBaseUrl: connection.baseUrl,
        requiresApiKey: Boolean(connection.apiKey),
        supportsCustomUrl: true,
        status: { state: "connected", connectedCount: 1 },
        models: [],
    };
}

/**
 * Builds the dashboard catalog purely from the SQLite providers table. Built-in
 * drivers appear through their seeded rows; connections are grouped under their
 * base driver id. Seed rows describe a driver but carry no credentials, so they
 * are excluded from connection/status counts.
 */
function catalogWithSavedCustomProviders(): ProviderDefinition[] {
    const rows = getAllProvidersDB();
    const catalog: ProviderDefinition[] = [];
    const seen = new Set<string>();

    for (const connection of rows) {
        const baseId = baseIdOf(connection.providerId || connection.id);
        if (seen.has(baseId)) continue;
        seen.add(baseId);

        const seed = DEFAULT_PROVIDER_MAP[baseId];
        const category: ProviderCategory =
            connection.category && isProviderCategory(connection.category)
                ? connection.category
                : "custom";
        const protocol: ProviderProtocol =
            connection.protocol && isProviderProtocol(connection.protocol)
                ? connection.protocol
                : "openai";

        const connectedCount = rows.filter(
            (c) => !isSeedProvider(c) && c.enabled && baseIdOf(c.providerId || c.id) === baseId,
        ).length;

        catalog.push({
            id: baseId,
            name: seed?.name ?? connection.name,
            category: seed?.category ?? category,
            protocol: seed?.protocol ?? protocol,
            defaultBaseUrl: seed?.baseUrl ?? connection.baseUrl,
            requiresApiKey: seed ? seed.requiresApiKey : Boolean(connection.apiKey),
            requiresOAuth: seed?.requiresOAuth,
            supportsCustomUrl: seed ? (seed.supportsCustomUrl ?? true) : true,
            status: {
                state: connectedCount > 0 ? "connected" : "no_connections",
                message: seed?.statusMessage,
                connectedCount,
            },
            models: [],
        });
    }

    return catalog;
}

export class ProvidersLogic {
    public static listProviders(): ProviderDefinition[] {
        return catalogWithSavedCustomProviders();
    }

    public static getCatalog(): CatalogSummary {
        const catalog = catalogWithSavedCustomProviders();

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

    public static async getProviderById(providerId: string): Promise<ProviderDefinition | null> {
        const catalog = catalogWithSavedCustomProviders();
        const provider = catalog.find((p) => p.id.toLowerCase() === providerId.toLowerCase());
        if (!provider) return null;

        // Resolve connections by base driver id so multi-account rows (e.g.
        // neosantara-1786…) show up on their driver's page (e.g. /providers/neosantara).
        const connections = getAllProvidersDB().filter(
            (c) => !isSeedProvider(c) && baseIdOf(c.providerId || c.id) === providerId,
        );
        const connectedCount = connections.filter((c) => c.enabled).length;

        let liveModels = provider.models;
        const registeredProvider =
            registry.getProvider(providerId) ||
            Array.from(registry.getAllProviders().values()).find(
                (p) =>
                    p.id.startsWith(providerId) ||
                    p.id.startsWith(`${providerId}_`) ||
                    p.id.startsWith(`${providerId}-`),
            );

        if (registeredProvider) {
            try {
                const fetched = await registeredProvider.listModels();
                if (fetched.length > 0) {
                    liveModels = fetched;
                }
            } catch {
                // fallback to catalog models
            }
        }

        return {
            ...provider,
            connections,
            models: liveModels,
            status: {
                ...provider.status,
                connectedCount,
                state: connectedCount > 0 ? "connected" : "no_connections",
            },
        };
    }

    public static addProvider(payload: CreateProviderPayload): ProviderDefinition {
        const name = payload.name?.trim();
        if (!name) throw new Error("Provider name is required");
        if (!isProviderCategory(payload.category)) throw new Error("Invalid provider category");
        if (!isProviderProtocol(payload.protocol)) throw new Error("Invalid provider protocol");
        const rawId = payload.id?.trim();
        const id = rawId ? rawId.toLowerCase().replace(/[^a-z0-9_-]/g, "") : `custom-${Date.now()}`;
        if (!id)
            throw new Error("Provider ID must contain letters, numbers, underscores, or hyphens");
        if (getAllProvidersDB().some((provider) => provider.id === id))
            throw new Error(`Provider ID '${id}' already exists`);
        const category = payload.category;
        const protocol = payload.protocol;
        const baseUrl = payload.baseUrl?.trim();
        if (baseUrl) {
            try {
                const url = new URL(baseUrl);
                if (!["http:", "https:"].includes(url.protocol))
                    throw new Error("unsupported protocol");
            } catch {
                throw new Error("Base URL must be a valid HTTP or HTTPS URL");
            }
        }
        const apiKey = payload.apiKey?.trim();
        if (category === "api_key" && !apiKey)
            throw new Error("API key is required for API key providers");

        const config = {
            id,
            providerId: id,
            name,
            category,
            protocol,
            baseUrl,
            apiKey,
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
            providerSpecificData: payload.providerSpecificData,
            enabled: true,
            createdAt: Date.now(),
        };

        upsertProviderDB(config);
        loadSavedProvidersFromDB();

        return providerDefinitionFromConfig(config);
    }
}
