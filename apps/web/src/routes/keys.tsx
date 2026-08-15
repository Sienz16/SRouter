import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, getGatewayBaseUrl } from "@/lib/api";
import {
    AlertTriangle,
    Check,
    Code2,
    Copy,
    Database,
    ExternalLink,
    KeyRound,
    Plus,
    Search,
    Shield,
    Terminal,
    Trash2,
    Zap
} from "lucide-react";
import { useKeys } from "@/hooks/useKeys";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DBAPIKey } from "@srouter/types";

export const Route = createFileRoute("/keys")({
    staticData: { title: "API Keys" },
    component: KeysPage
});

function maskKey(key: string): string {
    if (key.length <= 12) return key;
    return `${key.slice(0, 10)}••••••••${key.slice(-4)}`;
}

const PRESET_NAMES = ["Production Server", "Next.js App", "Cursor / VSCode", "Dev / Staging"];

function KeysPage() {
    const {
        keys,
        loading,
        creating,
        deletingId,
        newlyCreatedKey,
        setNewlyCreatedKey,
        createKey,
        deleteKey
    } = useKeys();

    const { data: serverSettings } = useQuery<{ requireApiKey: boolean }>({
        queryKey: ["server_settings"],
        queryFn: () => api.get<{ requireApiKey: boolean }>("/v1/settings")
    });
    const requireApiKey = serverSettings?.requireApiKey ?? false;

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState("");
    const [rateLimit, setRateLimit] = useState("");
    const [quotaLimit, setQuotaLimit] = useState("");
    const [search, setSearch] = useState("");
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [copiedFullKey, setCopiedFullKey] = useState(false);
    const [copiedEndpoint, setCopiedEndpoint] = useState(false);
    const [integrationTab, setIntegrationTab] = useState<"curl" | "typescript" | "python">("curl");
    const [keyToDelete, setKeyToDelete] = useState<DBAPIKey | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const res = await createKey({
            name: name.trim(),
            rateLimit: rateLimit ? parseInt(rateLimit, 10) : undefined,
            quotaLimit: quotaLimit ? parseInt(quotaLimit, 10) : undefined
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

    const handleCopyEndpoint = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedEndpoint(true);
            setTimeout(() => setCopiedEndpoint(false), 2000);
        } catch {
            // fallback
        }
    };

    const filteredKeys = keys.filter(
        (k) =>
            k.name.toLowerCase().includes(search.toLowerCase()) ||
            k.id.toLowerCase().includes(search.toLowerCase()) ||
            k.key.toLowerCase().includes(search.toLowerCase())
    );

    const totalUsage = keys.reduce((acc, k) => acc + (k.usageTokens || 0), 0);
    const activeKeysCount = keys.filter((k) => k.enabled).length;

    const apiBase = getGatewayBaseUrl();

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

print(response.choices[0].message.content)`
    };

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-6 font-mono">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-8.5 w-32 rounded-[8px]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Skeleton className="h-20 rounded-[10px]" />
                    <Skeleton className="h-20 rounded-[10px]" />
                    <Skeleton className="h-20 rounded-[10px]" />
                    <Skeleton className="h-20 rounded-[10px]" />
                </div>
                <Skeleton className="h-80 rounded-[12px]" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 font-mono">
            {/* ── Editorial Header ────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--line)] pb-5">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-[6px] bg-[var(--field)] text-[var(--ink)]">
                            <KeyRound className="size-3.5" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-[var(--ink)]">
                            API Keys & Access
                        </h1>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Live Gateway
                        </span>
                    </div>
                    <p className="text-xs text-[var(--ink-3)] max-w-2xl leading-relaxed">
                        Virtual bearer tokens for client SDKs, downstream applications, and
                        automated pipelines.
                    </p>
                </div>

                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-1.5 h-8 rounded-[8px] bg-[var(--ink)] px-3.5 text-xs text-[var(--canvas)] hover:opacity-90 cursor-pointer shadow-xs transition-transform active:scale-[0.98]"
                >
                    <Plus className="size-3.5" />
                    <span>Create Key</span>
                </Button>
            </div>

            {/* ── Bento Stat Metrics ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Active Keys */}
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                        <span>Active Keys</span>
                        <Shield className="size-3.5 text-emerald-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tabular-nums text-[var(--ink)]">
                            {activeKeysCount}
                        </span>
                        <span className="text-[11px] text-[var(--ink-3)]">
                            / {keys.length} total
                        </span>
                    </div>
                </div>

                {/* 2. Token Volume */}
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                        <span>Token Throughput</span>
                        <Zap className="size-3.5 text-amber-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tabular-nums text-[var(--ink)]">
                            {totalUsage.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-[var(--ink-3)]">tok</span>
                    </div>
                </div>

                {/* 3. Auth Protocol & Requirement */}
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                        <span>Gateway Security</span>
                        <Link
                            to="/settings"
                            className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors"
                        >
                            Configure
                        </Link>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-[var(--ink)]">
                            {requireApiKey ? "Required" : "Optional"}
                        </span>
                        <span
                            className={`text-[10px] font-semibold ${
                                requireApiKey ? "text-emerald-500" : "text-amber-500"
                            }`}
                        >
                            {requireApiKey ? "● Enforced" : "○ Open Access"}
                        </span>
                    </div>
                </div>

                {/* 4. Gateway Endpoint */}
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-3)]">
                        <span>Gateway Base URL</span>
                        <button
                            type="button"
                            onClick={() => handleCopyEndpoint(apiBase)}
                            className="text-[10px] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors cursor-pointer flex items-center gap-1"
                            title="Copy base URL"
                        >
                            {copiedEndpoint ? (
                                <Check className="size-2.5 text-emerald-500" />
                            ) : (
                                <Copy className="size-2.5" />
                            )}
                            <span>{copiedEndpoint ? "Copied" : "Copy"}</span>
                        </button>
                    </div>
                    <div className="mt-2 flex items-baseline">
                        <span
                            className="truncate text-xs font-semibold text-[var(--ink)] select-all"
                            title={apiBase}
                        >
                            {apiBase}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Key Table Container ────────────────────────────────────── */}
            <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs">
                {/* Search & Counter Bar */}
                <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-3 sm:px-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[var(--ink-3)]" />
                        <Input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search keys by name, ID, or secret..."
                            className="h-7.5 pl-7 text-[11.5px] rounded-[6px] border-[var(--line)] bg-[var(--canvas)]"
                        />
                    </div>
                    <span className="text-[11px] text-[var(--ink-3)]">
                        {filteredKeys.length} {filteredKeys.length === 1 ? "key" : "keys"}
                    </span>
                </div>

                {filteredKeys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                        <div className="flex size-9 items-center justify-center rounded-full bg-[var(--field)] text-[var(--ink-3)] mb-3">
                            <KeyRound className="size-4" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--ink)]">
                            {keys.length === 0 ? "No API Keys Created" : "No Matching Keys"}
                        </p>
                        <p className="mt-1 text-xs text-[var(--ink-3)] max-w-sm leading-relaxed">
                            {keys.length === 0
                                ? "Generate an API key to authenticate requests against SRouter from your client code."
                                : "No keys matched your search filter. Try clearing the query."}
                        </p>
                        {keys.length === 0 && (
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="mt-4 h-7.5 rounded-[6px] bg-[var(--ink)] px-3 text-xs text-[var(--canvas)] cursor-pointer"
                            >
                                <Plus className="size-3 mr-1" />
                                Create First Key
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-[var(--line)] bg-[var(--field)]/40 text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                                <tr>
                                    <th className="py-2.5 px-4">Name & ID</th>
                                    <th className="py-2.5 px-4">Secret Key</th>
                                    <th className="py-2.5 px-4 text-right">Rate Limit</th>
                                    <th className="py-2.5 px-4 text-right">Token Quota</th>
                                    <th className="py-2.5 px-4 text-right">Usage</th>
                                    <th className="py-2.5 px-4 text-center">Status</th>
                                    <th className="py-2.5 px-4 text-right">Created</th>
                                    <th className="py-2.5 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--line)]">
                                {filteredKeys.map((k) => {
                                    const isCopied = copiedKeyId === k.id;
                                    const isDeleting = deletingId === k.id;
                                    const quotaPercent =
                                        k.quotaLimit > 0
                                            ? Math.min(
                                                  100,
                                                  Math.round(
                                                      ((k.usageTokens || 0) / k.quotaLimit) * 100
                                                  )
                                              )
                                            : null;

                                    return (
                                        <tr
                                            key={k.id}
                                            className="hover:bg-[var(--hover)]/40 transition-colors"
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
                                                    <code className="rounded-[4px] bg-[var(--field)] px-1.5 py-0.5 text-[11px] text-[var(--ink-2)]">
                                                        {maskKey(k.key)}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(k.key, k.id)}
                                                        className="flex size-6 items-center justify-center rounded-[4px] text-[var(--ink-3)] hover:bg-[var(--hover)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                                                        title="Copy full key"
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
                                            <td className="py-3 px-4 text-right tabular-nums">
                                                <div className="font-semibold text-[var(--ink)]">
                                                    {(k.usageTokens || 0).toLocaleString()} tok
                                                </div>
                                                {quotaPercent !== null && (
                                                    <div className="mt-1 flex items-center justify-end gap-1.5 text-[9.5px] text-[var(--ink-3)]">
                                                        <div className="w-12 h-1 rounded-full bg-[var(--line)] overflow-hidden">
                                                            <div
                                                                className={`h-full ${
                                                                    quotaPercent > 90
                                                                        ? "bg-rose-500"
                                                                        : quotaPercent > 70
                                                                          ? "bg-amber-500"
                                                                          : "bg-emerald-500"
                                                                }`}
                                                                style={{
                                                                    width: `${quotaPercent}%`
                                                                }}
                                                            />
                                                        </div>
                                                        <span>{quotaPercent}%</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <span className="size-1 rounded-full bg-emerald-500" />
                                                    Active
                                                </span>
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
                                                    className="flex size-7 items-center justify-center rounded-[6px] text-[var(--ink-3)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors disabled:opacity-40 cursor-pointer ml-auto"
                                                    title="Revoke and delete key"
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

            {/* ── Quick Integration Guide ─────────────────────────────────── */}
            <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                    <div className="flex items-center gap-2">
                        <Code2 className="size-3.5 text-[var(--ink)]" />
                        <span className="text-xs font-bold text-[var(--ink)]">
                            Quick Integration Guide
                        </span>
                    </div>

                    {/* Language Tabs */}
                    <div className="flex items-center gap-1">
                        {(["curl", "typescript", "python"] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setIntegrationTab(tab)}
                                className={`rounded-[6px] px-2.5 py-1 text-[10.5px] transition-colors cursor-pointer ${
                                    integrationTab === tab
                                        ? "bg-[var(--ink)] text-[var(--canvas)] font-bold shadow-xs"
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
                    <pre className="overflow-x-auto rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] p-3 text-[11px] leading-relaxed text-[var(--ink)]">
                        <code>{codeSnippets[integrationTab]}</code>
                    </pre>

                    <button
                        type="button"
                        onClick={() => handleCopy(codeSnippets[integrationTab])}
                        className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-[10px] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer shadow-xs"
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
                <DialogContent className="sm:max-w-md bg-[var(--surface)] border-[var(--line)] p-5">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                            <KeyRound className="size-4" />
                            <span>Create Virtual API Key</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[var(--ink-3)]">
                            Create a token to authenticate downstream client SDKs and backend
                            services.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-4 py-2">
                        {/* Name Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--ink)]">
                                Key Label / Name <span className="text-rose-500">*</span>
                            </label>
                            <Input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Production Server, Cursor IDE, Next.js App"
                                className="text-xs rounded-[6px] bg-[var(--canvas)] border-[var(--line)]"
                            />
                            {/* Preset pills */}
                            <div className="flex flex-wrap gap-1 pt-1">
                                {PRESET_NAMES.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setName(preset)}
                                        className="rounded-[4px] border border-[var(--line)] bg-[var(--field)] px-1.5 py-0.5 text-[9.5px] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors cursor-pointer"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional Limits */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--ink)]">
                                    Rate Limit{" "}
                                    <span className="text-[10px] text-[var(--ink-3)]">
                                        (req/min)
                                    </span>
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={rateLimit}
                                    onChange={(e) => setRateLimit(e.target.value)}
                                    placeholder="0 for unlimited"
                                    className="text-xs rounded-[6px] bg-[var(--canvas)] border-[var(--line)]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[var(--ink)]">
                                    Token Quota{" "}
                                    <span className="text-[10px] text-[var(--ink-3)]">
                                        (tokens)
                                    </span>
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={quotaLimit}
                                    onChange={(e) => setQuotaLimit(e.target.value)}
                                    placeholder="0 for unlimited"
                                    className="text-xs rounded-[6px] bg-[var(--canvas)] border-[var(--line)]"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                className="h-8 text-xs border-[var(--line)] cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={creating || !name.trim()}
                                className="h-8 text-xs bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 cursor-pointer shadow-xs"
                            >
                                {creating ? "Generating..." : "Generate Key"}
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
                <DialogContent className="sm:max-w-lg bg-[var(--surface)] border-[var(--line)] p-5">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            <Check className="size-4" />
                            <span>API Key Created Successfully</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[var(--ink-3)]">
                            Copy your API key now. For your security, the secret token will not be
                            displayed again.
                        </DialogDescription>
                    </DialogHeader>

                    {newlyCreatedKey && (
                        <div className="space-y-3 py-2">
                            <div className="rounded-[8px] border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5">
                                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-[11.5px] text-amber-600 dark:text-amber-400 leading-relaxed">
                                    <strong>Save Secret:</strong> Store this key in your environment
                                    variables (e.g. <code>SROUTER_API_KEY</code>). Once dismissed,
                                    the key will be permanently masked.
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-[var(--ink)]">
                                    {newlyCreatedKey.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={newlyCreatedKey.key}
                                        className="w-full rounded-[6px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--ink)] select-all focus:outline-none"
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => handleCopy(newlyCreatedKey.key)}
                                        className="h-8.5 px-3.5 text-xs bg-[var(--ink)] text-[var(--canvas)] shrink-0 cursor-pointer shadow-xs"
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
                            className="h-8 text-xs bg-[var(--ink)] text-[var(--canvas)] w-full cursor-pointer shadow-xs"
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
                <DialogContent className="sm:max-w-md bg-[var(--surface)] border-[var(--line)] p-5">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-rose-500">
                            <Trash2 className="size-4" />
                            <span>Revoke API Key</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[var(--ink-3)] leading-relaxed">
                            Are you sure you want to permanently revoke this key? Downstream
                            requests using this token will fail immediately with HTTP 401.
                        </DialogDescription>
                    </DialogHeader>

                    {keyToDelete && (
                        <div className="rounded-[6px] border border-[var(--line)] bg-[var(--field)] p-2.5 text-xs text-[var(--ink)]">
                            <strong>{keyToDelete.name}</strong> (
                            <code>{maskKey(keyToDelete.key)}</code>)
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setKeyToDelete(null)}
                            className="h-8 text-xs border-[var(--line)] cursor-pointer"
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
                            className="h-8 text-xs cursor-pointer shadow-xs"
                        >
                            Revoke Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
