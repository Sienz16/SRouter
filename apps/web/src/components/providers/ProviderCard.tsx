import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ProviderDefinition } from "@srouter/types";
import { ProviderIcon } from "@/components/ProviderIcon";
import { getConnectedCount } from "@/utils/provider.utils";
import { CATEGORY_LABELS } from "@srouter/constants";

const protocolLabels: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    gemini: "Gemini",
    custom: "Custom"
};

export function ProviderCard({ provider }: { provider: ProviderDefinition }) {
    const connectedCount = getConnectedCount(provider);
    const isConnected = connectedCount > 0;

    return (
        <Link
            to="/providers/$providerId"
            params={{ providerId: provider.id }}
            className="group flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 hover:border-border hover:bg-secondary/15 transition-all duration-150 hover:shadow-xs cursor-pointer"
        >
            {/* Top: Icon + Name & Status */}
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/40 p-1.5 shadow-2xs">
                            <ProviderIcon providerId={provider.id} className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-xs font-semibold text-foreground group-hover:text-foreground">
                                {provider.name}
                            </h3>
                            <span className="font-mono text-[10px] text-muted-foreground block truncate">
                                {provider.id}
                            </span>
                        </div>
                    </div>

                    {/* Status Pill */}
                    {isConnected ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{connectedCount} live</span>
                        </span>
                    ) : (
                        <span className="shrink-0 rounded-md bg-secondary/50 px-2 py-0.5 font-mono text-[9.5px] text-muted-foreground border border-border/40">
                            Ready
                        </span>
                    )}
                </div>

                {/* Metadata tags */}
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
                    <span className="rounded-md border border-border/50 bg-secondary/30 px-1.5 py-0.5 text-muted-foreground">
                        {CATEGORY_LABELS[provider.category as keyof typeof CATEGORY_LABELS] ??
                            provider.category}
                    </span>
                    <span className="rounded-md border border-border/50 bg-secondary/30 px-1.5 py-0.5 text-muted-foreground">
                        {protocolLabels[provider.protocol] ?? provider.protocol}
                    </span>
                    <span className="rounded-md border border-border/50 bg-secondary/30 px-1.5 py-0.5 text-muted-foreground">
                        {provider.requiresOAuth
                            ? "OAuth 2.0"
                            : provider.requiresApiKey
                              ? "API Key"
                              : "Public"}
                    </span>
                </div>
            </div>

            {/* Bottom: Action */}
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-muted-foreground">
                    {isConnected ? "Active driver" : "Unconnected"}
                </span>
                <div className="flex items-center gap-1 text-foreground font-semibold text-[11px] group-hover:translate-x-0.5 transition-transform">
                    <span>{isConnected ? "Manage" : "Configure"}</span>
                    <ChevronRight className="size-3 text-muted-foreground group-hover:text-foreground" />
                </div>
            </div>
        </Link>
    );
}
