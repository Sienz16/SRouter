import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    AlertTriangle,
    Bot,
    Check,
    Copy,
    Cpu,
    ExternalLink,
    Globe,
    Key,
    Layers,
    Lock,
    Play,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Sparkles,
    Trash2,
    Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ProviderCategory, ProviderConfig, ProviderDefinition, ProviderProtocol } from "@srouter/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProviderIcon } from "@/components/ui/provider-icon";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConnectOAuthModal } from "@/components/ui/connect-oauth-modal";

export const Route = createFileRoute("/providers/$providerId")({
    component: ProviderDetailPage,
});

function ProviderDetailPage() {
    const { providerId } = Route.useParams();
    const queryClient = useQueryClient();

    const [modelSearch, setModelSearch] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [roundRobin, setRoundRobin] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);

    // Form fields for adding new connection
    const [formName, setFormName] = useState("");
    const [formBaseUrl, setFormBaseUrl] = useState("");
    const [formApiKey, setFormApiKey] = useState("");
    const [formError, setFormError] = useState("");

    const { data: provider, isLoading, error, refetch } = useQuery({
        queryKey: ["providers", providerId],
        queryFn: () => api.get<ProviderDefinition>(`/v1/providers/${providerId}`),
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
            void queryClient.invalidateQueries({ queryKey: ["providers", providerId] });
            void queryClient.invalidateQueries({ queryKey: ["providers", "catalog"] });
            setIsAddOpen(false);
            setFormName("");
            setFormBaseUrl("");
            setFormApiKey("");
            setFormError("");
        },
        onError: (err: Error) => {
            setFormError(err.message || "Failed to add connection");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (connectionId: string) => api.delete<{ message: string }>(`/v1/providers/${connectionId}`),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["providers", providerId] });
            void queryClient.invalidateQueries({ queryKey: ["providers", "catalog"] });
        },
    });

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(text);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            setFormError("Connection name is required");
            return;
        }
        if (!provider) return;

        setFormError("");
        addMutation.mutate({
            id: `${provider.id}-${Date.now()}`,
            name: formName.trim(),
            category: provider.category,
            protocol: provider.protocol,
            baseUrl: formBaseUrl.trim() || provider.defaultBaseUrl || undefined,
            apiKey: formApiKey.trim() || undefined,
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    if (error || !provider) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
                <Link
                    to="/providers"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Providers Catalog</span>
                </Link>
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-xs font-mono text-destructive space-y-2">
                    <p className="font-semibold text-sm">Provider '{providerId}' not found.</p>
                    <p className="text-muted-foreground">
                        {error instanceof Error ? error.message : "Provider definition missing in gateway registry."}
                    </p>
                </div>
            </div>
        );
    }

    const connections: ProviderConfig[] = provider.connections ?? [];
    const activeConnectionsCount = connections.filter((c: ProviderConfig) => c.enabled).length;

    const filteredModels = provider.models.filter((m) =>
        m.id.toLowerCase().includes(modelSearch.toLowerCase())
    );

    const handleAddConnection = () => {
        if (provider?.requiresOAuth) {
            setIsOAuthModalOpen(true);
        } else {
            setIsAddOpen(true);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
            {/* Back Navigation */}
            <div>
                <Link
                    to="/providers"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Providers Catalog</span>
                </Link>
            </div>

            {/* Header Section */}
            <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card p-2 shadow-2xs">
                        <ProviderIcon providerId={provider.id} className="size-8 text-foreground" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{provider.name}</h1>
                            <Badge
                                variant={activeConnectionsCount > 0 ? "emerald" : "secondary"}
                                className="font-mono text-[10px] uppercase px-2 py-0.5"
                            >
                                <span
                                    className={`size-1.5 rounded-full ${
                                        activeConnectionsCount > 0 ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                                    }`}
                                />
                                {activeConnectionsCount > 0 ? "Connected" : "No Connections"}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {activeConnectionsCount} active connections in database
                        </p>
                    </div>
                </div>

                <a
                    href="https://antigravity.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-orange-500 hover:text-orange-400 hover:underline"
                >
                    <ExternalLink className="size-3.5" />
                    <span>Sign up / Learn more</span>
                </a>
            </div>

            {/* Risk Notice Alert Banner if OAuth */}
            {provider.requiresOAuth && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-amber-500 text-xs font-mono leading-relaxed">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                        <span className="font-semibold">Risk Notice:</span> This provider uses a subscription/OAuth session not officially licensed for proxy/router use. Account may be restricted or banned. Use at your own risk.
                    </div>
                </div>
            )}

            {/* Real Connections Card loaded from SQLite DB */}
            <Card className="p-5 border border-border/70 bg-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-foreground">Connections ({connections.length})</h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 hover:bg-secondary px-3 py-1.5 text-xs font-medium font-mono text-foreground transition-all"
                        >
                            <RefreshCw className="size-3.5 text-muted-foreground" />
                            <span>Test Connection</span>
                        </button>

                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                            <span>Round Robin</span>
                            <button
                                type="button"
                                onClick={() => setRoundRobin(!roundRobin)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                    roundRobin ? "bg-orange-500" : "bg-secondary"
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        roundRobin ? "translate-x-4" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {connections.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-8 text-center space-y-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-secondary/50 mx-auto text-muted-foreground">
                            <Key className="size-5" />
                        </div>
                        <p className="text-xs font-mono text-muted-foreground">
                            Belum ada koneksi terhubung untuk provider <span className="text-foreground font-semibold">{provider.name}</span> di database.
                        </p>
                        <button
                            type="button"
                            onClick={handleAddConnection}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs"
                        >
                            <Plus className="size-4" />
                            <span>Add Connection</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            {connections.map((c: ProviderConfig, index: number) => (
                                <div
                                    key={c.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 p-3 hover:border-foreground/20 transition-all text-xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Lock className="size-3.5 text-muted-foreground shrink-0" />
                                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                            <span className="font-mono font-semibold text-foreground truncate">{c.name}</span>

                                            <Badge
                                                variant={c.enabled ? "emerald" : "secondary"}
                                                className="font-mono text-[10px] px-1.5 py-0.2"
                                            >
                                                ● {c.enabled ? "active" : "disabled"}
                                            </Badge>

                                            {c.apiKey && (
                                                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.2 text-muted-foreground">
                                                    API Key ({c.apiKey.slice(0, 4)}***)
                                                </Badge>
                                            )}

                                            <span className="font-mono text-[10px] text-muted-foreground">#{index + 1}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => deleteMutation.mutate(c.id)}
                                            disabled={deleteMutation.isPending}
                                            className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 font-mono disabled:opacity-50"
                                        >
                                            <Trash2 className="size-3" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleAddConnection}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs"
                            >
                                <Plus className="size-4" />
                                <span>Add Connection</span>
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Available Models Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-foreground">
                            Available Models ({provider.models.length})
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Model LLM yang didukung oleh {provider.name} dan siap digunakan di Gateway.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Filter model ID…"
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            className="w-full rounded border border-border/60 bg-secondary/30 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                        />
                    </div>
                </div>

                {filteredModels.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-xs font-mono text-muted-foreground">
                        Tidak ada model yang sesuai dengan pencarian "{modelSearch}".
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredModels.map((m) => (
                            <div
                                key={m.id}
                                className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-card p-4 hover:border-foreground/30 transition-all hover:shadow-2xs"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Bot className="size-4 text-muted-foreground shrink-0" />
                                            <span className="font-mono text-xs font-semibold text-foreground truncate block flex-1" title={m.id}>
                                                {m.id}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => void handleCopy(m.id)}
                                            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-secondary shrink-0"
                                            title="Copy Model ID"
                                        >
                                            {copiedId === m.id ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 rounded border border-border/50 bg-secondary/30 px-2 py-0.5 font-mono text-[10px] text-foreground">
                                            <Sparkles className="size-3 text-amber-500" />
                                            Chat Completion
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded border border-border/50 bg-secondary/30 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                                            <Zap className="size-3 text-emerald-500" />
                                            Streaming
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                                    <span className="inline-flex items-center gap-1 text-emerald-500 font-mono text-[10px]">
                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                        <span>Active</span>
                                    </span>

                                    <Link
                                        to="/playground"
                                        search={{ model: m.id }}
                                        className="inline-flex items-center gap-1 rounded bg-secondary hover:bg-foreground hover:text-background px-2.5 py-1 text-xs font-semibold text-foreground transition-all border border-border/60"
                                    >
                                        <Play className="size-3" />
                                        <span>Test</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Connection Sheet */}
            <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
                <SheetContent side="right" className="sm:max-w-md w-full p-6 space-y-5 overflow-y-auto">
                    <SheetHeader className="p-0 border-b border-border/60 pb-3">
                        <SheetTitle className="text-base font-bold text-foreground">Add Connection for {provider.name}</SheetTitle>
                        <SheetDescription className="text-xs text-muted-foreground">
                            Simpan API Key / Access Token baru ke dalam database SQLite.
                        </SheetDescription>
                    </SheetHeader>

                    {formError && (
                        <div className="rounded border border-destructive/40 bg-destructive/10 p-2.5 text-xs font-mono text-destructive">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                        <div className="space-y-1">
                            <label htmlFor="conn-name" className="font-medium text-foreground block">
                                Connection Label / Account Name *
                            </label>
                            <input
                                id="conn-name"
                                type="text"
                                placeholder="e.g. Work Account, Primary API Key"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full rounded border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="conn-url" className="font-medium text-foreground block">
                                Custom Base Endpoint URL (Optional)
                            </label>
                            <input
                                id="conn-url"
                                type="text"
                                placeholder={provider.defaultBaseUrl || "https://api.openai.com/v1"}
                                value={formBaseUrl}
                                onChange={(e) => setFormBaseUrl(e.target.value)}
                                className="w-full rounded border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="conn-key" className="font-medium text-foreground block">
                                API Key / Access Token *
                            </label>
                            <input
                                id="conn-key"
                                type="password"
                                placeholder="sk-..."
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
                                className="rounded bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-xs font-bold disabled:opacity-50"
                            >
                                {addMutation.isPending ? "Saving…" : "Save Connection"}
                            </button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Connect OAuth Modal */}
            <ConnectOAuthModal
                provider={provider}
                open={isOAuthModalOpen}
                onOpenChange={setIsOAuthModalOpen}
            />
        </div>
    );
}
