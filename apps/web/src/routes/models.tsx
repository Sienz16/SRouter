import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ModelListResponse, ModelObject } from "@srouter/types";

export const Route = createFileRoute("/models")({
    staticData: { title: "Models" },
    component: ModelsPage,
});

function ModelsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["models"],
        queryFn: () => api.get<ModelListResponse>("/v1/models"),
    });

    const models: ModelObject[] = data?.data ?? [];

    if (isLoading) {
        return <div className="text-muted">Loading models…</div>;
    }

    if (error || !data) {
        return (
            <div className="text-sm text-red-400">
                Gagal memuat models: {error instanceof Error ? error.message : "Unknown error"}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold">Models</h1>
                <p className="mt-1 text-sm text-muted">
                    {models.length} model tersedia dari semua provider.
                </p>
            </div>

            {models.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
                    Belum ada model terdaftar.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead className="bg-surface-2 text-left text-muted">
                            <tr>
                                <th className="px-4 py-2 font-medium">Model</th>
                                <th className="px-4 py-2 font-medium">Owned By</th>
                                <th className="px-4 py-2 font-medium">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {models.map((m) => (
                                <tr key={m.id}>
                                    <td className="px-4 py-2 font-mono text-xs">{m.id}</td>
                                    <td className="px-4 py-2">{m.owned_by}</td>
                                    <td className="px-4 py-2 text-muted">
                                        {m.created ? new Date(m.created * 1000).toLocaleDateString() : "—"}
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
