import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Plus, ShieldCheck, Sparkles, Search, Layers, Zap, Bot, Play, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import type { ProviderCategory, ProviderDefinition, ProviderProtocol } from "@srouter/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProviderIcon } from "@/components/ui/provider-icon";

export const Route = createFileRoute("/providers/")({
    staticData: { title: "Providers" },
    component: ProvidersPage,
});

interface CatalogSummary {
    total: number;
    categories: {
        custom: ProviderDefinition[];
        oauth: ProviderDefinition[];
        free_tier: ProviderDefinition[];
        api_key: ProviderDefinition[];
    };
}

const categoryLabels: Record<string, string> = {
    custom: "Custom Providers",
    oauth: "OAuth Auth",
    free_tier: "Free Tier",
    api_key: "API Key Auth",
};

function ProviderCard({ p }: { p: ProviderDefinition }) {
    const isConnected = p.status.state === "connected";
    const connectedCount = p.status.connectedCount ?? (isConnected ? 1 : 0);

    return (
        <Link
            to="/providers/$providerId"
            params={{ providerId: p.id }}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/70 p-3 hover:border-foreground/30 transition-all hover:bg-card cursor-pointer group shadow-2xs"
        >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/40 text-foreground group-hover:scale-105 transition-transform">
                <ProviderIcon providerId={p.id} className="size-4 text-foreground" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <h3 className="font-semibold text-xs text-foreground truncate">{p.name}</h3>
                </div>

                {isConnected ? (
                    <div className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{connectedCount} Connected</span>
                    </div>
                ) : (
                    <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                        No connections
                    </span>
                )}
            </div>
        </Link>
    );
}

function ProvidersPage() {
    const queryClient = useQueryClient();
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [formId, setFormId] = useState("");
    const [formName, setFormName] = useState("");
    const [formCategory, setFormCategory] = useState<ProviderCategory>("custom");
    const [formProtocol, setFormProtocol] = useState<ProviderProtocol>("openai");
    const [formBaseUrl, setFormBaseUrl] = useState("");
    const [formApiKey, setFormApiKey] = useState("");
    const [formError, setFormError] = useState("");

    const { data, isLoading, error } = useQuery({
        queryKey: ["providers", "catalog"],
        queryFn: () => api.get<CatalogSummary>("/v1/providers/catalog"),
    });

    const addMutation = useMutation({
        mutationFn: (payload: {
            id?: string;
            name: string;
            category: ProviderCategory;
            protocol: ProviderProtocol;
            baseUrl?: string;
            apiKey?: string;
        }) => api.post<ProviderDefinition>("/v1/providers", payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["providers", "catalog"] });
            setIsAddOpen(false);
            setFormId("");
            setFormName("");
            setFormBaseUrl("");
            setFormApiKey("");
            setFormError("");
        },
        onError: (err: Error) => {
            setFormError(err.message || "Failed to add provider");
        },
    });

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            setFormError("Provider name is required");
            return;
        }
        setFormError("");
        addMutation.mutate({
            id: formId.trim() || undefined,
            name: formName.trim(),
            category: formCategory,
            protocol: formProtocol,
            baseUrl: formBaseUrl.trim() || undefined,
            apiKey: formApiKey.trim() || undefined,
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-24 rounded-md" />
                    <Skeleton className="h-24 rounded-md" />
                    <Skeleton className="h-24 rounded-md" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-xs font-mono text-destructive">
                    Gagal memuat catalog providers: {error instanceof Error ? error.message : "Unknown error"}
                </div>
            </div>
        );
    }

    const categories = ["custom", "oauth", "free_tier", "api_key"] as const;
    const allProviders = categories.flatMap((cat) => data.categories[cat]);

    const filteredProviders = (cat: string) => {
        const list = cat === "all" ? allProviders : data.categories[cat as keyof typeof data.categories] ?? [];
        return list.filter(
            (p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.protocol.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const connectedCount = allProviders.filter((p) => p.status.state === "connected").length;
    const readyCount = allProviders.filter((p) => p.status.state === "ready").length;

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Providers Catalog</h1>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Kelola dan konfigurasi provider LLM terintegrasi di gateway.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsAddOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:bg-foreground/90 transition-all shadow-xs"
                >
                    <Plus className="size-3.5" />
                    <span>Add Provider</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 rounded border border-border/70 bg-card p-3.5">
                    <Boxes className="size-4 text-muted-foreground" />
                    <div>
                        <div className="text-lg font-bold font-mono text-foreground">{data.total}</div>
                        <div className="text-xs text-muted-foreground">Total Drivers</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded border border-border/70 bg-card p-3.5">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <div>
                        <div className="text-lg font-bold font-mono text-emerald-500">{connectedCount}</div>
                        <div className="text-xs text-muted-foreground">Connected</div>
                    </div>
                </div>

                <div className="flex items-center gap-3 rounded border border-border/70 bg-card p-3.5">
                    <Sparkles className="size-4 text-muted-foreground" />
                    <div>
                        <div className="text-lg font-bold font-mono text-foreground">{readyCount}</div>
                        <div className="text-xs text-muted-foreground">Ready to Configure</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
                            selectedCategory === "all"
                                ? "bg-foreground text-background font-semibold"
                                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        All ({data.total})
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
                                selectedCategory === cat
                                    ? "bg-foreground text-background font-semibold"
                                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {categoryLabels[cat]} ({data.categories[cat].length})
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search provider…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded border border-border/60 bg-secondary/30 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                    />
                </div>
            </div>

            {selectedCategory === "all" ? (
                categories.map((cat) => {
                    const list = filteredProviders(cat);
                    if (list.length === 0 && searchQuery) return null;
                    return (
                        <section key={cat} className="space-y-3">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {categoryLabels[cat]} ({list.length})
                            </h2>
                            {list.length === 0 ? (
                                <div className="rounded border border-dashed border-border/60 p-6 text-center text-xs font-mono text-muted-foreground">
                                    Tidak ada provider di kategori ini.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {list.map((p) => (
                                        <ProviderCard key={p.id} p={p} />
                                    ))}
                                </div>
                            )}
                        </section>
                    );
                })
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProviders(selectedCategory).map((p) => (
                        <ProviderCard key={p.id} p={p} />
                    ))}
                </div>
            )}

            {/* Add Provider Drawer Sheet */}
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                <SheetContent side="right" className="sm:max-w-md w-full p-6 space-y-5 overflow-y-auto">
                    <SheetHeader className="p-0 border-b border-border/60 pb-3">
                        <SheetTitle className="text-base font-bold text-foreground">Add Custom Provider</SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                            Tambah atau kustomisasi endpoint LLM provider (OpenAI, Groq, Ollama, Anthropic).
                        </SheetDescription>
                    </SheetHeader>

                    {formError && (
                        <div className="rounded border border-destructive/40 bg-destructive/10 p-2.5 text-xs font-mono text-destructive">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                        <div className="space-y-1">
                            <label htmlFor="provider-name" className="font-medium text-foreground block">
                                Provider Name *
                            </label>
                            <input
                                id="provider-name"
                                type="text"
                                placeholder="e.g. Groq Cloud API, Ollama Local"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full rounded border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label htmlFor="provider-category" className="font-medium text-foreground block">
                                    Category
                                </label>
                                <select
                                    id="provider-category"
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value as ProviderCategory)}
                                    className="w-full rounded border border-border/60 bg-secondary/30 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="custom">Custom Provider</option>
                                    <option value="api_key">API Key Auth</option>
                                    <option value="free_tier">Free Tier</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="provider-protocol" className="font-medium text-foreground block">
                                    Protocol
                                </label>
                                <select
                                    id="provider-protocol"
                                    value={formProtocol}
                                    onChange={(e) => setFormProtocol(e.target.value as ProviderProtocol)}
                                    className="w-full rounded border border-border/60 bg-secondary/30 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="openai">OpenAI Compatible</option>
                                    <option value="anthropic">Anthropic Messages</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="provider-id" className="font-medium text-foreground block">
                                Provider ID (Optional)
                            </label>
                            <input
                                id="provider-id"
                                type="text"
                                placeholder="e.g. custom-groq"
                                value={formId}
                                onChange={(e) => setFormId(e.target.value)}
                                className="w-full rounded border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="provider-base-url" className="font-medium text-foreground block">
                                Base Endpoint URL
                            </label>
                            <input
                                id="provider-base-url"
                                type="text"
                                placeholder="e.g. https://api.groq.com/openai/v1"
                                value={formBaseUrl}
                                onChange={(e) => setFormBaseUrl(e.target.value)}
                                className="w-full rounded border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="provider-api-key" className="font-medium text-foreground block">
                                API Key / Access Token
                            </label>
                            <input
                                id="provider-api-key"
                                type="password"
                                placeholder="gsk_..."
                                value={formApiKey}
                                onChange={(e) => setFormApiKey(e.target.value)}
                                className="w-full rounded border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddOpen(false)}
                                className="rounded border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={addMutation.isPending}
                                className="rounded bg-foreground text-background px-4 py-1.5 text-xs font-semibold hover:bg-foreground/90 disabled:opacity-50"
                            >
                                {addMutation.isPending ? "Saving…" : "Save Provider"}
                            </button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
