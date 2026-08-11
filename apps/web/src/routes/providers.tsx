import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProviderDefinition } from "@srouter/types";

export const Route = createFileRoute("/providers")({
    staticData: { title: "Providers" },
    component: ProvidersPage,
});

interface CatalogSummary {
    total: number;
    categories: {
        custom: ProviderDefinition[];
        oauth: ProviderDefinition[];
        free_tier: ProviderDefinition[];
        api_key: ProviderDefinition[];
    };
}

const categoryLabels: Record<string, string> = {
    custom: "Custom",
    oauth: "OAuth",
    free_tier: "Free Tier",
    api_key: "API Key",
};

function ProviderCard({ p }: { p: ProviderDefinition }) {
    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {p.icon ? <span className="text-lg">{p.icon}</span> : null}
                    <span className="font-medium">{p.name}</span>
                </div>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status.state === "connected"
                            ? "bg-green-500/15 text-green-400"
                            : p.status.state === "ready"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-gray-500/15 text-gray-400"
                    }`}
                >
                    {p.status.state}
                </span>
            </div>
            <p className="line-clamp-2 text-xs text-muted">{p.description ?? "No description"}</p>
            <div className="mt-auto flex items-center justify-between text-xs text-muted">
                <span className="font-mono">{p.protocol}</span>
                <span>{p.models.length} models</span>
            </div>
        </div>
    );
}

function ProvidersPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["providers", "catalog"],
        queryFn: () => api.get<CatalogSummary>("/v1/providers/catalog"),
    });

    if (isLoading) {
        return <div className="text-muted">Loading providers…</div>;
    }

    if (error || !data) {
        return (
            <div className="text-sm text-red-400">
                Gagal memuat providers: {error instanceof Error ? error.message : "Unknown error"}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Providers</h1>
                <p className="mt-1 text-sm text-muted">
                    {data.total} providers terdaftar di gateway.
                </p>
            </div>

            {(["custom", "oauth", "free_tier", "api_key"] as const).map((cat) => (
                <section key={cat}>
                    <h2 className="mb-3 text-lg font-semibold">
                        {categoryLabels[cat]}
                        <span className="ml-2 text-sm text-muted">({data.categories[cat].length})</span>
                    </h2>
                    {data.categories[cat].length === 0 ? (
                        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                            Tidak ada provider di kategori ini.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {data.categories[cat].map((p) => (
                                <ProviderCard key={p.id} p={p} />
                            ))}
                        </div>
                    )}
                </section>
            ))}
        </div>
    );
}
