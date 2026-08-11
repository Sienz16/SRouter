import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListResponse, RequestLogEntry } from "@/lib/types";

export const Route = createFileRoute("/logs")({
    staticData: { title: "Logs" },
    component: LogsPage,
});

function formatTime(ms: number): string {
    return new Date(ms).toLocaleString();
}

function LogsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["logs"],
        queryFn: () => api.get<ListResponse<RequestLogEntry>>("/v1/logs?limit=100"),
    });

    const logs: RequestLogEntry[] = data?.data ?? [];

    if (isLoading) {
        return <div className="text-muted">Loading logs…</div>;
    }

    if (error || !data) {
        return (
            <div className="text-sm text-red-400">
                Gagal memuat logs: {error instanceof Error ? error.message : "Unknown error"}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Logs</h1>
                <p className="mt-1 text-sm text-muted">
                    {logs.length} request terbaru.
                </p>
            </div>

            {logs.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                    Belum ada request yang tercatat.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-surface-2 text-left text-muted">
                            <tr>
                                <th className="px-4 py-2 font-medium">Time</th>
                                <th className="px-4 py-2 font-medium">Provider</th>
                                <th className="px-4 py-2 font-medium">Model</th>
                                <th className="px-4 py-2 font-medium">Status</th>
                                <th className="px-4 py-2 font-medium">Tokens</th>
                                <th className="px-4 py-2 font-medium">Latency</th>
                                <th className="px-4 py-2 font-medium">Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-4 py-2 text-muted">{formatTime(log.createdAt)}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{log.providerId}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{log.model}</td>
                                    <td className="px-4 py-2">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                log.statusCode >= 200 && log.statusCode < 300
                                                    ? "bg-green-500/15 text-green-400"
                                                    : "bg-red-500/15 text-red-400"
                                            }`}
                                        >
                                            {log.statusCode}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">{log.totalTokens.toLocaleString()}</td>
                                    <td className="px-4 py-2">{log.latencyMs}ms</td>
                                    <td className="px-4 py-2">
                                        {log.estimatedCost ? `$${log.estimatedCost.toFixed(4)}` : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
