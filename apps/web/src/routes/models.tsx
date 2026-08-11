import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    Bot,
    LayoutGrid,
    Table as TableIcon,
    Play,
    Search,
    Sparkles,
    Check,
    Copy,
    Cpu,
    Zap,
    Shield,
    SlidersHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ModelListResponse, ModelObject } from "@srouter/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

export const Route = createFileRoute("/models")({
    staticData: { title: "Models" },
    component: ModelsPage,
});

function getProviderBadgeColor(provider: string) {
    const p = provider.toLowerCase();
    if (p.includes("groq")) return "bg-amber-500/10 text-amber-500 border-amber-500/25";
    if (p.includes("openai")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/25";
    if (p.includes("anthropic")) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/25";
    if (p.includes("openrouter")) return "bg-sky-500/10 text-sky-400 border-sky-500/25";
    if (p.includes("antigravity")) return "bg-purple-500/10 text-purple-400 border-purple-500/25";
    return "bg-secondary text-muted-foreground border-border/60";
}

function ModelCard({ model }: { model: ModelObject }) {
    const [copied, setCopied] = useState(false);
    const provider = model.owned_by ?? model.id.split("/")[0] ?? "srouter";
    const badgeColorClass = getProviderBadgeColor(provider);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(model.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <Card className="p-4 border border-border/70 bg-card hover:border-foreground/30 transition-all hover:shadow-xs flex flex-col justify-between gap-3">
            <div>
                {/* Header: Model ID + Provider Badge */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded border border-border/60 bg-secondary/30 text-foreground">
                            <Bot className="size-3.5 text-muted-foreground" />
                        </div>
                        <span
                            className="font-mono text-xs font-semibold text-foreground truncate block min-w-0 flex-1"
                            title={model.id}
                        >
                            {model.id}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                void handleCopy();
                            }}
                            className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded hover:bg-secondary shrink-0"
                            title="Copy Model ID"
                        >
                            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                        </button>
                    </div>

                    <Badge
                        variant="outline"
                        className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 border ${badgeColorClass} shrink-0`}
                    >
                        {provider}
                    </Badge>
                </div>

                {/* Capabilities & Metadata */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded border border-border/50 bg-secondary/30 px-2 py-0.5 font-mono text-[10px] text-foreground">
                        <Sparkles className="size-3 text-amber-500" />
                        Chat Completion
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border border-border/50 bg-secondary/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        <Zap className="size-3 text-emerald-500" />
                        Streaming
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border border-border/50 bg-secondary/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        <Cpu className="size-3 text-sky-500" />
                        Function Call
                    </span>
                </div>
            </div>

            {/* Footer: Status + Test Action */}
            <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[10px]">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Active</span>
                </div>

                <Link
                    to="/playground"
                    search={{ model: model.id }}
                    className="inline-flex items-center gap-1 rounded bg-secondary hover:bg-foreground hover:text-background px-2.5 py-1 text-xs font-semibold text-foreground transition-all active:scale-95 border border-border/60"
                >
                    <Play className="size-3" />
                    <span>Test</span>
                </Link>
            </div>
        </Card>
    );
}

function ModelsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProviderFilter, setSelectedProviderFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    const { data, isLoading, error } = useQuery({
        queryKey: ["models"],
        queryFn: () => api.get<ModelListResponse>("/v1/models"),
    });

    const models: ModelObject[] = data?.data ?? [];

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-28 rounded-md" />
                    <Skeleton className="h-28 rounded-md" />
                    <Skeleton className="h-28 rounded-md" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-xs font-mono text-destructive">
                    Gagal memuat daftar model: {error instanceof Error ? error.message : "Unknown error"}
                </div>
            </div>
        );
    }

    // Extract unique provider names for quick filter pills
    const providersList = Array.from(
        new Set(models.map((m) => m.owned_by ?? m.id.split("/")[0] ?? "srouter"))
    );

    const filteredModels = models.filter((m) => {
        const provider = (m.owned_by ?? m.id.split("/")[0] ?? "srouter").toLowerCase();
        const matchesQuery =
            m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.includes(searchQuery.toLowerCase());

        const matchesProvider =
            selectedProviderFilter === "all" || provider === selectedProviderFilter.toLowerCase();

        return matchesQuery && matchesProvider;
    });

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Models Registry</h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Total <span className="font-mono font-semibold text-foreground">{models.length}</span> model LLM siap pakai dari semua provider terhubung.
                    </p>
                </div>

                <div className="flex items-center gap-1.5 border border-border/60 bg-secondary/30 rounded p-1">
                    <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        aria-label="Grid view"
                        className={`flex size-7 items-center justify-center rounded transition-all ${
                            viewMode === "grid"
                                ? "bg-foreground text-background font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <LayoutGrid className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        aria-label="Table view"
                        className={`flex size-7 items-center justify-center rounded transition-all ${
                            viewMode === "table"
                                ? "bg-foreground text-background font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <TableIcon className="size-3.5" />
                    </button>
                </div>
            </div>

            {/* Search & Provider Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => setSelectedProviderFilter("all")}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all shrink-0 ${
                            selectedProviderFilter === "all"
                                ? "bg-foreground text-background font-semibold"
                                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        All ({models.length})
                    </button>
                    {providersList.map((p) => {
                        const count = models.filter(
                            (m) => (m.owned_by ?? m.id.split("/")[0] ?? "srouter").toLowerCase() === p.toLowerCase()
                        ).length;
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setSelectedProviderFilter(p)}
                                className={`px-3 py-1.5 rounded text-xs font-medium font-mono uppercase transition-all shrink-0 ${
                                    selectedProviderFilter === p
                                        ? "bg-foreground text-background font-semibold"
                                        : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {p} ({count})
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search model ID…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded border border-border/60 bg-secondary/30 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                    />
                </div>
            </div>

            {/* Grid vs Table View Rendering */}
            {filteredModels.length === 0 ? (
                <div className="rounded border border-dashed border-border/60 p-12 text-center text-xs font-mono text-muted-foreground">
                    Tidak ada model yang cocok dengan kriteria pencarian.
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredModels.map((m) => (
                        <ModelCard key={m.id} model={m} />
                    ))}
                </div>
            ) : (
                <Card className="p-0 overflow-hidden border border-border/70">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Model ID</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Capabilities</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredModels.map((m) => {
                                const provider = m.owned_by ?? m.id.split("/")[0] ?? "srouter";
                                const badgeColorClass = getProviderBadgeColor(provider);
                                return (
                                    <TableRow key={m.id}>
                                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                                            {m.id}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`font-mono text-[10px] font-semibold uppercase px-2 py-0.5 border ${badgeColorClass}`}
                                            >
                                                {provider}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs font-mono">
                                            Chat, Streaming, Tools
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-mono text-xs">
                                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                                Active
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                to="/playground"
                                                search={{ model: m.id }}
                                                className="inline-flex items-center gap-1 rounded bg-secondary text-foreground hover:bg-foreground hover:text-background px-2.5 py-1 text-xs font-semibold transition-all border border-border/60"
                                            >
                                                <Play className="size-3" />
                                                Playground
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}



