import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ProviderDefinition } from "@srouter/types";
import { Badge } from "@/components/ui/badge";
import { ProviderIcon } from "@/components/ProviderIcon";
import { getConnectedCount } from "@/utils/provider.utils";

const protocolLabels: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    gemini: "Gemini",
    custom: "Custom"
};

function authLabel(provider: ProviderDefinition): string {
    if (provider.requiresOAuth) return "OAuth 2.0";
    if (provider.requiresApiKey) return "API Key";
    return "Public Endpoint";
}

export function ProviderRow({ provider }: { provider: ProviderDefinition }) {
    const connectedCount = getConnectedCount(provider);
    const isConnected = connectedCount > 0;

    return (
        <Link
            to="/providers/$providerId"
            params={{ providerId: provider.id }}
            className="group flex items-center justify-between gap-3 px-3.5 py-3 rounded-[8px] hover:bg-[var(--hover)]/50 transition-colors"
        >
            {/* Left: Icon & Info */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-8.5 shrink-0 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] shadow-2xs">
                    <ProviderIcon providerId={provider.id} className="size-4" />
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="truncate text-xs font-semibold text-[var(--ink)]">
                            {provider.name}
                        </span>

                        {isConnected ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <span className="size-1 rounded-full bg-emerald-500" />
                                {connectedCount}{" "}
                                {connectedCount === 1 ? "live connection" : "live connections"}
                            </span>
                        ) : (
                            <span className="rounded-[4px] bg-[var(--field)] px-1.5 py-0.2 text-[9.5px] text-[var(--ink-3)]">
                                Unconfigured
                            </span>
                        )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-[var(--ink-3)] font-mono">
                        <span className="truncate">{provider.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{protocolLabels[provider.protocol] ?? provider.protocol}</span>
                        <span aria-hidden="true">·</span>
                        <span>{authLabel(provider)}</span>
                    </div>
                </div>
            </div>

            {/* Right: Chevron Action */}
            <div className="flex shrink-0 items-center gap-1.5 text-[10.5px] font-semibold text-[var(--ink-3)] group-hover:text-[var(--ink)] font-mono">
                <span className="hidden sm:inline">{isConnected ? "Manage" : "Configure"}</span>
                <ChevronRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                />
            </div>
        </Link>
    );
}
