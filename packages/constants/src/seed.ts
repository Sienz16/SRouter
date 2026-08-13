import type { ProviderCategory, ProviderProtocol } from "@srouter/types";
import {
    ANTIGRAVITY_BASE_URL,
    ANTHROPIC_BASE_URL,
    COMMANDCODE_BASE_URL,
    NEOSANTARA_BASE_URL,
    OPENAI_BASE_URL,
} from "./providers.js";

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

export const DEFAULT_PROVIDERS: DefaultProviderSeed[] = [
    {
        id: "kiro",
        name: "Kiro",
        category: "api_key",
        protocol: "custom",
        requiresApiKey: true,
        supportsCustomUrl: true,
        statusMessage: "Kiro credential missing",
    },
    {
        id: "neosantara",
        name: "Neosantara",
        category: "api_key",
        protocol: "openai",
        baseUrl: NEOSANTARA_BASE_URL,
        requiresApiKey: true,
        supportsCustomUrl: true,
        statusMessage: "Neosantara API key missing",
    },
    {
        id: "openai_codex",
        name: "OpenAI Codex / ChatGPT",
        category: "oauth",
        protocol: "openai",
        requiresApiKey: false,
        requiresOAuth: true,
        statusMessage: "OAuth token missing",
    },
    {
        id: "anthropic",
        name: "Anthropic Claude",
        category: "oauth",
        protocol: "anthropic",
        requiresApiKey: false,
        requiresOAuth: true,
        statusMessage: "OAuth token missing",
    },
    {
        id: "antigravity",
        name: "Antigravity Cloud",
        category: "oauth",
        protocol: "openai",
        baseUrl: ANTIGRAVITY_BASE_URL,
        requiresApiKey: false,
        requiresOAuth: true,
        statusMessage: "Antigravity OAuth token missing",
    },
    {
        id: "groq",
        name: "Groq Cloud",
        category: "free_tier",
        protocol: "openai",
        requiresApiKey: true,
        statusMessage: "Groq API key missing",
    },
    {
        id: "openrouter",
        name: "OpenRouter Free",
        category: "free_tier",
        protocol: "openai",
        requiresApiKey: true,
        statusMessage: "OpenRouter API key missing",
    },
    {
        id: "openai_api_key",
        name: "OpenAI Platform API Key",
        category: "api_key",
        protocol: "openai",
        baseUrl: OPENAI_BASE_URL,
        requiresApiKey: true,
        statusMessage: "OpenAI API key missing",
    },
    {
        id: "anthropic_api_key",
        name: "Anthropic Platform API Key",
        category: "api_key",
        protocol: "anthropic",
        baseUrl: ANTHROPIC_BASE_URL,
        requiresApiKey: true,
        statusMessage: "Anthropic API key missing",
    },
    {
        id: "commandcode",
        name: "Command Code",
        category: "api_key",
        protocol: "openai",
        baseUrl: COMMANDCODE_BASE_URL,
        requiresApiKey: true,
        supportsCustomUrl: true,
        statusMessage: "Command Code API key missing",
    },
];

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
