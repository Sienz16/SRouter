import { Boxes, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CatalogSummaryItems, FilterValue } from "@/utils/catalog.utils";

interface CatalogToolbarProps {
    isFetching: boolean;
    onRefresh: () => void;
    onAddProvider: () => void;
    summaryItems: CatalogSummaryItems[];
    filterOptions: { value: FilterValue; label: string; count: number }[];
    filter: FilterValue;
    onFilterChange: (value: FilterValue) => void;
    search: string;
    onSearchChange: (value: string) => void;
}

export function CatalogToolbar({
    isFetching,
    onRefresh,
    onAddProvider,
    summaryItems,
    filterOptions,
    filter,
    onFilterChange,
    search,
    onSearchChange,
}: CatalogToolbarProps) {
    return (
        <div className="space-y-6 font-mono">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--line)] pb-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-[6px] bg-[var(--field)] text-[var(--ink)]">
                            <Boxes className="size-3.5" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-[var(--ink)]">
                            Provider Catalog
                        </h1>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Multi-Driver Gateway
                        </span>
                    </div>
                    <p className="text-xs text-[var(--ink-3)] max-w-2xl leading-relaxed">
                        Registered upstream LLM drivers, inference backends, and live connected
                        endpoints.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isFetching}
                        className="h-8 text-xs border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
                    >
                        <RefreshCw
                            className={`size-3 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
                        />
                        <span>{isFetching ? "Refreshing" : "Refresh"}</span>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onAddProvider}
                        className="h-8 text-xs bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 cursor-pointer shadow-xs transition-transform active:scale-[0.98]"
                    >
                        <Plus className="size-3.5 mr-1" />
                        <span>Add Provider</span>
                    </Button>
                </div>
            </div>

            {/* Bento Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {summaryItems.map((item, idx) => {
                    const isConnectedCard = item.label.toLowerCase() === "connected";
                    return (
                        <div
                            key={item.label}
                            className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                                <span>{item.label}</span>
                                {idx === 0 && <Boxes className="size-3.5 text-[var(--ink-3)]" />}
                                {idx === 1 && (
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                                {idx === 2 && <ShieldCheck className="size-3.5 text-amber-500" />}
                                {idx === 3 && <Zap className="size-3.5 text-blue-500" />}
                            </div>
                            <div className="mt-2">
                                <div className="text-2xl font-bold tabular-nums text-[var(--ink)]">
                                    {item.value}
                                </div>
                                <p className="mt-0.5 text-[10.5px] text-[var(--ink-3)] truncate">
                                    {item.detail}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Controls Bar: Segmented Tabs & Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-3">
                {/* Segmented Filter Pills */}
                <div
                    role="tablist"
                    aria-label="Filter providers by category"
                    className="flex flex-wrap items-center gap-1.5"
                >
                    {filterOptions.map((option) => {
                        const isActive = filter === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => onFilterChange(option.value)}
                                className={`rounded-[6px] px-2.5 py-1 text-[11px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    isActive
                                        ? "bg-[var(--ink)] text-[var(--canvas)] font-bold shadow-xs"
                                        : "bg-[var(--field)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                                }`}
                            >
                                <span>{option.label}</span>
                                <span
                                    className={`rounded-[3px] px-1 py-0.2 text-[9.5px] tabular-nums ${
                                        isActive
                                            ? "bg-[var(--canvas)]/20 text-[var(--canvas)]"
                                            : "bg-[var(--line)] text-[var(--ink-3)]"
                                    }`}
                                >
                                    {option.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-[var(--ink-3)]"
                        strokeWidth={1.75}
                    />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search driver, id, protocol..."
                        className="h-7.5 pl-7 text-[11.5px] rounded-[6px] border-[var(--line)] bg-[var(--canvas)]"
                    />
                </div>
            </div>
        </div>
    );
}
