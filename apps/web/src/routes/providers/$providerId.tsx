import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    AlertTriangle,
    ArrowLeft,
    Bot,
    Check,
    Copy,
    LayoutGrid,
    List,
    Lock,
    Plus,
    RotateCcw,
    Search,
    ShieldCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/components/ProviderIcon";
import { ConnectOAuthModal } from "@/components/ui/ConnectOAuthModal";
import { useProvider, type AddConnectionPayload } from "@/hooks/useProvider";
import { useCopy } from "@/hooks/useCopy";
import { ConnectionCard } from "@/components/providers/ConnectionCard";
import { ConnectionForm, type ConnectionFormInput } from "@/components/providers/ConnectionForm";
import { ProviderModelCard } from "@/components/providers/ProviderModelCard";
import { ProviderModelTable } from "@/components/providers/ProviderModelTable";
import { CATEGORY_LABELS } from "@srouter/constants";

export const Route = createFileRoute("/providers/$providerId")({
    component: ProviderDetailPage,
});

function ProviderDetailPage() {
    const { providerId } = Route.useParams();
    const {
        data: provider,
        isLoading,
        error,
        refetch,
        addMutation,
        deleteMutation,
    } = useProvider(providerId);

    const [modelSearch, setModelSearch] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [roundRobin, setRoundRobin] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
    const [formError, setFormError] = useState("");
    const { copied, copy } = useCopy();

    const storageKey = `srouter_deleted_models_${providerId}`;
    const [deletedModelIds, setDeletedModelIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const handleDeleteModel = (modelId: string) => {
        setDeletedModelIds((prev) => {
            const updated = prev.includes(modelId) ? prev : [...prev, modelId];
            try {
                localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch {}
            return updated;
        });
    };

    const handleRestoreAllModels = () => {
        setDeletedModelIds([]);
        try {
            localStorage.removeItem(storageKey);
        } catch {}
    };

    const handleAddConnection = () => {
        if (provider?.requiresOAuth) {
            setIsOAuthModalOpen(true);
        } else {
            setIsAddOpen(true);
        }
    };

    const handleAddSubmit = (input: ConnectionFormInput) => {
        if (!provider) return;

        const payload: AddConnectionPayload = {
            id: `${provider.id}-${Date.now()}`,
            name: input.name,
            category: provider.category,
            protocol: provider.protocol,
            baseUrl: input.baseUrl,
            apiKey: input.apiKey,
        };

        setFormError("");
        addMutation.mutate(payload, {
            onSuccess: () => {
                setIsAddOpen(false);
                setFormError("");
            },
            onError: (err: Error) => {
                setFormError(err.message || "Failed to add connection");
            },
        });
    };

    if (isLoading) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-6 font-mono">
                <Skeleton className="h-6 w-36 rounded-[6px]" />
                <Skeleton className="h-28 rounded-[12px]" />
                <Skeleton className="h-44 rounded-[12px]" />
                <Skeleton className="h-64 rounded-[12px]" />
            </div>
        );
    }

    if (error || !provider) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-4 font-mono">
                <Link
                    to="/providers"
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Providers Catalog</span>
                </Link>
                <div className="rounded-[12px] border border-rose-500/30 bg-rose-500/10 p-6 text-xs text-rose-500 space-y-2">
                    <p className="font-bold text-sm">Provider '{providerId}' not found.</p>
                    <p className="text-[var(--ink-3)]">
                        {error instanceof Error
                            ? error.message
                            : "Provider definition missing in gateway registry."}
                    </p>
                </div>
            </div>
        );
    }

    const connections = provider.connections ?? [];
    const activeConnectionsCount = connections.filter((c) => c.enabled).length;
    const activeModels = provider.models.filter((m) => !deletedModelIds.includes(m.id));
    const filteredModels = activeModels.filter((m) =>
        m.id.toLowerCase().includes(modelSearch.toLowerCase()),
    );

    const baseUrl = provider.defaultBaseUrl || "Default upstream gateway";

    return (
        <div className="mx-auto w-full max-w-6xl flex flex-col gap-6 font-mono">
            {/* Top Navigation Back Link */}
            <div>
                <Link
                    to="/providers"
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Providers Catalog</span>
                </Link>
            </div>

            {/* Editorial Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--line)] pb-5">
                <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-2xs">
                        <ProviderIcon providerId={provider.id} className="size-7" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
                                {provider.name}
                            </h1>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    activeConnectionsCount > 0
                                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border border-[var(--line)] bg-[var(--field)] text-[var(--ink-3)]"
                                }`}
                            >
                                <span
                                    className={`size-1.5 rounded-full ${
                                        activeConnectionsCount > 0
                                            ? "bg-emerald-500 animate-pulse"
                                            : "bg-[var(--ink-3)]"
                                    }`}
                                />
                                <span>
                                    {activeConnectionsCount > 0
                                        ? `${activeConnectionsCount} Connected`
                                        : "Not Connected"}
                                </span>
                            </span>
                        </div>
                        <p className="text-xs text-[var(--ink-3)]">
                            Driver ID: <span className="text-[var(--ink-2)]">{provider.id}</span> ·{" "}
                            {CATEGORY_LABELS[provider.category as keyof typeof CATEGORY_LABELS] ??
                                provider.category}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        type="button"
                        onClick={handleAddConnection}
                        className="h-8 text-xs bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 cursor-pointer shadow-xs transition-transform active:scale-[0.98]"
                    >
                        <Plus className="size-3.5 mr-1" />
                        <span>{provider.requiresOAuth ? "Connect Account" : "Add Key"}</span>
                    </Button>
                </div>
            </div>

            {/* Bento Metrics 4-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Active Credentials */}
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                        <span>Active Credentials</span>
                        <Lock className="size-3.5 text-[var(--ink-3)]" />
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold tabular-nums text-[var(--ink)]">
                            {activeConnectionsCount}
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-[var(--ink-3)] truncate">
                            {activeConnectionsCount > 0
                                ? "Routing active credentials"
                                : "No keys in database"}
                        </p>
                    </div>
                </div>

                {/* 2. Protocol */}
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                        <span>Protocol / Auth</span>
                        <ShieldCheck className="size-3.5 text-blue-500" />
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold text-[var(--ink)] capitalize">
                            {provider.protocol}
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-[var(--ink-3)] truncate">
                            {provider.requiresOAuth ? "OAuth 2.0 PKCE Session" : "Direct API Key"}
                        </p>
                    </div>
                </div>

                {/* 3. Models Count */}
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                        <span>Exposed Models</span>
                        <Bot className="size-3.5 text-amber-500" />
                    </div>
                    <div className="mt-2">
                        <div className="text-2xl font-bold tabular-nums text-[var(--ink)]">
                            {activeModels.length}
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-[var(--ink-3)] truncate">
                            {deletedModelIds.length > 0
                                ? `${deletedModelIds.length} hidden from list`
                                : "All upstream models active"}
                        </p>
                    </div>
                </div>

                {/* 4. Base URL */}
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                        <span>Endpoint URL</span>
                        <button
                            type="button"
                            onClick={() => void copy(baseUrl)}
                            className="text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                            title="Copy base URL"
                        >
                            {copied === baseUrl ? (
                                <Check className="size-3 text-emerald-500" />
                            ) : (
                                <Copy className="size-3" />
                            )}
                        </button>
                    </div>
                    <div className="mt-2 min-w-0">
                        <div
                            className="text-xs font-bold text-[var(--ink)] truncate"
                            title={baseUrl}
                        >
                            {baseUrl.replace(/^https?:\/\//, "")}
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-[var(--ink-3)] truncate">
                            Upstream provider host
                        </p>
                    </div>
                </div>
            </div>

            {/* Risk Notice Alert Banner if OAuth */}
            {provider.requiresOAuth && (
                <div className="flex items-start gap-3 rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                        <strong>OAuth Refresh Notice:</strong> SRouter manages token lifecycle and
                        background refresh sweeper automatically for this provider account.
                    </div>
                </div>
            )}

            {/* Credentials Card */}
            <ConnectionCard
                providerName={provider.name}
                connections={connections}
                roundRobin={roundRobin}
                isDeleting={deleteMutation.isPending}
                onToggleRoundRobin={() => setRoundRobin(!roundRobin)}
                onRefresh={() => void refetch()}
                onAdd={handleAddConnection}
                onDelete={(connectionId) => deleteMutation.mutate(connectionId)}
            />

            {/* Available Models Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                                Available Models ({activeModels.length})
                            </h2>
                            {deletedModelIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleRestoreAllModels}
                                    className="text-[10.5px] text-amber-500 hover:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    <RotateCcw className="size-3" />
                                    <span>Restore {deletedModelIds.length} deleted</span>
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-[var(--ink-3)] mt-0.5">
                            Models exposed by {provider.name} and routed through this gateway.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-60">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-[var(--ink-3)]" />
                            <input
                                type="search"
                                placeholder="Filter model ID…"
                                value={modelSearch}
                                onChange={(e) => setModelSearch(e.target.value)}
                                className="w-full rounded-[6px] border border-[var(--line)] bg-[var(--canvas)] pl-7 pr-3 py-1 text-xs text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none font-mono"
                            />
                        </div>

                        {/* View Mode Switcher (Table / Grid) */}
                        <div className="flex items-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode("table")}
                                className={`flex size-6 items-center justify-center rounded-[4px] transition-colors cursor-pointer ${
                                    viewMode === "table"
                                        ? "bg-[var(--field)] text-[var(--ink)] shadow-2xs font-semibold"
                                        : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                                }`}
                                title="Table view (Compact)"
                            >
                                <List className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={`flex size-6 items-center justify-center rounded-[4px] transition-colors cursor-pointer ${
                                    viewMode === "grid"
                                        ? "bg-[var(--field)] text-[var(--ink)] shadow-2xs font-semibold"
                                        : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                                }`}
                                title="Grid view (Cards)"
                            >
                                <LayoutGrid className="size-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {filteredModels.length === 0 ? (
                    <div className="rounded-[10px] border border-[var(--line)] p-12 text-center text-xs text-[var(--ink-3)] space-y-2">
                        <p>
                            {modelSearch
                                ? `No models matched your search query "${modelSearch}".`
                                : "No models currently available."}
                        </p>
                        {deletedModelIds.length > 0 && (
                            <button
                                type="button"
                                onClick={handleRestoreAllModels}
                                className="inline-flex items-center gap-1 text-xs text-amber-500 hover:underline cursor-pointer"
                            >
                                <RotateCcw className="size-3" />
                                <span>Restore all {deletedModelIds.length} models</span>
                            </button>
                        )}
                    </div>
                ) : viewMode === "table" ? (
                    <ProviderModelTable
                        models={filteredModels}
                        copied={copied}
                        onCopy={(id) => void copy(id)}
                        onDelete={handleDeleteModel}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredModels.map((m) => (
                            <ProviderModelCard
                                key={m.id}
                                model={m}
                                copied={copied === m.id}
                                onCopy={() => void copy(m.id)}
                                onDelete={handleDeleteModel}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Connection Sheet */}
            <ConnectionForm
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                providerName={provider.name}
                defaultBaseUrl={provider.defaultBaseUrl}
                isSaving={addMutation.isPending}
                error={formError}
                onSubmit={handleAddSubmit}
            />

            {/* Connect OAuth Modal */}
            <ConnectOAuthModal
                provider={provider}
                open={isOAuthModalOpen}
                onOpenChange={setIsOAuthModalOpen}
            />
        </div>
    );
}
