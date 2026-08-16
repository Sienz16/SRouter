import { Skeleton } from "@/components/ui/skeleton";

export function CatalogSkeleton() {
    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="mt-2 h-7 w-56" />
                    <Skeleton className="mt-1.5 h-4 w-80 max-w-full" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-8 w-28 rounded-md" />
                </div>
            </div>

            {/* Toolbar Filters & Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-7 w-20 rounded-md" />
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-56 rounded-md" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                </div>
            </div>

            {/* Provider Grid Cards */}
            <div className="space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48 hidden sm:block" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-border/70 bg-card p-4 space-y-3.5 shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <Skeleton className="size-9 rounded-lg" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-3.5 w-24" />
                                            <Skeleton className="h-2.5 w-16" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-5 w-14 rounded-full" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Skeleton className="h-4 w-16 rounded" />
                                    <Skeleton className="h-4 w-14 rounded" />
                                    <Skeleton className="h-4 w-12 rounded" />
                                </div>
                                <div className="pt-2 border-t border-border/50 flex justify-end">
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
