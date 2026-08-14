import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/useCatalog";
import { AddProviderSheet } from "@/components/providers/AddProviderSheet";
import { Catalog } from "@/components/providers/Catalog";
import { CatalogSkeleton } from "@/components/providers/CatalogSkeleton";
import { CatalogToolbar } from "@/components/providers/CatalogToolbar";

export const Route = createFileRoute("/providers/")({
    staticData: { title: "Providers" },
    component: ProvidersPage,
});

function ProvidersPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const catalog = useCatalog();
    const { data, error, isPending, isFetching, refetch } = catalog;

    if (isPending && !data) {
        return (
            <div className="mx-auto w-full max-w-6xl">
                <CatalogSkeleton />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="mx-auto w-full max-w-6xl font-mono">
                <div className="flex min-h-64 flex-col items-center justify-center rounded-[12px] border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
                        <TriangleAlert className="size-5" strokeWidth={1.75} />
                    </div>
                    <h1 className="text-sm font-bold text-foreground">
                        Unable to load provider catalog
                    </h1>
                    <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                        {error instanceof Error
                            ? error.message
                            : "The gateway returned an unexpected network response."}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4 h-8 text-xs border-[var(--line)] cursor-pointer"
                        onClick={() => void refetch()}
                    >
                        <RefreshCw className="size-3 mr-1.5" />
                        Retry Connection
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <CatalogToolbar
                isFetching={isFetching}
                onRefresh={() => void refetch()}
                onAddProvider={() => setIsAddOpen(true)}
                summaryItems={catalog.summaryItems}
                filterOptions={catalog.filterOptions}
                filter={catalog.filter}
                onFilterChange={catalog.setFilter}
                search={catalog.search}
                onSearchChange={catalog.setSearch}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            <Catalog groups={catalog.groups} search={catalog.search} viewMode={viewMode} />

            <AddProviderSheet open={isAddOpen} onOpenChange={setIsAddOpen} />
        </div>
    );
}
