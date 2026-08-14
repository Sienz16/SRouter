import { Link } from "@tanstack/react-router";
import {
    ArrowRight,
    Boxes,
    Check,
    ChevronRight,
    ExternalLink,
    ShieldCheck,
    Zap,
} from "lucide-react";
import type { ProviderDefinition } from "@srouter/types";
import { ProviderIcon } from "@/components/ProviderIcon";
import { getConnectedCount } from "@/utils/provider.utils";
import { CATEGORY_LABELS } from "@srouter/constants";

const protocolLabels: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    gemini: "Gemini",
    custom: "Custom",
};

export function ProviderCard({ provider }: { provider: ProviderDefinition }) {
    const connectedCount = getConnectedCount(provider);
    const isConnected = connectedCount > 0;

    return (
        <Link
            to="/providers/$providerId"
            params={{ providerId: provider.id }}
            className="group flex flex-col justify-between rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 hover:border-[var(--line-strong)] hover:bg-[var(--hover)]/30 transition-all duration-150 hover:shadow-xs cursor-pointer font-mono"
        >
            {/* Top: Icon + Name & Status */}
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--field)] p-1.5 shadow-2xs">
                            <ProviderIcon providerId={provider.id} className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-xs font-bold text-[var(--ink)] group-hover:text-[var(--ink)]">
                                {provider.name}
                            </h3>
                            <span className="text-[10px] text-[var(--ink-3)] block truncate">
                                {provider.id}
                            </span>
                        </div>
                    </div>

                    {/* Status Pill */}
                    {isConnected ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{connectedCount} live</span>
                        </span>
                    ) : (
                        <span className="shrink-0 rounded-[4px] bg-[var(--field)] px-1.5 py-0.5 text-[9.5px] text-[var(--ink-3)]">
                            Ready
                        </span>
                    )}
                </div>

                {/* Metadata tags */}
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="rounded-[4px] border border-[var(--line)] bg-[var(--field)] px-1.5 py-0.5 text-[var(--ink-2)]">
                        {CATEGORY_LABELS[provider.category as keyof typeof CATEGORY_LABELS] ??
                            provider.category}
                    </span>
                    <span className="rounded-[4px] border border-[var(--line)] bg-[var(--field)] px-1.5 py-0.5 text-[var(--ink-2)]">
                        {protocolLabels[provider.protocol] ?? provider.protocol}
                    </span>
                    <span className="rounded-[4px] border border-[var(--line)] bg-[var(--field)] px-1.5 py-0.5 text-[var(--ink-3)]">
                        {provider.requiresOAuth
                            ? "OAuth"
                            : provider.requiresApiKey
                              ? "API Key"
                              : "Open"}
                    </span>
                </div>
            </div>

            {/* Bottom: Models count & Action */}
            <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                <span className="tabular-nums">
                    {provider.models.length} {provider.models.length === 1 ? "model" : "models"}
                </span>

                <div className="flex items-center gap-1 text-[var(--ink)] font-semibold text-[10.5px] group-hover:translate-x-0.5 transition-transform">
                    <span>{isConnected ? "Manage" : "Configure"}</span>
                    <ChevronRight className="size-3 text-[var(--ink-3)] group-hover:text-[var(--ink)]" />
                </div>
            </div>
        </Link>
    );
}
