import type { UsageStats } from "@srouter/types";

type ModelUsageOverviewProps = {
    models: UsageStats["byModel"];
};

export function ModelUsageOverview({ models }: ModelUsageOverviewProps) {
    const topModels = [...models]
        .sort(
            (a, b) =>
                b.totalInputTokens +
                b.totalOutputTokens -
                (a.totalInputTokens + a.totalOutputTokens),
        )
        .slice(0, 5);
    const maxTokens = Math.max(
        ...topModels.map((model) => model.totalInputTokens + model.totalOutputTokens),
        0,
    );

    return (
        <section className="min-w-0 py-5 pr-0 lg:pr-6" aria-labelledby="model-usage-title">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between pb-2 border-b border-border/40">
                <div>
                    <h2 id="model-usage-title" className="text-sm font-semibold text-foreground">
                        Model traffic
                    </h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Highest token volume in the current dataset
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                    <span className="w-14 text-right">Requests</span>
                    <span className="w-20 text-right">Input</span>
                    <span className="w-20 text-right">Output</span>
                    <span className="w-22 text-right">Total</span>
                </div>
            </header>

            {topModels.length === 0 ? (
                <div className="mt-5 border-l-2 border-border pl-3">
                    <p className="text-xs font-medium text-foreground">No model traffic recorded</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Usage will appear after the gateway handles its first request.
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-3.5" aria-label="Top models by token volume">
                    {topModels.map((model) => {
                        const totalTokens = model.totalInputTokens + model.totalOutputTokens;
                        const width =
                            maxTokens > 0 ? Math.max((totalTokens / maxTokens) * 100, 1) : 0;
                        const breakdown = `${model.totalInputTokens.toLocaleString()} input, ${model.totalOutputTokens.toLocaleString()} output${model.totalCachedTokens ? `, ${model.totalCachedTokens.toLocaleString()} cached` : ""}`;

                        return (
                            <div
                                key={model.model}
                                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1.5"
                            >
                                <p
                                    className="truncate font-mono text-[11px] font-medium text-foreground"
                                    title={model.model}
                                >
                                    {model.model}
                                </p>
                                <div className="flex items-center gap-3 font-mono tabular-nums text-[10.5px]">
                                    {/* Requests */}
                                    <span className="w-14 text-right text-[10px] text-muted-foreground">
                                        {model.totalRequests.toLocaleString()} req
                                    </span>

                                    {/* Input Tokens */}
                                    <span
                                        className="w-20 text-right text-muted-foreground"
                                        title="Input / Prompt Tokens"
                                    >
                                        ↓{" "}
                                        <strong className="font-semibold text-foreground">
                                            {model.totalInputTokens.toLocaleString()}
                                        </strong>{" "}
                                        in
                                    </span>

                                    {/* Output Tokens */}
                                    <span
                                        className="w-20 text-right text-muted-foreground"
                                        title="Output / Completion Tokens"
                                    >
                                        ↑{" "}
                                        <strong className="font-semibold text-foreground">
                                            {model.totalOutputTokens.toLocaleString()}
                                        </strong>{" "}
                                        out
                                    </span>

                                    {/* Total Tokens */}
                                    <span
                                        className="w-22 text-right text-[11px] font-semibold text-foreground"
                                        title="Total Tokens"
                                    >
                                        {totalTokens.toLocaleString()}{" "}
                                        <span className="text-[9.5px] font-normal text-muted-foreground">
                                            tok
                                        </span>
                                    </span>
                                </div>
                                <div
                                    role="img"
                                    aria-label={`${model.model}: ${totalTokens.toLocaleString()} total tokens. ${breakdown}`}
                                    title={breakdown}
                                    className="col-span-2 h-[2px] w-full rounded-full bg-border/60 overflow-hidden"
                                >
                                    <div className="flex h-full" style={{ width: `${width}%` }}>
                                        <span
                                            className="h-full bg-foreground/60"
                                            style={{
                                                width: `${(model.totalInputTokens / (totalTokens || 1)) * 100}%`,
                                            }}
                                            title={`Input: ${model.totalInputTokens.toLocaleString()}`}
                                        />
                                        <span
                                            className="h-full bg-foreground"
                                            style={{
                                                width: `${(model.totalOutputTokens / (totalTokens || 1)) * 100}%`,
                                            }}
                                            title={`Output: ${model.totalOutputTokens.toLocaleString()}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
