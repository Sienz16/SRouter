import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ProviderCategory, ProviderDefinition, ProviderProtocol } from "@srouter/types";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

type AddProviderModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type CreateProviderPayload = {
    id?: string;
    name: string;
    category: ProviderCategory;
    protocol: ProviderProtocol;
    baseUrl?: string;
    apiKey?: string;
};

type VerifyResponse = {
    success: boolean;
    message: string;
    modelsCount?: number;
};

const isValidHttpUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (!/^https?:\/\/.+/i.test(trimmed)) return false;
    try {
        const parsed = new URL(trimmed);
        return ["http:", "https:"].includes(parsed.protocol);
    } catch {
        return false;
    }
};

export function AddProviderSheet({ open, onOpenChange }: AddProviderModalProps) {
    const queryClient = useQueryClient();

    const [step, setStep] = useState<1 | 2>(1);
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [category, setCategory] = useState<ProviderCategory>("custom");
    const [protocol, setProtocol] = useState<ProviderProtocol>("openai");
    const [baseUrl, setBaseUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [testing, setTesting] = useState(false);

    const isUrlValid = isValidHttpUrl(baseUrl);
    const isNameValid = Boolean(name.trim());

    const addMutation = useMutation({
        mutationFn: (payload: CreateProviderPayload) =>
            api.post<ProviderDefinition>("/v1/providers", payload),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ["providers"] });
            resetForm();
            onOpenChange(false);
            toast.success(`Provider "${variables.name}" berhasil disimpan!`);
        },
        onError: (error: Error) => {
            const msg = error.message || "Gagal menyimpan provider.";
            toast.error(msg);
        }
    });

    const resetForm = () => {
        setStep(1);
        setName("");
        setId("");
        setCategory("custom");
        setProtocol("openai");
        setBaseUrl("");
        setApiKey("");
        setShowKey(false);
    };

    const handleNameChange = (val: string) => {
        setName(val);
        if (!id || id.startsWith("custom-")) {
            const slug = val
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            setId(slug ? `custom-${slug}` : "");
        }
    };

    const handleTestConnection = async () => {
        const trimmedUrl = baseUrl.trim();
        if (!isUrlValid) {
            toast.error(
                "Endpoint Base URL harus diawali dengan http:// atau https:// (contoh: https://api.openai.com/v1)"
            );
            return;
        }

        if (!apiKey.trim()) {
            toast.error("Masukkan API Key terlebih dahulu.");
            return;
        }

        setTesting(true);
        try {
            const res = await api.post<VerifyResponse>("/v1/providers/verify", {
                protocol,
                baseUrl: trimmedUrl,
                apiKey: apiKey.trim() || undefined
            });
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Gagal menguji koneksi.";
            toast.error(msg);
        } finally {
            setTesting(false);
        }
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Nama provider wajib diisi.");
            return;
        }
        setStep(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Nama provider wajib diisi.");
            setStep(1);
            return;
        }
        const trimmedBaseUrl = baseUrl.trim();
        if (!trimmedBaseUrl) {
            toast.error("Endpoint Base URL wajib diisi.");
            return;
        }
        if (!isValidHttpUrl(trimmedBaseUrl)) {
            toast.error(
                "Endpoint Base URL harus diawali dengan http:// atau https:// (contoh: https://api.openai.com/v1)"
            );
            return;
        }

        addMutation.mutate({
            id: id.trim() || undefined,
            name: name.trim(),
            category,
            protocol,
            baseUrl: trimmedBaseUrl,
            apiKey: apiKey.trim() || undefined
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) resetForm();
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden font-mono">
                {/* Modal Header with Step Badge */}
                <DialogHeader className="p-5 pb-4 border-b border-border/70">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-bold text-foreground">
                            Add Custom Provider
                        </DialogTitle>
                        <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground border border-border/60">
                            Langkah {step} dari 2
                        </span>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                        {step === 1
                            ? "Tentukan identitas provider dan protokol upstream."
                            : "Tentukan endpoint URL dan kunci autentikasi (API key)."}
                    </DialogDescription>
                </DialogHeader>

                {/* Form Content */}
                <div className="p-5 space-y-4">
                    {step === 1 && (
                        <form id="step-1-form" onSubmit={handleNext} className="space-y-4">
                            {/* Provider Name & ID */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="provider-name"
                                    className="text-xs font-semibold text-foreground flex items-center justify-between"
                                >
                                    <span>Nama Provider</span>
                                    <span className="text-[10px] text-destructive font-normal">
                                        Wajib
                                    </span>
                                </label>
                                <Input
                                    id="provider-name"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder=""
                                    className="h-8.5 text-xs font-sans"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="provider-id"
                                    className="text-xs font-semibold text-foreground"
                                >
                                    Driver ID
                                </label>
                                <Input
                                    id="provider-id"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    placeholder=""
                                    className="h-8.5 text-xs font-mono"
                                />
                                <p className="text-[10.5px] text-muted-foreground">
                                    Otomatis dibuat dari nama provider jika dikosongkan.
                                </p>
                            </div>

                            {/* Protocol Selection Cards with official logos */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                    Protokol Upstream
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setProtocol("openai")}
                                        className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                            protocol === "openai"
                                                ? "border-foreground/50 bg-secondary/80 text-foreground font-semibold shadow-2xs"
                                                : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2 text-xs">
                                                <ProviderIcon
                                                    providerId="openai"
                                                    className="size-4 shrink-0"
                                                />
                                                <span>OpenAI</span>
                                            </div>
                                            {protocol === "openai" && (
                                                <Check className="size-3 text-emerald-500" />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1.5">
                                            /chat/completions
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setProtocol("anthropic")}
                                        className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                            protocol === "anthropic"
                                                ? "border-foreground/50 bg-secondary/80 text-foreground font-semibold shadow-2xs"
                                                : "border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2 text-xs">
                                                <ProviderIcon
                                                    providerId="anthropic"
                                                    className="size-4 shrink-0"
                                                />
                                                <span>Anthropic</span>
                                            </div>
                                            {protocol === "anthropic" && (
                                                <Check className="size-3 text-emerald-500" />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1.5">
                                            /v1/messages
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form id="step-2-form" onSubmit={handleSubmit} className="space-y-4">
                            {/* Base URL */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="provider-base-url"
                                    className="text-xs font-semibold text-foreground flex items-center justify-between"
                                >
                                    <span>Endpoint Base URL</span>
                                    <span className="text-[10px] text-destructive font-normal">
                                        Wajib
                                    </span>
                                </label>
                                <Input
                                    id="provider-base-url"
                                    type="url"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder=""
                                    className="h-8.5 text-xs font-mono"
                                    autoFocus
                                    required
                                />
                                <p className="text-[10.5px] text-muted-foreground">
                                    Target server tempat request gateway akan diteruskan.
                                </p>
                            </div>

                            {/* API Key */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="provider-api-key"
                                        className="text-xs font-semibold text-foreground"
                                    >
                                        API Key (Opsional)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={testing || !apiKey.trim() || !isUrlValid}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground hover:underline cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:no-underline transition-opacity"
                                    >
                                        {testing ? (
                                            <>
                                                <Loader2 className="size-3 animate-spin" />
                                                <span>Menguji…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Activity className="size-3 text-amber-500" />
                                                <span>Uji API Key</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="relative">
                                    <Input
                                        id="provider-api-key"
                                        type={showKey ? "text" : "password"}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder=""
                                        className="h-8.5 pr-8 text-xs font-mono"
                                    />
                                    {apiKey && (
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            aria-label={showKey ? "Hide key" : "Show key"}
                                        >
                                            {showKey ? (
                                                <EyeOff className="size-3.5" />
                                            ) : (
                                                <Eye className="size-3.5" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                                    <Lock className="size-3" />
                                    <span>Disimpan secara lokal di SQLite database (WAL).</span>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Modal Footer with Back & Next / Submit buttons */}
                <DialogFooter className="p-4 border-t border-border/70 bg-secondary/15 flex items-center justify-between m-0">
                    {step === 1 ? (
                        <>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenChange(false)}
                                className="h-8 text-xs cursor-pointer text-muted-foreground"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleNext}
                                disabled={!isNameValid}
                                className="h-8 text-xs font-semibold cursor-pointer shadow-xs gap-1"
                            >
                                <span>Selanjutnya</span>
                                <ArrowRight className="size-3.5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setStep(1)}
                                className="h-8 text-xs cursor-pointer gap-1"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali</span>
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSubmit}
                                disabled={addMutation.isPending || !isNameValid || !isUrlValid}
                                className="h-8 text-xs font-semibold cursor-pointer shadow-xs gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {addMutation.isPending ? (
                                    "Menyimpan…"
                                ) : (
                                    <>
                                        <Check className="size-3.5" />
                                        <span>Simpan Provider</span>
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
