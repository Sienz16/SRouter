import type { ProviderCategory, ProviderProtocol } from "@srouter/types";
import { KNOWN_PROVIDERS } from "./providers.js";

/**
 * Built-in provider driver metadata used to seed the SQLite providers table
 * on first startup. After seeding, the database is the single source of truth
 * for the dashboard catalog; this constant only describes the seed rows.
 */
export interface DefaultProviderSeed {
    id: string;
    name: string;
    category: ProviderCategory;
    protocol: ProviderProtocol;
    baseUrl?: string;
    requiresApiKey: boolean;
    requiresOAuth?: boolean;
    supportsCustomUrl?: boolean;
    /** Shown when the driver has no active connection yet. */
    statusMessage: string;
}

/**
 * Seed rows are the known-provider catalog minus the model-alias field; the
 * catalog in `providers.ts` is the single source of truth for driver metadata.
 */
export const DEFAULT_PROVIDERS: DefaultProviderSeed[] = KNOWN_PROVIDERS.map(
    ({ alias: _alias, ...seed }) => seed,
);

export const DEFAULT_PROVIDER_MAP: Record<string, DefaultProviderSeed> = Object.fromEntries(
    DEFAULT_PROVIDERS.map((seed) => [seed.id, seed]),
);

/**
 * Marker stored in a provider row's `providerSpecificData` when the row is a
 * built-in driver seed rather than a real connection. Seed rows describe the
 * driver (category, protocol, status) but carry no credentials, so they are
 * excluded from executor registration and connection counts.
 */
export const SEED_MARKER = "__seed__";

export function isSeedProvider(row: { providerSpecificData?: Record<string, string> }): boolean {
    return row.providerSpecificData?.[SEED_MARKER] === "true";
}
