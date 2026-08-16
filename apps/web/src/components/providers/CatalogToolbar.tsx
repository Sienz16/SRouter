import { LayoutGrid, List, Plus, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CatalogSummaryItems, FilterValue } from "@/utils/catalog.utils";

interface CatalogToolbarProps {
    isFetching: boolean;
    onRefresh: () => void;
    onAddProvider: () => void;
    summaryItems?: CatalogSummaryItems[];
    filterOptions: { value: FilterValue; label: string; count: number }[];
    filter: FilterValue;
    onFilterChange: (value: FilterValue) => void;
    search: string;
    onSearchChange: (value: string) => void;
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
}

export function CatalogToolbar({
    isFetching,
    onRefresh,
    onAddProvider,
    filterOptions,
    filter,
    onFilterChange,
    search,
    onSearchChange,
    viewMode,
    onViewModeChange
}: CatalogToolbarProps) {
    return (
        <div className="space-y-5">
            {/* Header */}
            <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Driver Registry
                    </p>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
                        Provider Catalog
                    </h1>
                    <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
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
                        className="h-8 text-xs cursor-pointer gap-1.5"
                    >
                        <RefreshCw
                            className={`size-3 text-muted-foreground ${isFetching ? "animate-spin" : ""}`}
                        />
                        <span>{isFetching ? "Refreshing…" : "Refresh"}</span>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onAddProvider}
                        className="h-8 text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
                    >
                        <Plus className="size-3.5" />
                        <span>Add Provider</span>
                    </Button>
                </div>
            </header>

            {/* Controls Bar: Filter Tabs, Search & View Toggle */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-border/60 pb-3">
                {/* Category Filter Tabs */}
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
                                className={`rounded-md px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    isActive
                                        ? "bg-secondary text-foreground font-semibold border border-border/80"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                                }`}
                            >
                                <span>{option.label}</span>
                                <span
                                    className={`rounded px-1 py-0.2 text-[9.5px] tabular-nums ${
                                        isActive
                                            ? "bg-background text-foreground"
                                            : "bg-secondary/70 text-muted-foreground"
                                    }`}
                                >
                                    {option.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & View Mode Switcher */}
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search
                            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                            strokeWidth={1.75}
                        />
                        <Input
                            type="text"
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Filter drivers & protocols…"
                            className="h-8 pl-8 pr-7 font-mono text-xs rounded-md bg-background"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => onSearchChange("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xs p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X className="size-3" />
                            </button>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center rounded-md border border-border/70 bg-secondary/30 p-0.5">
                        <button
                            type="button"
                            onClick={() => onViewModeChange("grid")}
                            className={`flex size-7 items-center justify-center rounded-xs transition-colors cursor-pointer ${
                                viewMode === "grid"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Grid view"
                            aria-label="Grid view"
                        >
                            <LayoutGrid className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange("list")}
                            className={`flex size-7 items-center justify-center rounded-xs transition-colors cursor-pointer ${
                                viewMode === "list"
                                    ? "bg-background text-foreground shadow-xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="List view"
                            aria-label="List view"
                        >
                            <List className="size-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
