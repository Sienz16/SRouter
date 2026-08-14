import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, ExternalLink, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ProviderIcon } from "@/components/ProviderIcon";
import { ConnectOAuthModal } from "@/components/ui/ConnectOAuthModal";
import { useProvider, type AddConnectionPayload } from "@/hooks/useProvider";
import { useCopy } from "@/hooks/useCopy";
import { ConnectionCard } from "@/components/providers/ConnectionCard";
import { ConnectionForm, type ConnectionFormInput } from "@/components/providers/ConnectionForm";
import { ProviderModelCard } from "@/components/providers/ProviderModelCard";

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
    const [roundRobin, setRoundRobin] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
    const [formError, setFormError] = useState("");
    const { copied, copy } = useCopy();

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
                <Skeleton className="h-32 rounded-[12px]" />
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
    const filteredModels = provider.models.filter((m) =>
        m.id.toLowerCase().includes(modelSearch.toLowerCase()),
    );

    return (
        <div className="mx-auto w-full max-w-6xl flex flex-col gap-6 font-mono">
            {/* Back Navigation */}
            <div>
                <Link
                    to="/providers"
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Providers Catalog</span>
                </Link>
            </div>

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--line)] pb-5">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-2xs">
                        <ProviderIcon
                            providerId={provider.id}
                            className="size-6 text-[var(--ink)]"
                        />
                    </div>
                    <div>
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
                                    className={`size-1 rounded-full ${
                                        activeConnectionsCount > 0
                                            ? "bg-emerald-500 animate-pulse"
                                            : "bg-[var(--ink-3)]"
                                    }`}
                                />
                                {activeConnectionsCount > 0 ? "Connected" : "No Active Connections"}
                            </span>
                        </div>
                        <p className="text-xs text-[var(--ink-3)] mt-0.5">
                            {activeConnectionsCount} active{" "}
                            {activeConnectionsCount === 1 ? "credential" : "credentials"} stored in
                            database
                        </p>
                    </div>
                </div>

                <a
                    href="https://antigravity.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 transition-colors"
                >
                    <ExternalLink className="size-3.5" />
                    <span>Documentation & Docs</span>
                </a>
            </div>

            {/* Risk Notice Alert Banner if OAuth */}
            {provider.requiresOAuth && (
                <div className="flex items-start gap-3 rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                        <strong>Session Notice:</strong> This driver uses OAuth session tokens.
                        SRouter automatically manages token refreshing in the background.
                    </div>
                </div>
            )}

            {/* Real Connections Card loaded from SQLite DB */}
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
                        <h2 className="text-sm font-bold tracking-tight text-[var(--ink)]">
                            Available Models ({provider.models.length})
                        </h2>
                        <p className="text-xs text-[var(--ink-3)] mt-0.5">
                            Models exposed by {provider.name} and routed through this gateway.
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-[var(--ink-3)]" />
                        <input
                            type="text"
                            placeholder="Filter model ID…"
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            className="w-full rounded-[6px] border border-[var(--line)] bg-[var(--canvas)] pl-7 pr-3 py-1 text-xs text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none font-mono"
                        />
                    </div>
                </div>

                {filteredModels.length === 0 ? (
                    <div className="rounded-[10px] border border-[var(--line)] p-12 text-center text-xs text-[var(--ink-3)]">
                        No models matched your search query "{modelSearch}".
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredModels.map((m) => (
                            <ProviderModelCard
                                key={m.id}
                                model={m}
                                copied={copied === m.id}
                                onCopy={() => void copy(m.id)}
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
