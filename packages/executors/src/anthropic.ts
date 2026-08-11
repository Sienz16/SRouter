import type { AIProvider, AnthropicMessageResponse, ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, ModelObject } from "@srouter/types";
import { anthropicEventToOpenAIChunk, anthropicToOpenAIResponse, openAIToAnthropicRequest } from "@srouter/translator";
import { parseDataLine, streamLines } from "./base.js";

export interface AnthropicExecutorOptions {
    id?: string;
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    accessToken?: string;
}

export class AnthropicExecutor implements AIProvider {
    id: string;
    name: string;
    category: "api_key" = "api_key";
    protocol: "anthropic" = "anthropic";
    private baseUrl: string;
    private apiKey: string;
    private accessToken: string;

    constructor(options: AnthropicExecutorOptions = {}) {
        this.id = options.id ?? "anthropic";
        this.name = options.name ?? "Anthropic Provider";
        this.baseUrl = (options.baseUrl ?? "https://api.anthropic.com/v1").replace(/\/$/, "");
        this.apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
        this.accessToken = options.accessToken ?? process.env.ANTHROPIC_ACCESS_TOKEN ?? "";
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        };
        const token = this.accessToken || this.apiKey;
        if (token) {
            headers["x-api-key"] = token;
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }

    /**
     * Dynamically fetches official model list from Anthropic API (https://api.anthropic.com/v1/models)
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
                data?: Array<{
                    id: string;
                    created_at?: string;
                    display_name?: string;
                }>;
            };

            if (json.data && Array.isArray(json.data)) {
                return json.data.map((m) => ({
                    id: m.id,
                    object: "model",
                    created: m.created_at ? Math.floor(new Date(m.created_at).getTime() / 1000) : Math.floor(Date.now() / 1000),
                    owned_by: "anthropic",
                }));
            }

            return [];
        } catch {
            return [];
        }
    }

    async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const anthropicReq = openAIToAnthropicRequest(req);
        anthropicReq.stream = false;

        const res = await fetch(`${this.baseUrl}/messages`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(anthropicReq),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Anthropic API Error (${res.status}): ${errorText}`);
        }

        const data = (await res.json()) as AnthropicMessageResponse;
        return anthropicToOpenAIResponse(data, req.model);
    }

    async *chatCompletionStream(req: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk, void, void> {
        const anthropicReq = openAIToAnthropicRequest(req);
        anthropicReq.stream = true;

        const res = await fetch(`${this.baseUrl}/messages`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(anthropicReq),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Anthropic API Stream Error (${res.status}): ${errorText}`);
        }

        if (!res.body) {
            throw new Error("No response body received from Anthropic");
        }

        let currentEventType = "";

        for await (const line of streamLines(res.body)) {
            if (line.startsWith("event: ")) {
                currentEventType = line.slice(7);
                continue;
            }

            const jsonStr = parseDataLine(line);
            if (jsonStr === null) continue;
            try {
                const parsedJson = JSON.parse(jsonStr);
                const chunk = anthropicEventToOpenAIChunk(currentEventType, parsedJson, req.model);
                if (chunk) {
                    yield chunk;
                }
            } catch {
                // ignore malformed SSE line
            }
        }
    }
}
