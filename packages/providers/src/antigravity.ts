import type { AIProvider, ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, ModelObject } from "@srouter/types";
import { OpenAIProvider } from "./openai.js";

export interface AntigravityProviderOptions {
    id?: string;
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    accessToken?: string;
}

export class AntigravityProvider implements AIProvider {
    id: string;
    name: string;
    private baseUrl: string;
    private apiKey: string;
    private accessToken: string;
    private openaiFallback: OpenAIProvider;

    constructor(options: AntigravityProviderOptions = {}) {
        this.id = options.id ?? "antigravity";
        this.name = options.name ?? "Antigravity Provider";
        this.baseUrl = (options.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
        this.apiKey = options.apiKey ?? process.env.ANTIGRAVITY_API_KEY ?? "";
        this.accessToken = options.accessToken ?? process.env.ANTIGRAVITY_ACCESS_TOKEN ?? "";

        this.openaiFallback = new OpenAIProvider({
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
            { id: "antigravity/gemini-3.6-flash", object: "model", created: 1700000000, owned_by: "antigravity" },
            { id: "antigravity/gemini-2.5-pro", object: "model", created: 1700000000, owned_by: "antigravity" },
            { id: "antigravity/gemini-2.5-flash", object: "model", created: 1700000000, owned_by: "antigravity" },
            { id: "antigravity/gemini-2.0-flash", object: "model", created: 1700000000, owned_by: "antigravity" },
            { id: "antigravity/gemini-1.5-pro", object: "model", created: 1700000000, owned_by: "antigravity" },
            { id: "gemini-3.6-flash", object: "model", created: 1700000000, owned_by: "antigravity" },
            { id: "gemini-2.5-pro", object: "model", created: 1700000000, owned_by: "antigravity" },
            { id: "gemini-2.5-flash", object: "model", created: 1700000000, owned_by: "antigravity" },
            { id: "gemini-2.0-flash", object: "model", created: 1700000000, owned_by: "antigravity" },
        ];
    }

    private parseModelName(rawModel: string): string {
        let model = rawModel.includes("/") ? (rawModel.split("/")[1] ?? rawModel) : rawModel;
        if (model === "gemini-3.6-flash" || model === "gemini-3.5-flash" || model === "gemini-2.0-flash") {
            model = "gemini-2.5-flash";
        }
        return model;
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
        const cleanBaseUrl = this.baseUrl.replace(/\/openai$/, "");
        const modelName = this.parseModelName(req.model);
        const contents = req.messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
        }));

        interface CloudCodePayload {
            model: string;
            request: {
                contents: Array<{ role: string; parts: Array<{ text: string }> }>;
            };
        }

        interface GeminiNativePayload {
            contents: Array<{ role: string; parts: Array<{ text: string }> }>;
        }

        let targetUrl: string;
        let bodyPayload: CloudCodePayload | GeminiNativePayload;

        if (token.startsWith("ya29.")) {
            targetUrl = process.env.ANTIGRAVITY_BASE_URL || "https://cloudcode-pa.googleapis.com/v1internal:generateContent";
            bodyPayload = {
                model: modelName,
                request: {
                    contents,
                },
            };
        } else {
            const cleanBaseUrl = this.baseUrl.replace(/\/openai$/, "");
            targetUrl = `${cleanBaseUrl}/models/${modelName}:generateContent`;
            if (isApiKey) {
                targetUrl += `?key=${token}`;
            }
            bodyPayload = { contents };
        }

        const res = await fetch(targetUrl, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Antigravity Provider Error (${res.status}): ${errorText}`);
        }

        const data = (await res.json()) as {
            candidates?: Array<{
                content?: {
                    parts?: Array<{ text?: string }>;
                    role?: string;
                };
                finishReason?: string;
            }>;
            responses?: Array<{
                candidates?: Array<{
                    content?: {
                        parts?: Array<{ text?: string }>;
                        role?: string;
                    };
                }>;
            }>;
            response?: {
                candidates?: Array<{
                    content?: {
                        parts?: Array<{ text?: string }>;
                        role?: string;
                    };
                }>;
            };
        };

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ?? data.responses?.[0]?.candidates?.[0]?.content?.parts?.[0]?.text ?? data.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        return {
            id: `chatcmpl-${Date.now()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: req.model,
            choices: [
                {
                    index: 0,
                    message: {
                        role: "assistant",
                        content: textResponse,
                    },
                    finish_reason: "stop",
                },
            ],
        };
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
