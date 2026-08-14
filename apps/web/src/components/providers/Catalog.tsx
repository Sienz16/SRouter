import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "@srouter/constants";
import { Search } from "lucide-react";
import type { ProviderDefinition } from "@srouter/types";
import { ProviderRow } from "./ProviderRow";

interface CatalogGroup {
    category: string;
    providers: ProviderDefinition[];
}

interface CatalogProps {
    groups: CatalogGroup[];
    search: string;
}

export function Catalog({ groups, search }: CatalogProps) {
    const normalizedSearch = search.trim();

    if (groups.length === 0) {
        return (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center font-mono">
                <div className="flex size-9 items-center justify-center rounded-full bg-[var(--field)] text-[var(--ink-3)] mb-3">
                    <Search className="size-4" strokeWidth={1.75} />
                </div>
                <p className="text-sm font-semibold text-[var(--ink)]">No Matching Providers</p>
                <p className="mt-1 max-w-sm text-xs text-[var(--ink-3)] leading-relaxed">
                    {normalizedSearch
                        ? `Nothing matches “${normalizedSearch}”. Try a different search term or category filter.`
                        : "No drivers registered in this category yet."}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 font-mono">
            {groups.map((group) => (
                <section
                    key={group.category}
                    aria-labelledby={`category-${group.category}`}
                    className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-2xs"
                >
                    {/* Category Header */}
                    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--field)]/40 px-4 py-3">
                        <div className="min-w-0">
                            <h2
                                id={`category-${group.category}`}
                                className="text-xs font-bold text-[var(--ink)]"
                            >
                                {CATEGORY_LABELS[group.category as keyof typeof CATEGORY_LABELS] ??
                                    group.category}
                            </h2>
                            <p className="mt-0.5 text-[11px] text-[var(--ink-3)] truncate">
                                {CATEGORY_DESCRIPTIONS[
                                    group.category as keyof typeof CATEGORY_DESCRIPTIONS
                                ] ?? ""}
                            </p>
                        </div>
                        <span className="shrink-0 rounded-[4px] bg-[var(--line)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--ink-2)]">
                            {group.providers.length}{" "}
                            {group.providers.length === 1 ? "driver" : "drivers"}
                        </span>
                    </header>

                    {/* Provider Rows */}
                    <div className="p-1.5 divide-y divide-[var(--line)]/60">
                        {group.providers.map((provider) => (
                            <ProviderRow key={provider.id} provider={provider} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
