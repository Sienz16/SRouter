import type { AIProvider, ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, ModelObject } from "@srouter/types";
import { buildGeminiBody, buildGeminiUrl, buildGeminiContents, geminiToOpenAIResponse, parseGeminiModelName } from "@srouter/translator";
import { OpenAIExecutor } from "./openai.js";

export interface AntigravityExecutorOptions {
    id?: string;
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    accessToken?: string;
}

export class AntigravityExecutor implements AIProvider {
    id: string;
    name: string;
    private baseUrl: string;
    private apiKey: string;
    private accessToken: string;
    private openaiFallback: OpenAIExecutor;

    constructor(options: AntigravityExecutorOptions = {}) {
        this.id = options.id ?? "antigravity";
        this.name = options.name ?? "Antigravity Provider";
        this.baseUrl = (options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
        this.apiKey = options.apiKey ?? process.env.ANTIGRAVITY_API_KEY ?? "";
        this.accessToken = options.accessToken ?? process.env.ANTIGRAVITY_ACCESS_TOKEN ?? "";

        this.openaiFallback = new OpenAIExecutor({
            id: this.id,
            name: this.name,
            baseUrl: options.baseUrl || "https://generativelanguage.googleapis.com/v1beta/openai",
            apiKey: this.apiKey,
            accessToken: this.accessToken,
        });
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        const token = this.accessToken || this.apiKey;
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            if (token.startsWith("AIzaSy")) {
                headers["x-goog-api-key"] = token;
            } else if (token.startsWith("ya29.")) {
                headers["User-Agent"] = "Antigravity/1.0 (VSCode)";
                headers["x-goog-api-client"] = "gl-node/18.0.0 gd/1.0.0";
            }
        }
        return headers;
    }

    async listModels(): Promise<ModelObject[]> {
        return [
            { id: "antigravity/gemini-3.6-flash", object: "model", owned_by: "antigravity" },
            { id: "antigravity/gemini-2.5-pro", object: "model", owned_by: "antigravity" },
            { id: "antigravity/gemini-2.5-flash", object: "model", owned_by: "antigravity" },
            { id: "antigravity/gemini-2.0-flash", object: "model", owned_by: "antigravity" },
            { id: "antigravity/gemini-1.5-pro", object: "model", owned_by: "antigravity" },
        ];
    }

    async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const token = this.accessToken || this.apiKey;
        const isLocalProxy = this.baseUrl.includes("localhost") || this.baseUrl.includes("127.0.0.1");
        const isApiKey = token.startsWith("AIzaSy");

        // 1. Only use openaiFallback if token is AIzaSy API key or connecting to local proxy
        if (isLocalProxy || (isApiKey && this.baseUrl.includes("/openai"))) {
            return await this.openaiFallback.chatCompletion(req);
        }

        // 2. For Google OAuth ya29... tokens, use Native Gemini REST API
        const modelName = parseGeminiModelName(req.model);
        const contents = buildGeminiContents(req);
        const bodyPayload = buildGeminiBody(contents, modelName, token);

        const targetUrl = token.startsWith("ya29.")
            ? process.env.ANTIGRAVITY_BASE_URL || "https://cloudcode-pa.googleapis.com/v1internal:generateContent"
            : buildGeminiUrl(this.baseUrl, modelName, token);

        const res = await fetch(targetUrl, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Antigravity Provider Error (${res.status}): ${errorText}`);
        }

        const data = (await res.json()) as Parameters<typeof geminiToOpenAIResponse>[0];
        return geminiToOpenAIResponse(data, req.model);
    }

    async *chatCompletionStream(req: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk, void, void> {
        const token = this.accessToken || this.apiKey;
        const isLocalProxy = this.baseUrl.includes("localhost") || this.baseUrl.includes("127.0.0.1");
        const isApiKey = token.startsWith("AIzaSy");

        if (isLocalProxy || (isApiKey && this.baseUrl.includes("/openai"))) {
            yield* this.openaiFallback.chatCompletionStream(req);
            return;
        }

        const res = await this.chatCompletion(req);
        const rawContent = res.choices[0]?.message.content;
        const text = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? "");

        yield {
            id: res.id,
            object: "chat.completion.chunk",
            created: res.created,
            model: req.model,
            choices: [
                {
                    index: 0,
                    delta: {
                        role: "assistant",
                        content: text,
                    },
                    finish_reason: "stop",
                },
            ],
        };
    }
}
