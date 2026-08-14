import { Link } from "@tanstack/react-router";
import { Bot, Check, Copy, Play, Trash2 } from "lucide-react";
import type { ModelObject } from "@srouter/types";

interface ProviderModelCardProps {
    model: ModelObject;
    copied: boolean;
    onCopy: (modelId: string) => void;
    onDelete?: (modelId: string) => void;
}

export function ProviderModelCard({ model, copied, onCopy, onDelete }: ProviderModelCardProps) {
    return (
        <div className="group flex flex-col justify-between gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-3.5 hover:border-[var(--line-strong)] transition-all duration-150 shadow-2xs font-mono">
            {/* Header: Icon + Model ID + Actions */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-[4px] bg-[var(--field)] text-[var(--ink-2)]">
                        <Bot className="size-3.5" />
                    </div>
                    <span
                        className="text-xs font-bold text-[var(--ink)] truncate block flex-1"
                        title={model.id}
                    >
                        {model.id}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => onCopy(model.id)}
                        className="text-[var(--ink-3)] hover:text-[var(--ink)] p-1 rounded hover:bg-[var(--field)] transition-colors cursor-pointer"
                        title="Copy Model ID"
                    >
                        {copied ? (
                            <Check className="size-3 text-emerald-500" />
                        ) : (
                            <Copy className="size-3" />
                        )}
                    </button>
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(model.id)}
                            className="text-[var(--ink-3)] hover:text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-colors cursor-pointer"
                            title="Delete model"
                        >
                            <Trash2 className="size-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="pt-2.5 border-t border-[var(--line)] flex items-center justify-between text-[10.5px]">
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Active</span>
                </span>

                <Link
                    to="/playground"
                    search={{ model: model.id }}
                    className="inline-flex items-center gap-1 rounded-[4px] bg-[var(--field)] hover:bg-[var(--ink)] hover:text-[var(--canvas)] px-2 py-0.5 font-semibold text-[var(--ink)] transition-colors border border-[var(--line)] cursor-pointer"
                >
                    <Play className="size-2.5" />
                    <span>Test</span>
                </Link>
            </div>
        </div>
    );
}
