import React, { useState } from "react";
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

type CreateKeyDialogProps = {
    open: boolean;
    creating: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { name: string; rateLimit?: number; quotaLimit?: number }) => Promise<void>;
};

export function CreateKeyDialog({ open, creating, onOpenChange, onSubmit }: CreateKeyDialogProps) {
    const [name, setName] = useState("");
    const [rateLimit, setRateLimit] = useState("");
    const [quotaLimit, setQuotaLimit] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        const rateNum = rateLimit.trim() ? parseInt(rateLimit, 10) : undefined;
        const quotaNum = quotaLimit.trim() ? parseInt(quotaLimit, 10) : undefined;

        await onSubmit({
            name: trimmedName,
            rateLimit: Number.isFinite(rateNum) && (rateNum ?? 0) > 0 ? rateNum : undefined,
            quotaLimit: Number.isFinite(quotaNum) && (quotaNum ?? 0) > 0 ? quotaNum : undefined
        });

        setName("");
        setRateLimit("");
        setQuotaLimit("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card border-border p-6">
                <DialogHeader className="space-y-1 text-left">
                    <DialogTitle className="text-base font-semibold text-foreground">
                        Create API Key
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                        Generate a bearer token for SDKs, clients, and automated workloads.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Key Name / Label */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="key-name"
                            className="block text-xs font-medium text-foreground"
                        >
                            Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                            id="key-name"
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. production-backend, cursor-agent"
                            className="h-9 font-mono text-xs rounded-md bg-background border-input"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            A descriptive identifier to track where this key is used.
                        </p>
                    </div>

                    {/* Limits Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Rate Limit */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="rate-limit"
                                className="block text-xs font-medium text-foreground"
                            >
                                Rate limit{" "}
                                <span className="text-[11px] font-normal text-muted-foreground">
                                    (req/min)
                                </span>
                            </label>
                            <Input
                                id="rate-limit"
                                type="number"
                                min="0"
                                value={rateLimit}
                                onChange={(e) => setRateLimit(e.target.value)}
                                placeholder="Unlimited"
                                className="h-9 font-mono text-xs rounded-md bg-background border-input"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Optional max requests/min
                            </p>
                        </div>

                        {/* Token Quota */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="quota-limit"
                                className="block text-xs font-medium text-foreground"
                            >
                                Token quota{" "}
                                <span className="text-[11px] font-normal text-muted-foreground">
                                    (tokens)
                                </span>
                            </label>
                            <Input
                                id="quota-limit"
                                type="number"
                                min="0"
                                value={quotaLimit}
                                onChange={(e) => setQuotaLimit(e.target.value)}
                                placeholder="Unlimited"
                                className="h-9 font-mono text-xs rounded-md bg-background border-input"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Optional max lifetime tokens
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="pt-3 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-8.5 text-xs font-medium cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating || !name.trim()}
                            className="h-8.5 text-xs font-semibold cursor-pointer shadow-xs"
                        >
                            {creating ? "Creating…" : "Create API Key"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
