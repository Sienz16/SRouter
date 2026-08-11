import { useState } from "react";
import { Check, Cloud, Copy, Globe, Network } from "lucide-react";

const API_BASE = `${window.location.origin}/v1`;

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <button
            type="button"
            onClick={() => void handleCopy()}
            aria-label="Copy endpoint"
            className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-muted transition-colors hover:text-foreground"
        >
            {copied ? (
                <Check className="size-3.5 text-green-500" strokeWidth={2} />
            ) : (
                <Copy className="size-3.5" strokeWidth={1.75} />
            )}
        </button>
    );
}

function ComingSoonBadge() {
    return (
        <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
            Coming Soon
        </span>
    );
}

function StatusRow({
    title,
    description,
    icon: Icon,
}: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2">
                    <Icon className="size-4 text-muted" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium">{title}</div>
                    <div className="truncate text-xs text-muted">{description}</div>
                </div>
            </div>
            <ComingSoonBadge />
        </div>
    );
}

export function NetworkStatus() {
    return (
        <div className="rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-accent/10">
                    <Globe className="size-4 text-accent" strokeWidth={1.75} />
                </div>
                <div>
                    <div className="text-sm font-semibold">Network</div>
                    <div className="text-xs text-muted">Endpoint dan akses gateway</div>
                </div>
            </div>

            <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5">
                    <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                        API Endpoint
                    </span>
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                        {API_BASE}
                    </code>
                    <CopyButton text={API_BASE} />
                </div>

                <StatusRow
                    title="Cloudflare Tunnel"
                    description="Tunnel off. Expose gateway ke internet publik."
                    icon={Cloud}
                />
                <StatusRow
                    title="Tailscale"
                    description="Tailscale off. Akses aman antar perangkat."
                    icon={Network}
                />
            </div>
        </div>
    );
}
