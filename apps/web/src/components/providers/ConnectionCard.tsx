import { Key, Lock, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import type { ProviderConfig } from "@srouter/types";

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
    onDelete,
}: ConnectionCardProps) {
    return (
        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-4 font-mono shadow-2xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                        Active Credentials ({connections.length})
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--field)] hover:bg-[var(--hover)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)] transition-colors cursor-pointer"
                    >
                        <RefreshCw className="size-3 text-[var(--ink-3)]" />
                        <span>Test Connection</span>
                    </button>

                    <div className="flex items-center gap-2 text-[11px] text-[var(--ink-3)]">
                        <span>Round Robin</span>
                        <button
                            type="button"
                            onClick={onToggleRoundRobin}
                            className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-[var(--line)] transition-colors duration-200 ease-in-out ${
                                roundRobin ? "bg-emerald-500" : "bg-[var(--field)]"
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block size-3.5 transform rounded-full bg-[var(--canvas)] shadow-xs transition duration-200 ease-in-out ${
                                    roundRobin ? "translate-x-3.5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {connections.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[var(--line)] p-8 text-center space-y-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-[var(--field)] mx-auto text-[var(--ink-3)]">
                        <Key className="size-4" />
                    </div>
                    <p className="text-xs text-[var(--ink-3)] max-w-sm mx-auto leading-relaxed">
                        No credentials connected for{" "}
                        <span className="text-[var(--ink)] font-semibold">{providerName}</span>. Add
                        an API key or OAuth session to enable live routing.
                    </p>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--ink)] text-[var(--canvas)] px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-transform active:scale-[0.98] shadow-xs cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        <span>Add Connection</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-2">
                        {connections.map((connection, index) => (
                            <div
                                key={connection.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[8px] border border-[var(--line)] bg-[var(--field)]/40 p-3 hover:border-[var(--line-strong)] transition-all text-xs"
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <Lock className="size-3.5 text-[var(--ink-3)] shrink-0" />
                                    <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                        <span className="font-bold text-[var(--ink)] truncate">
                                            {connection.name}
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.2 text-[9.5px] font-semibold ${
                                                connection.enabled
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                                    : "bg-[var(--field)] text-[var(--ink-3)]"
                                            }`}
                                        >
                                            <span
                                                className={`size-1 rounded-full ${
                                                    connection.enabled
                                                        ? "bg-emerald-500"
                                                        : "bg-[var(--ink-3)]"
                                                }`}
                                            />
                                            <span>
                                                {connection.enabled ? "Active" : "Disabled"}
                                            </span>
                                        </span>

                                        {connection.apiKey && (
                                            <span className="rounded-[4px] border border-[var(--line)] bg-[var(--field)] px-1.5 py-0.2 text-[9.5px] text-[var(--ink-3)]">
                                                Key: {connection.apiKey.slice(0, 4)}••••
                                                {connection.apiKey.slice(-4)}
                                            </span>
                                        )}

                                        <span className="text-[9.5px] text-[var(--ink-3)]">
                                            #{index + 1}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => onDelete(connection.id)}
                                        disabled={isDeleting}
                                        className="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-400 disabled:opacity-50 cursor-pointer transition-colors"
                                    >
                                        <Trash2 className="size-3" />
                                        <span>Remove</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={onAdd}
                            className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--ink)] text-[var(--canvas)] px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-transform active:scale-[0.98] shadow-xs cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Add Connection</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
