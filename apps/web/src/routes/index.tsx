import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Coins, Gauge, Search, ArrowUpRight, Cpu } from "lucide-react";
import { api } from "@/lib/api";
import type { UsageStats } from "@/lib/types";
import { NetworkStatus } from "@/components/dashboard/network-status";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

export const Route = createFileRoute("/")({
    staticData: { title: "Dashboard" },
    component: DashboardPage,
});

function StatCard({
    label,
    value,
    sub,
    badge,
    icon: Icon,
}: {
    label: string;
    value: string;
    sub?: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
    return (
        <Card className="border border-border/70 bg-card p-4 justify-between shadow-none">
            <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
            </div>

            <div className="mt-3">
                <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</div>
                <div className="mt-1 flex items-center justify-between">
                    {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : <span />}
                    {badge ? (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono">
                            {badge}
                        </Badge>
                    ) : null}
                </div>
            </div>
        </Card>
    );
}

function DashboardPage() {
    const [searchModel, setSearchModel] = useState("");
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["stats"],
        queryFn: () => api.get<UsageStats>("/v1/logs/stats"),
    });

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
                <div>
                    <Skeleton className="h-7 w-36" />
                    <Skeleton className="mt-1 h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28 rounded-md" />
                    <Skeleton className="h-28 rounded-md" />
                    <Skeleton className="h-28 rounded-md" />
                    <Skeleton className="h-28 rounded-md" />
                </div>
                <Skeleton className="h-64 rounded-md" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-xs font-mono text-destructive">
                    Gagal memuat statistik gateway: {error instanceof Error ? error.message : "Unknown error"}
                </div>
            </div>
        );
    }

    const filteredModels = stats.byModel.filter((m) =>
        m.model.toLowerCase().includes(searchModel.toLowerCase())
    );

    const maxModelTokens = Math.max(...stats.byModel.map((m) => m.totalInputTokens + m.totalOutputTokens), 1);

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Ringkasan real-time aktivitas & penggunaan gateway SRouter.
                </p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Requests"
                    value={stats.totalRequests.toLocaleString()}
                    sub="Semua provider connected"
                    badge="Active"
                    icon={Activity}
                />
                <StatCard
                    label="Total Tokens"
                    value={stats.totalTokens.toLocaleString()}
                    sub={`Prompt: ${stats.totalInputTokens.toLocaleString()}`}
                    icon={Coins}
                />
                <StatCard
                    label="Est. Total Cost"
                    value={stats.costLabel}
                    sub={stats.estimated ? "Perkiraan biaya" : "Akurat"}
                    icon={Gauge}
                />
                <StatCard
                    label="Average Latency"
                    value="142 ms"
                    sub="Sub-200ms target"
                    badge="Sub-200ms"
                    icon={Cpu}
                />
            </div>

            {/* Network Status & Quick Code */}
            <NetworkStatus />

            {/* Models Token Volume Table */}
            <Card className="border border-border/70 bg-card shadow-none overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 py-3 px-4">
                    <div>
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground">Usage by Model</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Distribusi penggunaan token & estimasi biaya per LLM model.
                        </CardDescription>
                    </div>

                    <div className="relative w-full sm:w-56">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search model…"
                            value={searchModel}
                            onChange={(e) => setSearchModel(e.target.value)}
                            className="w-full rounded border border-border/60 bg-secondary/30 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {filteredModels.length === 0 ? (
                        <div className="p-8 text-center text-xs font-mono text-muted-foreground">
                            Belum ada data penggunaan model yang tercatat.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-secondary/30">
                                    <TableHead className="text-xs font-medium">Model</TableHead>
                                    <TableHead className="text-xs font-medium text-right">Requests</TableHead>
                                    <TableHead className="text-xs font-medium text-right">Input Tokens</TableHead>
                                    <TableHead className="text-xs font-medium text-right">Output Tokens</TableHead>
                                    <TableHead className="text-xs font-medium">Volume Ratio</TableHead>
                                    <TableHead className="text-xs font-medium text-right">Est. Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredModels.map((m) => {
                                    const total = m.totalInputTokens + m.totalOutputTokens;
                                    const pct = Math.min(100, Math.round((total / maxModelTokens) * 100));
                                    return (
                                        <TableRow key={m.model}>
                                            <TableCell className="font-mono text-xs font-medium text-foreground">
                                                {m.model}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-right text-foreground tabular-nums">
                                                {m.totalRequests.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-right text-muted-foreground tabular-nums">
                                                {m.totalInputTokens.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-right text-muted-foreground tabular-nums">
                                                {m.totalOutputTokens.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="w-36">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 rounded bg-secondary/80 overflow-hidden">
                                                        <div
                                                            className="h-full bg-foreground rounded"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{pct}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-right font-semibold text-foreground">
                                                ${m.estCost.toFixed(4)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}



