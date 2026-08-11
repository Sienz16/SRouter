import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ChatCompletionChunk, ModelListResponse } from "@srouter/types";

export const Route = createFileRoute("/playground")({
    staticData: { title: "Playground" },
    component: PlaygroundPage,
});

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

function PlaygroundPage() {
    const { data: modelsData } = useQuery({
        queryKey: ["models"],
        queryFn: () => api.get<ModelListResponse>("/v1/models"),
    });

    const models = modelsData?.data ?? [];
    const [model, setModel] = useState("");
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [streaming, setStreaming] = useState(false);

    async function send() {
        const content = input.trim();
        if (!content || streaming) return;

        const history: ChatMessage[] = [...messages, { role: "user", content }];
        setMessages(history);
        setInput("");
        setStreaming(true);

        try {
            const res = await fetch("/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: model || models[0]?.id,
                    messages: history.map((m) => ({ role: m.role, content: m.content })),
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
                        // skip malformed chunks
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

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Playground</h1>
                    <p className="mt-1 text-sm text-muted">Test chat completions langsung ke gateway.</p>
                </div>
                <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
                >
                    <option value="">Select model…</option>
                    {models.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.id}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-surface p-4">
                {messages.length === 0 ? (
                    <div className="m-auto text-sm text-muted">
                        Kirim pesan untuk memulai percakapan.
                    </div>
                ) : (
                    messages.map((m, i) => (
                        <div
                            key={i}
                            className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                                m.role === "user"
                                    ? "self-end bg-accent/20 text-foreground"
                                    : "self-start bg-surface-2 text-foreground"
                            }`}
                        >
                            {m.content || "…"}
                        </div>
                    ))
                )}
            </div>

            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void send();
                        }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                    onClick={() => void send()}
                    disabled={streaming || !input.trim()}
                    className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80 disabled:opacity-50"
                >
                    {streaming ? "Streaming…" : "Send"}
                </button>
            </div>
        </div>
    );
}
