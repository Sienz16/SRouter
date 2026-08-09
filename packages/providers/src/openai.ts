import type { AIProvider, ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, ModelListResponse, ModelObject } from "@srouter/types";

export interface OpenAIProviderOptions {
    id?: string;
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    accessToken?: string;
}

export class OpenAIProvider implements AIProvider {
    id: string;
    name: string;
    private baseUrl: string;
    private apiKey: string;
    private accessToken: string;

    constructor(options: OpenAIProviderOptions = {}) {
        this.id = options.id ?? "openai";
        this.name = options.name ?? "OpenAI Provider";
        this.baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
        this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
        this.accessToken = options.accessToken ?? process.env.OPENAI_ACCESS_TOKEN ?? "";
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        const token = this.accessToken || this.apiKey;
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }

    async listModels(): Promise<ModelObject[]> {
        try {
            const res = await fetch(`${this.baseUrl}/models`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            if (!res.ok) {
                return [];
            }
            const data = (await res.json()) as ModelListResponse;
            return data.data ?? [];
        } catch {
            return [];
        }
    }

    async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({ ...req, stream: false }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`OpenAI Provider Error (${res.status}): ${errorText}`);
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
            throw new Error(`OpenAI Provider Stream Error (${res.status}): ${errorText}`);
        }

        if (!res.body) {
            throw new Error("No response body received for streaming");
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
