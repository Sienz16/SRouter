import { useEffect, useState } from "react";
import { Key, X, Eye, EyeOff } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export interface ConnectionFormInput {
    name?: string;
    baseUrl?: string;
    apiKey: string;
}

interface ConnectionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    providerName: string;
    defaultBaseUrl?: string;
    isSaving: boolean;
    error?: string | null;
    onSubmit: (payload: ConnectionFormInput) => void;
}

export function ConnectionForm({
    open,
    onOpenChange,
    providerName,
    defaultBaseUrl,
    isSaving,
    error,
    onSubmit,
}: ConnectionFormProps) {
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        if (open) {
            setApiKey("");
            setShowKey(false);
            setFormError("");
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
            setFormError("API key is required");
            return;
        }

        setFormError("");
        onSubmit({
            name: `${providerName} Key`,
            baseUrl: defaultBaseUrl || undefined,
            apiKey: trimmedKey,
        });
    };

    const displayError = error || formError;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md w-full p-5 bg-[var(--surface)] border border-[var(--line)] rounded-xl space-y-4 shadow-xl font-mono">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-rose-500/80 inline-block" />
                            <span className="size-2.5 rounded-full bg-amber-500/80 inline-block" />
                            <span className="size-2.5 rounded-full bg-emerald-500/80 inline-block" />
                        </div>
                        <h2 className="font-bold text-sm text-[var(--ink)] ml-2 flex items-center gap-1.5">
                            <Key className="size-3.5 text-orange-500" />
                            <span>Add API Key for {providerName}</span>
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="text-[var(--ink-3)] hover:text-[var(--ink)] p-1 rounded hover:bg-[var(--field)] transition-colors cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <DialogHeader className="p-0 space-y-1">
                    <DialogTitle className="sr-only">Add API Key for {providerName}</DialogTitle>
                    <DialogDescription className="text-xs text-[var(--ink-3)]">
                        Masukkan API Key / Access Token untuk menghubungkan {providerName} ke SRouter.
                    </DialogDescription>
                </DialogHeader>

                {displayError && (
                    <div className="rounded-[8px] border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-500">
                        {displayError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="conn-api-key"
                            className="font-medium text-[var(--ink)] block"
                        >
                            API Key / Access Token *
                        </label>
                        <div className="relative">
                            <input
                                id="conn-api-key"
                                type={showKey ? "text" : "password"}
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    if (formError) setFormError("");
                                }}
                                autoFocus
                                required
                                className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--field)] px-3 py-2 pr-9 text-xs text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                                tabIndex={-1}
                            >
                                {showKey ? (
                                    <EyeOff className="size-3.5" />
                                ) : (
                                    <Eye className="size-3.5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded-[6px] border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !apiKey.trim()}
                            className="rounded-[6px] bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                        >
                            {isSaving ? "Saving…" : "Save API Key"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
