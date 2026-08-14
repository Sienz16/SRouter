import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { DBAPIKey } from "@srouter/types";

export function useKeys() {
    const [keys, setKeys] = useState<DBAPIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<DBAPIKey | null>(null);

    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch("/v1/keys");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = (await res.json()) as { data: DBAPIKey[] };
            setKeys(json.data ?? []);
        } catch (err) {
            console.error("Failed to fetch API keys:", err);
            toast.error("Failed to load API keys");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchKeys();
    }, [fetchKeys]);

    const createKey = useCallback(
        async (data: { name: string; rateLimit?: number; quotaLimit?: number }) => {
            if (!data.name.trim()) {
                toast.error("Key name is required");
                return null;
            }

            setCreating(true);
            try {
                const res = await fetch("/v1/keys", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => null);
                    throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
                }

                const created = (await res.json()) as DBAPIKey;
                setKeys((prev) => [created, ...prev]);
                setNewlyCreatedKey(created);
                toast.success(`API Key "${created.name}" created successfully`);
                return created;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to create API key";
                toast.error(msg);
                return null;
            } finally {
                setCreating(false);
            }
        },
        [],
    );

    const deleteKey = useCallback(async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/v1/keys/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
            }

            setKeys((prev) => prev.filter((k) => k.id !== id));
            toast.success("API Key revoked and deleted");
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to delete API key";
            toast.error(msg);
            return false;
        } finally {
            setDeletingId(null);
        }
    }, []);

    return {
        keys,
        loading,
        creating,
        deletingId,
        newlyCreatedKey,
        setNewlyCreatedKey,
        fetchKeys,
        createKey,
        deleteKey,
    };
}
