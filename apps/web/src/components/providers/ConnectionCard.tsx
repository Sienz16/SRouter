import { Key, Lock, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { ProviderConfig } from "@srouter/types";
import { Button } from "@/components/ui/button";

interface ConnectionCardProps {
    providerName: string;
    connections: ProviderConfig[];
    roundRobin: boolean;
    isDeleting: boolean;
    onToggleRoundRobin: () => void;
    onRefresh: () => void;
    onAdd: () => void;
    onDelete: (connectionId: string) => void;
}

export function ConnectionCard({
    providerName,
    connections,
    roundRobin,
    isDeleting,
    onToggleRoundRobin,
    onRefresh,
    onAdd,
    onDelete
}: ConnectionCardProps) {
    return (
        <div className="rounded-xl border border-border/70 bg-card p-5 space-y-4 font-mono shadow-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Active Credentials ({connections.length})
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        className="h-7.5 text-xs cursor-pointer gap-1.5"
                    >
                        <RefreshCw className="size-3 text-muted-foreground" />
                        <span>Test Connection</span>
                    </Button>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Round Robin</span>
                        <button
                            type="button"
                            onClick={onToggleRoundRobin}
                            className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-border transition-colors duration-200 ease-in-out ${
                                roundRobin ? "bg-emerald-500" : "bg-secondary"
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-background shadow-xs transition duration-200 ease-in-out ${
                                    roundRobin ? "translate-x-3.5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {connections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-background/50 p-8 text-center space-y-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-secondary mx-auto text-muted-foreground">
                        <Key className="size-4" strokeWidth={1.75} />
                    </div>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        No credentials connected for{" "}
                        <span className="text-foreground font-semibold">{providerName}</span>. Add
                        an API key or OAuth session to enable live routing.
                    </p>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onAdd}
                        className="h-8 text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
                    >
                        <Plus className="size-3.5" />
                        <span>Add Connection</span>
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-2">
                        {connections.map((connection, index) => (
                            <div
                                key={connection.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3 hover:border-border transition-all text-xs"
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <Lock className="size-3.5 text-muted-foreground shrink-0" />
                                    <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                        <span className="font-semibold text-foreground truncate">
                                            {connection.name}
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${
                                                connection.enabled
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                                    : "bg-secondary text-muted-foreground"
                                            }`}
                                        >
                                            <span
                                                className={`size-1 rounded-full ${
                                                    connection.enabled
                                                        ? "bg-emerald-500"
                                                        : "bg-muted-foreground"
                                                }`}
                                            />
                                            <span>
                                                {connection.enabled ? "Active" : "Disabled"}
                                            </span>
                                        </span>

                                        {connection.apiKey && (
                                            <code className="rounded border border-border/60 bg-background px-1.5 py-0.2 text-[10px] text-muted-foreground">
                                                Key: {connection.apiKey.slice(0, 4)}••••
                                                {connection.apiKey.slice(-4)}
                                            </code>
                                        )}

                                        <span className="text-[10px] text-muted-foreground">
                                            #{index + 1}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => onDelete(connection.id)}
                                        disabled={isDeleting}
                                        className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 disabled:opacity-50 cursor-pointer transition-colors"
                                    >
                                        <Trash2 className="size-3" />
                                        <span>Remove</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={onAdd}
                            className="h-8 text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
                        >
                            <Plus className="size-3.5" />
                            <span>Add Connection</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
