import { KeyRound, Zap } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

type KeyMetricsProps = {
    totalKeys: number;
    activeKeys: number;
    totalUsageTokens: number;
};

export function KeyMetrics({ totalKeys, activeKeys, totalUsageTokens }: KeyMetricsProps) {
    return (
        <section
            aria-label="API Keys Summary"
            className="grid grid-cols-1 border-y border-border/70 sm:grid-cols-2 [&>*+*]:border-t sm:[&>*+*]:border-t-0 sm:[&>*+*]:border-l sm:[&>*+*]:border-border/70"
        >
            {/* 1. Active Keys */}
            <article className="relative min-w-0 p-4 sm:p-5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <KeyRound className="size-3.5" strokeWidth={1.75} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                        Active Keys
                    </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        {activeKeys}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                        / {totalKeys} total
                    </span>
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    Authorized virtual bearer tokens
                </p>
            </article>

            {/* 2. Token Throughput */}
            <article className="relative min-w-0 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Zap className="size-3.5 text-amber-500" strokeWidth={1.75} />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                            Throughput
                        </span>
                    </div>
                </div>
                <div
                    className="mt-3 flex items-baseline gap-1.5 cursor-default"
                    title={`Total Token Volume: ${totalUsageTokens.toLocaleString()} tokens`}
                >
                    <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        {formatCompactNumber(totalUsageTokens)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">tok</span>
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    Cumulative tokens routed via keys
                </p>
            </article>
        </section>
    );
}
