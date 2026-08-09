import type { AIProvider, ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, ModelObject } from "@srouter/types";

export class OpenRouterProvider implements AIProvider {
    id = "openrouter";
    name = "OpenRouter";
    category: "free_tier" | "api_key" = "free_tier";
    protocol: "openai" = "openai";
    private baseUrl = "https://openrouter.ai/api/v1";
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }
        return headers;
    }

    /**
     * Dynamically fetches live models from OpenRouter official API (https://openrouter.ai/api/v1/models)
     */
    async listModels(): Promise<ModelObject[]> {
        try {
            const res = await fetch(`${this.baseUrl}/models`, {
                method: "GET",
                headers: this.getHeaders(),
            });

            if (!res.ok) {
                return [];
            }

            const json = (await res.json()) as {
                data?: Array<{ id: string; name?: string; created?: number }>;
            };

            if (json.data && Array.isArray(json.data)) {
                return json.data.map((m) => ({
                    id: m.id,
                    object: "model",
                    created: m.created ?? Math.floor(Date.now() / 1000),
                    owned_by: "openrouter",
                }));
            }
        } catch {
            // fallback
        }

        return [];
    }

    async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({ ...req, stream: false }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`OpenRouter API Error (${res.status}): ${errorText}`);
        }

        return (await res.json()) as ChatCompletionResponse;
    }

    async *chatCompletionStream(req: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk, void, void> {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({ ...req, stream: true }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`OpenRouter Stream Error (${res.status}): ${errorText}`);
        }

        if (!res.body) {
            throw new Error("No response body received from OpenRouter");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(":")) continue;

                if (trimmed === "data: [DONE]") {
                    return;
                }

                if (trimmed.startsWith("data: ")) {
                    const jsonStr = trimmed.slice(6);
                    try {
                        const parsed = JSON.parse(jsonStr) as ChatCompletionChunk;
                        yield parsed;
                    } catch {
                        // ignore malformed JSON chunk
                    }
                }
            }
        }
    }
}
