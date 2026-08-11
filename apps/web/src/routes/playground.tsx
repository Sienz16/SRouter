import { useState, useEffect } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    Bot,
    Check,
    Code2,
    Copy,
    Eraser,
    Play,
    Send,
    SlidersHorizontal,
    Sparkles,
    User,
    ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ChatCompletionChunk, ModelListResponse } from "@srouter/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/playground")({
    staticData: { title: "Playground" },
    validateSearch: (search: Record<string, unknown>) => ({
        model: (search.model as string) || "",
    }),
    component: PlaygroundPage,
});

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

function PlaygroundPage() {
    const search = useSearch({ from: "/playground" });
    const { data: modelsData } = useQuery({
        queryKey: ["models"],
        queryFn: () => api.get<ModelListResponse>("/v1/models"),
    });

    const models = modelsData?.data ?? [];
    const [model, setModel] = useState(search.model || "");
    const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant connected via SRouter gateway.");
    const [temperature, setTemperature] = useState(0.7);
    const [topP, setTopP] = useState(1.0);
    const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [streaming, setStreaming] = useState(false);

    const [showParamsSheet, setShowParamsSheet] = useState(false);
    const [showCodeSheet, setShowCodeSheet] = useState(false);
    const [copiedSnippet, setCopiedSnippet] = useState(false);

    useEffect(() => {
        if (!model && models.length > 0) {
            setModel(models[0].id);
        }
    }, [models, model]);

    async function send() {
        const content = input.trim();
        if (!content || streaming) return;

        const currentModel = model || models[0]?.id;
        if (!currentModel) return;

        const conversationHistory: ChatMessage[] = [];
        if (systemPrompt.trim()) {
            conversationHistory.push({ role: "system", content: systemPrompt.trim() });
        }

        const userMsg: ChatMessage = { role: "user", content };
        const updatedMessages: ChatMessage[] = [...messages, userMsg];

        setMessages(updatedMessages);
        setInput("");
        setStreaming(true);

        const payloadMessages = [
            ...(systemPrompt.trim() ? [{ role: "system", content: systemPrompt.trim() }] : []),
            ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        ];

        try {
            const res = await fetch("/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: currentModel,
                    messages: payloadMessages,
                    temperature,
                    top_p: topP,
                    max_tokens: maxTokens,
                    stream: true,
                }),
            });

            if (!res.ok) {
                const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
                throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
            }

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let assistantText = "";

            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith("data:")) continue;
                    const payload = trimmed.slice(5).trim();
                    if (payload === "[DONE]") continue;
                    try {
                        const chunk = JSON.parse(payload) as ChatCompletionChunk;
                        const delta = chunk.choices?.[0]?.delta?.content ?? "";
                        if (delta) {
                            assistantText += delta;
                            setMessages((prev) => {
                                const next = [...prev];
                                next[next.length - 1] = { role: "assistant", content: assistantText };
                                return next;
                            });
                        }
                    } catch {
                        // skip malformed JSON chunks
                    }
                }
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` },
            ]);
        } finally {
            setStreaming(false);
        }
    }

    const currentModelId = model || models[0]?.id || "gpt-4o-mini";
    const apiBase = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/v1`;

    const generatedCurl = `curl ${apiBase}/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${currentModelId}",
    "messages": ${JSON.stringify(
        messages.length > 0 ? messages : [{ role: "user", content: "Hello SRouter!" }],
        null,
        2
    )},
    "temperature": ${temperature}
  }'`;

    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(generatedCurl);
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 1500);
    };

    return (
        <div className="flex h-[calc(100vh-5.5rem)] flex-col gap-3">
            {/* Header Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <Activity className="size-4.5" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-foreground">Playground</h1>
                        <p className="text-xs text-muted-foreground">Uji streaming chat completions secara langsung.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="h-8 rounded-lg border border-border/60 bg-secondary/30 pl-3 pr-8 text-xs font-mono font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
                        >
                            {models.length === 0 ? (
                                <option value="">Loading models…</option>
                            ) : (
                                models.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.id} ({m.owned_by ?? "srouter"})
                                    </option>
                                ))
                            )}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowParamsSheet(true)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/30 px-3 text-xs font-medium text-foreground transition-all hover:bg-secondary"
                    >
                        <SlidersHorizontal className="size-3.5 text-indigo-500" />
                        Parameters
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCodeSheet(true)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/30 px-3 text-xs font-medium text-foreground transition-all hover:bg-secondary"
                    >
                        <Code2 className="size-3.5 text-emerald-500" />
                        Export Code
                    </button>

                    {messages.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setMessages([])}
                            className="flex h-8 size-8 items-center justify-center rounded-lg border border-border/60 bg-secondary/30 text-muted-foreground hover:text-rose-500 transition-colors"
                            title="Clear conversation"
                        >
                            <Eraser className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Stream Canvas */}
            <div className="flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mb-3">
                                <Sparkles className="size-6 animate-pulse" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Playground Ready</h3>
                            <p className="mt-1 text-xs max-w-sm">
                                Kirim pesan di bawah ini untuk menguji gateway routing ke model <code className="font-mono text-indigo-500">{currentModelId}</code>.
                            </p>
                        </div>
                    ) : (
                        messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div
                                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                        m.role === "user"
                                            ? "bg-indigo-500 text-white shadow-2xs"
                                            : "bg-secondary border border-border/60 text-foreground"
                                    }`}
                                >
                                    {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5 text-indigo-500" />}
                                </div>

                                <div
                                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                                        m.role === "user"
                                            ? "bg-accent text-white shadow-2xs font-normal"
                                            : "bg-secondary/40 border border-border/50 text-foreground"
                                    }`}
                                >
                                    {m.content || <span className="animate-pulse text-muted-foreground">Generating output…</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-border/60 bg-secondary/15 p-3">
                    <div className="flex gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    void send();
                                }
                            }}
                            placeholder={`Message ${currentModelId}… (Press Enter to send)`}
                            rows={1}
                            className="flex-1 resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button
                            type="button"
                            onClick={() => void send()}
                            disabled={streaming || !input.trim()}
                            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white shadow-2xs transition-all hover:bg-accent/90 active:scale-95 disabled:opacity-50"
                        >
                            <Send className="size-3.5" />
                            {streaming ? "Streaming…" : "Send"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Parameters Settings Drawer */}
            <Sheet open={showParamsSheet} onOpenChange={setShowParamsSheet}>
                <SheetContent side="right" className="sm:max-w-md w-full p-6 space-y-6">
                    <SheetHeader className="p-0 border-b border-border/50 pb-3">
                        <SheetTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <SlidersHorizontal className="size-4 text-indigo-500" />
                            Model Parameters
                        </SheetTitle>
                    </SheetHeader>

                    <div className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                            <label className="font-semibold text-foreground block">System Prompt</label>
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                rows={4}
                                className="w-full rounded-lg border border-border/60 bg-secondary/30 p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <label className="font-semibold text-foreground">Temperature ({temperature})</label>
                                <span className="text-muted-foreground font-mono">{temperature.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.05"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full accent-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <label className="font-semibold text-foreground">Top P ({topP})</label>
                                <span className="text-muted-foreground font-mono">{topP.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={topP}
                                onChange={(e) => setTopP(parseFloat(e.target.value))}
                                className="w-full accent-indigo-500"
                            />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Code Export Drawer */}
            <Sheet open={showCodeSheet} onOpenChange={setShowCodeSheet}>
                <SheetContent side="right" className="sm:max-w-md w-full p-6 space-y-6">
                    <SheetHeader className="p-0 border-b border-border/50 pb-3">
                        <SheetTitle className="text-base font-bold text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Code2 className="size-4 text-emerald-500" />
                                Export Request Code
                            </span>
                            <button
                                type="button"
                                onClick={() => void handleCopyCode()}
                                className="flex items-center gap-1 rounded bg-secondary/50 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                {copiedSnippet ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                {copiedSnippet ? "Copied!" : "Copy"}
                            </button>
                        </SheetTitle>
                    </SheetHeader>

                    <pre className="p-3.5 rounded-lg border border-border/60 bg-secondary/30 font-mono text-xs text-foreground overflow-x-auto leading-relaxed">
                        <code>{generatedCurl}</code>
                    </pre>
                </SheetContent>
            </Sheet>
        </div>
    );
}

