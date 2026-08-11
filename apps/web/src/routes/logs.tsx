import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ScrollText, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { ListResponse, RequestLogEntry } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/logs")({
    staticData: { title: "Logs" },
    component: LogsPage,
});

function formatTime(ms: number): string {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(ms: number): string {
    return new Date(ms).toLocaleDateString();
}

function LogsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
    const [selectedLog, setSelectedLog] = useState<RequestLogEntry | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ["logs"],
        queryFn: () => api.get<ListResponse<RequestLogEntry>>("/v1/logs?limit=100"),
    });

    const logs: RequestLogEntry[] = data?.data ?? [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Gagal memuat log aktivitas: {error instanceof Error ? error.message : "Unknown error"}
            </div>
        );
    }

    const filteredLogs = logs.filter((log) => {
        const matchesQuery =
            log.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.providerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.id.toLowerCase().includes(searchQuery.toLowerCase());

        const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
        if (statusFilter === "success" && !isSuccess) return false;
        if (statusFilter === "error" && isSuccess) return false;

        return matchesQuery;
    });

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Request Audit Logs</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Riwayat 100 request API gateway terbaru beserta token usage & latency.
                </p>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by ID, Model, or Provider…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-secondary/30 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            statusFilter === "all"
                                ? "bg-foreground text-background font-semibold"
                                : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        All ({logs.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setStatusFilter("success")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            statusFilter === "success"
                                ? "bg-emerald-500 text-white shadow-2xs"
                                : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Success (2xx)
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter("error")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            statusFilter === "error"
                                ? "bg-rose-500 text-white shadow-2xs"
                                : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Errors (4xx/5xx)
                    </button>
                </div>
            </div>

            {filteredLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-secondary/10 p-12 text-center text-xs text-muted-foreground">
                    Tidak ada log request yang cocok dengan filter saat ini.
                </div>
            ) : (
                <div className="rounded-xl border border-border/80 bg-card shadow-2xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tokens</TableHead>
                                <TableHead>Latency</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead className="text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => {
                                const isOk = log.statusCode >= 200 && log.statusCode < 300;
                                return (
                                    <TableRow
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="cursor-pointer group"
                                    >
                                        <TableCell className="whitespace-nowrap">
                                            <div className="font-mono text-xs font-medium text-foreground">{formatTime(log.createdAt)}</div>
                                            <div className="text-[10px] text-muted-foreground">{formatDate(log.createdAt)}</div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {log.providerId}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                                            {log.model}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isOk ? "emerald" : "destructive"} className="font-mono text-[10px]">
                                                {isOk ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                                                {log.statusCode}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-foreground">
                                            {log.totalTokens.toLocaleString()}
                                            <span className="text-[10px] text-muted-foreground ml-1">
                                                ({log.promptTokens} in / {log.completionTokens} out)
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            <span className={log.latencyMs > 1000 ? "text-amber-500" : "text-emerald-500"}>
                                                {log.latencyMs}ms
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-emerald-500">
                                            {log.estimatedCost ? `$${log.estimatedCost.toFixed(4)}` : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLog(log);
                                                }}
                                                className="inline-flex size-6 items-center justify-center rounded-md border border-border/50 bg-secondary/20 group-hover:bg-accent group-hover:text-white transition-colors"
                                            >
                                                <ChevronRight className="size-3.5" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Log Detail Slide-Over Drawer */}
            <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <SheetContent side="right" className="sm:max-w-md w-full p-6 space-y-6 overflow-y-auto">
                    {selectedLog && (
                        <>
                            <SheetHeader className="p-0 border-b border-border/50 pb-4">
                                <SheetTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <ScrollText className="size-4 text-indigo-500" />
                                    Request Log Detail
                                </SheetTitle>
                                <SheetDescription className="font-mono text-xs text-muted-foreground truncate">
                                    ID: {selectedLog.id}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-secondary/20 p-3">
                                    <div>
                                        <span className="text-muted-foreground block text-[10px] font-medium uppercase">Status</span>
                                        <span className={`font-mono font-bold ${selectedLog.statusCode >= 200 && selectedLog.statusCode < 300 ? "text-emerald-500" : "text-rose-500"}`}>
                                            {selectedLog.statusCode} OK
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[10px] font-medium uppercase">Latency</span>
                                        <span className="font-mono font-bold text-foreground">{selectedLog.latencyMs} ms</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[10px] font-medium uppercase">Provider</span>
                                        <span className="font-mono text-foreground">{selectedLog.providerId}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[10px] font-medium uppercase">Model</span>
                                        <span className="font-mono text-foreground">{selectedLog.model}</span>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
                                    <span className="font-semibold text-foreground block">Token Usage Breakdown</span>
                                    <div className="flex justify-between border-b border-border/40 pb-1">
                                        <span className="text-muted-foreground">Prompt (Input) Tokens:</span>
                                        <span className="font-mono text-foreground font-medium">{selectedLog.promptTokens}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-border/40 pb-1">
                                        <span className="text-muted-foreground">Completion (Output) Tokens:</span>
                                        <span className="font-mono text-foreground font-medium">{selectedLog.completionTokens}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold pt-1">
                                        <span className="text-foreground">Total Tokens:</span>
                                        <span className="font-mono text-indigo-500">{selectedLog.totalTokens}</span>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
                                    <span className="font-semibold text-foreground block">Payload JSON Preview</span>
                                    <pre className="p-3 rounded-md bg-secondary/40 font-mono text-[11px] text-foreground overflow-x-auto">
                                        <code>{JSON.stringify(selectedLog, null, 2)}</code>
                                    </pre>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}


