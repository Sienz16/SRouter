import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Coins, Gauge, Timer } from "lucide-react";
import { api } from "@/lib/api";
import type { UsageStats } from "@/lib/types";
import { NetworkStatus } from "@/components/dashboard/network-status";

export const Route = createFileRoute("/")({
    staticData: { title: "Dashboard" },
    component: DashboardPage,
});

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
    return (
        <div className="flex items-start justify-between rounded-lg border border-border bg-surface p-4">
            <div>
                <div className="text-sm text-muted">{label}</div>
                <div className="mt-1 text-2xl font-semibold">{value}</div>
                {sub ? <div className="mt-1 text-xs text-muted">{sub}</div> : null}
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/10">
                <Icon className="size-4.5 text-accent" strokeWidth={1.75} />
            </div>
        </div>
    );
}

function DashboardPage() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["stats"],
        queryFn: () => api.get<UsageStats>("/v1/logs/stats"),
    });

    if (isLoading) {
        return <div className="text-muted">Loading stats…</div>;
    }

    if (error || !stats) {
        return (
            <div className="text-sm text-red-400">
                Gagal memuat statistik: {error instanceof Error ? error.message : "Unknown error"}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="mt-1 text-sm text-muted">
                    Ringkasan penggunaan gateway SRouter.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Requests"
                    value={stats.totalRequests.toLocaleString()}
                    icon={Activity}
                />
                <StatCard
                    label="Total Tokens"
                    value={stats.totalTokens.toLocaleString()}
                    icon={Coins}
                />
                <StatCard
                    label="Total Cost"
                    value={stats.costLabel}
                    sub={stats.estimated ? "estimated" : undefined}
                    icon={Gauge}
                />
                <StatCard
                    label="Avg Latency"
                    value="—"
                    sub="per request"
                    icon={Timer}
                />
            </div>

            <NetworkStatus />

            <div>
                <h2 className="mb-3 text-lg font-semibold">Usage by Model</h2>
                {stats.byModel.length === 0 ? (
                    <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                        Belum ada data penggunaan.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-surface-2 text-left text-muted">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Model</th>
                                    <th className="px-4 py-2 font-medium">Requests</th>
                                    <th className="px-4 py-2 font-medium">Input Tokens</th>
                                    <th className="px-4 py-2 font-medium">Output Tokens</th>
                                    <th className="px-4 py-2 font-medium">Est. Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {stats.byModel.map((m) => (
                                    <tr key={m.model}>
                                        <td className="px-4 py-2 font-mono text-xs">{m.model}</td>
                                        <td className="px-4 py-2">{m.totalRequests}</td>
                                        <td className="px-4 py-2">{m.totalInputTokens.toLocaleString()}</td>
                                        <td className="px-4 py-2">{m.totalOutputTokens.toLocaleString()}</td>
                                        <td className="px-4 py-2">${m.estCost.toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
