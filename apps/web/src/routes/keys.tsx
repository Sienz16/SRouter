import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
    AlertTriangle,
    Check,
    Code2,
    Copy,
    Database,
    KeyRound,
    Plus,
    Search,
    Shield,
    Trash2,
    Zap,
} from "lucide-react";
import { useKeys } from "@/hooks/useKeys";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DBAPIKey } from "@srouter/types";

export const Route = createFileRoute("/keys")({
    staticData: { title: "API Keys" },
    component: KeysPage,
});

function maskKey(key: string): string {
    if (key.length <= 12) return key;
    return `${key.slice(0, 10)}••••••••${key.slice(-4)}`;
}

function KeysPage() {
    const {
        keys,
        loading,
        creating,
        deletingId,
        newlyCreatedKey,
        setNewlyCreatedKey,
        createKey,
        deleteKey,
    } = useKeys();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState("");
    const [rateLimit, setRateLimit] = useState("");
    const [quotaLimit, setQuotaLimit] = useState("");
    const [search, setSearch] = useState("");
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [copiedFullKey, setCopiedFullKey] = useState(false);
    const [integrationTab, setIntegrationTab] = useState<"curl" | "typescript" | "python">("curl");
    const [keyToDelete, setKeyToDelete] = useState<DBAPIKey | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const res = await createKey({
            name: name.trim(),
            rateLimit: rateLimit ? parseInt(rateLimit, 10) : undefined,
            quotaLimit: quotaLimit ? parseInt(quotaLimit, 10) : undefined,
        });

        if (res) {
            setName("");
            setRateLimit("");
            setQuotaLimit("");
            setIsCreateOpen(false);
        }
    };

    const handleCopy = async (text: string, id?: string) => {
        try {
            await navigator.clipboard.writeText(text);
            if (id) {
                setCopiedKeyId(id);
                setTimeout(() => setCopiedKeyId(null), 2000);
            } else {
                setCopiedFullKey(true);
                setTimeout(() => setCopiedFullKey(false), 2000);
            }
        } catch {
            // fallback
        }
    };

    const filteredKeys = keys.filter(
        (k) =>
            k.name.toLowerCase().includes(search.toLowerCase()) ||
            k.id.toLowerCase().includes(search.toLowerCase()) ||
            k.key.toLowerCase().includes(search.toLowerCase()),
    );

    const totalUsage = keys.reduce((acc, k) => acc + (k.usageTokens || 0), 0);
    const activeKeysCount = keys.filter((k) => k.enabled).length;

    const apiBase =
        typeof window !== "undefined" ? `${window.location.origin}/v1` : "http://localhost:3000/v1";

    const snippetKey = newlyCreatedKey?.key || (keys[0]?.key ?? "sr-live-YOUR_API_KEY");

    const codeSnippets = {
        curl: `curl ${apiBase}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${snippetKey}" \\
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello from SRouter!"}]
  }'`,
        typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${apiBase}",
  apiKey: "${snippetKey}",
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: "Hello from SRouter!" }],
  });
  console.log(completion.choices[0].message.content);
}

main();`,
        python: `from openai import OpenAI

client = OpenAI(
    base_url="${apiBase}",
    api_key="${snippetKey}",
)

response = client.chat.completions.create(
    model="openai/gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello from SRouter!"}],
)

print(response.choices[0].message.content)`,
    };

    if (loading) {
        return (
            <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-9 w-32 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--line)] pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--field)] text-[var(--ink)]">
                            <KeyRound className="size-4" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
                            API Keys
                        </h1>
                    </div>
                    <p className="text-xs text-[var(--ink-3)] max-w-xl">
                        Manage client authentication tokens for your applications, automated
                        scripts, and client SDKs.
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-1.5 h-8.5 rounded-[8px] bg-[var(--ink)] px-3.5 font-mono text-xs text-[var(--canvas)] hover:opacity-90 cursor-pointer shadow-xs"
                >
                    <Plus className="size-3.5" />
                    <span>Create Key</span>
                </Button>
            </div>

            {/* Metric KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-3.5">
                    <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-mono">
                        <span>Active Keys</span>
                        <Shield className="size-3.5 text-emerald-500" />
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[var(--ink)]">
                            {activeKeysCount}
                        </span>
                        <span className="text-[11px] text-[var(--ink-3)] font-mono">
                            / {keys.length} total
                        </span>
                    </div>
                </div>

                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-3.5">
                    <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-mono">
                        <span>Total Tokens Routed</span>
                        <Zap className="size-3.5 text-amber-500" />
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-[var(--ink)]">
                            {totalUsage.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-[var(--ink-3)] font-mono">tokens</span>
                    </div>
                </div>

                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-3.5">
                    <div className="flex items-center justify-between text-xs text-[var(--ink-3)] font-mono">
                        <span>Gateway Status</span>
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-lg font-bold font-mono text-emerald-500">
                            Authenticated
                        </span>
                        <span className="text-[11px] text-[var(--ink-3)] font-mono">
                            Bearer active
                        </span>
                    </div>
                </div>
            </div>

            {/* Keys Table Container */}
            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs">
                {/* Search & Actions Bar */}
                <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-3 sm:px-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--ink-3)]" />
                        <Input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter keys by name or ID..."
                            className="h-8 pl-8 font-mono text-xs rounded-[8px] border-[var(--line)] bg-[var(--canvas)]"
                        />
                    </div>
                    <span className="font-mono text-[11px] text-[var(--ink-3)]">
                        {filteredKeys.length} {filteredKeys.length === 1 ? "key" : "keys"}
                    </span>
                </div>

                {filteredKeys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--field)] text-[var(--ink-3)] mb-3">
                            <KeyRound className="size-5" />
                        </div>
                        <p className="font-mono text-sm font-semibold text-[var(--ink)]">
                            {keys.length === 0
                                ? "No API Keys Created Yet"
                                : "No Matching Keys Found"}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[var(--ink-3)] max-w-sm">
                            {keys.length === 0
                                ? "Create your first virtual API key to authenticate requests against SRouter from your code."
                                : "Try clearing your search query to see all available keys."}
                        </p>
                        {keys.length === 0 && (
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="mt-4 h-8 rounded-[8px] bg-[var(--ink)] px-3 font-mono text-xs text-[var(--canvas)] cursor-pointer"
                            >
                                <Plus className="size-3.5 mr-1" />
                                Create First Key
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-xs">
                            <thead className="border-b border-[var(--line)] bg-[var(--field)]/60 text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                                <tr>
                                    <th className="py-2.5 px-4">Name & ID</th>
                                    <th className="py-2.5 px-4">Key Secret</th>
                                    <th className="py-2.5 px-4 text-right">Rate Limit</th>
                                    <th className="py-2.5 px-4 text-right">Quota</th>
                                    <th className="py-2.5 px-4 text-right">Usage</th>
                                    <th className="py-2.5 px-4 text-center">Status</th>
                                    <th className="py-2.5 px-4 text-right">Created</th>
                                    <th className="py-2.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--line)]">
                                {filteredKeys.map((k) => {
                                    const isCopied = copiedKeyId === k.id;
                                    const isDeleting = deletingId === k.id;

                                    return (
                                        <tr
                                            key={k.id}
                                            className="hover:bg-[var(--hover)]/50 transition-colors"
                                        >
                                            {/* Name & ID */}
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-[var(--ink)]">
                                                    {k.name}
                                                </div>
                                                <div className="text-[10px] text-[var(--ink-3)]">
                                                    {k.id}
                                                </div>
                                            </td>

                                            {/* Key Secret Mask */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <code className="rounded bg-[var(--field)] px-1.5 py-0.5 text-[11px] text-[var(--ink-2)] font-mono">
                                                        {maskKey(k.key)}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(k.key, k.id)}
                                                        className="flex size-6 items-center justify-center rounded-[4px] text-[var(--ink-3)] hover:bg-[var(--hover)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                                                        title="Copy API key"
                                                    >
                                                        {isCopied ? (
                                                            <Check className="size-3 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="size-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Rate Limit */}
                                            <td className="py-3 px-4 text-right tabular-nums text-[var(--ink-2)]">
                                                {k.rateLimit > 0
                                                    ? `${k.rateLimit.toLocaleString()} /min`
                                                    : "Unlimited"}
                                            </td>

                                            {/* Quota Limit */}
                                            <td className="py-3 px-4 text-right tabular-nums text-[var(--ink-2)]">
                                                {k.quotaLimit > 0
                                                    ? `${k.quotaLimit.toLocaleString()} tok`
                                                    : "Unlimited"}
                                            </td>

                                            {/* Usage */}
                                            <td className="py-3 px-4 text-right tabular-nums font-semibold text-[var(--ink)]">
                                                {(k.usageTokens || 0).toLocaleString()} tok
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]"
                                                >
                                                    Active
                                                </Badge>
                                            </td>

                                            {/* Created Date */}
                                            <td className="py-3 px-4 text-right text-[var(--ink-3)] tabular-nums">
                                                {new Date(k.createdAt).toLocaleDateString()}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    type="button"
                                                    disabled={isDeleting}
                                                    onClick={() => setKeyToDelete(k)}
                                                    className="flex size-7 items-center justify-center rounded-[6px] text-[var(--ink-3)] hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40 cursor-pointer ml-auto"
                                                    title="Revoke & delete key"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Integration Guide */}
            <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                    <div className="flex items-center gap-2">
                        <Code2 className="size-4 text-[var(--ink)]" />
                        <span className="font-mono text-xs font-bold text-[var(--ink)]">
                            Quick Integration Examples
                        </span>
                    </div>

                    {/* Language Tabs */}
                    <div className="flex items-center gap-1">
                        {(["curl", "typescript", "python"] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setIntegrationTab(tab)}
                                className={`rounded-[6px] px-2.5 py-1 font-mono text-[10.5px] transition-colors cursor-pointer ${
                                    integrationTab === tab
                                        ? "bg-[var(--ink)] text-[var(--canvas)] font-bold"
                                        : "bg-[var(--field)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                                }`}
                            >
                                {tab === "typescript"
                                    ? "TypeScript"
                                    : tab === "python"
                                      ? "Python"
                                      : "cURL"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <pre className="overflow-x-auto rounded-[10px] border border-[var(--line)] bg-[var(--canvas)] p-3 font-mono text-[11.5px] leading-relaxed text-[var(--ink)]">
                        <code>{codeSnippets[integrationTab]}</code>
                    </pre>

                    <button
                        type="button"
                        onClick={() => handleCopy(codeSnippets[integrationTab])}
                        className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-2 py-1 font-mono text-[10.5px] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer shadow-xs"
                    >
                        {copiedFullKey ? (
                            <>
                                <Check className="size-3 text-emerald-500" />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="size-3" />
                                <span>Copy Code</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Dialog: Create Key ────────────────────────────────────────── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md bg-[var(--surface)] border-[var(--line)]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-mono text-sm">
                            <KeyRound className="size-4" />
                            <span>Create New API Key</span>
                        </DialogTitle>
                        <DialogDescription className="font-mono text-xs text-[var(--ink-3)]">
                            Generate an authenticated API key for downstream client access.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-3.5 py-2">
                        <div className="space-y-1.5">
                            <label className="font-mono text-xs font-semibold text-[var(--ink)]">
                                Key Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Next.js App, Production Server, Cursor IDE"
                                className="font-mono text-xs rounded-[8px] bg-[var(--canvas)]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="font-mono text-xs font-semibold text-[var(--ink)]">
                                    Rate Limit (req/min)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={rateLimit}
                                    onChange={(e) => setRateLimit(e.target.value)}
                                    placeholder="0 for unlimited"
                                    className="font-mono text-xs rounded-[8px] bg-[var(--canvas)]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-mono text-xs font-semibold text-[var(--ink)]">
                                    Token Quota Limit
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={quotaLimit}
                                    onChange={(e) => setQuotaLimit(e.target.value)}
                                    placeholder="0 for unlimited"
                                    className="font-mono text-xs rounded-[8px] bg-[var(--canvas)]"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                className="h-8 font-mono text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={creating || !name.trim()}
                                className="h-8 font-mono text-xs bg-[var(--ink)] text-[var(--canvas)]"
                            >
                                {creating ? "Creating..." : "Generate Key"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Newly Created Key Reveal Modal ────────────────────── */}
            <Dialog
                open={Boolean(newlyCreatedKey)}
                onOpenChange={(open) => {
                    if (!open) setNewlyCreatedKey(null);
                }}
            >
                <DialogContent className="sm:max-w-lg bg-[var(--surface)] border-[var(--line)]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-mono text-sm text-emerald-600 dark:text-emerald-400">
                            <Check className="size-4" />
                            <span>API Key Created Successfully</span>
                        </DialogTitle>
                        <DialogDescription className="font-mono text-xs text-[var(--ink-3)]">
                            Please save your API key secret immediately. For security reasons, you
                            will not be able to view it again.
                        </DialogDescription>
                    </DialogHeader>

                    {newlyCreatedKey && (
                        <div className="space-y-3 py-2">
                            <div className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5">
                                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="font-mono text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                                    <strong>Important:</strong> Copy and store this secret key in a
                                    safe place. Once you close this modal, the full secret will be
                                    masked.
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="font-mono text-xs font-semibold text-[var(--ink)]">
                                    {newlyCreatedKey.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={newlyCreatedKey.key}
                                        className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 font-mono text-xs text-[var(--ink)] select-all focus:outline-none"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => handleCopy(newlyCreatedKey.key)}
                                        className="h-8.5 px-3.5 font-mono text-xs bg-[var(--ink)] text-[var(--canvas)] shrink-0"
                                    >
                                        {copiedFullKey ? (
                                            <>
                                                <Check className="size-3 mr-1 text-emerald-400" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-3 mr-1" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={() => setNewlyCreatedKey(null)}
                            className="h-8 font-mono text-xs bg-[var(--ink)] text-[var(--canvas)] w-full"
                        >
                            Done & Saved
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Confirm Delete Key ────────────────────────────────── */}
            <Dialog
                open={Boolean(keyToDelete)}
                onOpenChange={(open) => {
                    if (!open) setKeyToDelete(null);
                }}
            >
                <DialogContent className="sm:max-w-md bg-[var(--surface)] border-[var(--line)]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-mono text-sm text-destructive">
                            <Trash2 className="size-4" />
                            <span>Revoke API Key</span>
                        </DialogTitle>
                        <DialogDescription className="font-mono text-xs text-[var(--ink-3)]">
                            Are you sure you want to revoke and delete this API key? Any
                            applications using this key will immediately receive HTTP 401
                            Unauthorized errors.
                        </DialogDescription>
                    </DialogHeader>

                    {keyToDelete && (
                        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--field)] p-2.5 font-mono text-xs text-[var(--ink)]">
                            <strong>{keyToDelete.name}</strong> (
                            <code>{maskKey(keyToDelete.key)}</code>)
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setKeyToDelete(null)}
                            className="h-8 font-mono text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={async () => {
                                if (keyToDelete) {
                                    await deleteKey(keyToDelete.id);
                                    setKeyToDelete(null);
                                }
                            }}
                            className="h-8 font-mono text-xs"
                        >
                            Revoke Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
