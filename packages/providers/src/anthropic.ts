import type {
    AIProvider,
    AnthropicMessageResponse,
    ChatCompletionChunk,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ModelObject,
} from '@srouter/types';
import {
    anthropicEventToOpenAIChunk,
    anthropicToOpenAIResponse,
    openAIToAnthropicRequest,
} from './adapter.js';

export interface AnthropicProviderOptions {
    id?: string;
    name?: string;
    baseUrl?: string;
    apiKey?: string;
}

export class AnthropicProvider implements AIProvider {
    id: string;
    name: string;
    category: 'api_key' = 'api_key';
    protocol: 'anthropic' = 'anthropic';
    private baseUrl: string;
    private apiKey: string;

    constructor(options: AnthropicProviderOptions = {}) {
        this.id = options.id ?? 'anthropic';
        this.name = options.name ?? 'Anthropic Provider';
        this.baseUrl = (options.baseUrl ?? 'https://api.anthropic.com/v1').replace(/\/$/, '');
        this.apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '';
    }

    private getHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
        };
    }

    /**
     * Dynamically fetches official model list from Anthropic API (https://api.anthropic.com/v1/models)
     */
    async listModels(): Promise<ModelObject[]> {
        if (!this.apiKey) {
            // Fallback list if no API key configured
            return [
                {
                    id: 'claude-3-7-sonnet-20250219',
                    object: 'model',
                    created: Math.floor(Date.now() / 1000),
                    owned_by: 'anthropic',
                },
                {
                    id: 'claude-3-5-sonnet-20241022',
                    object: 'model',
                    created: Math.floor(Date.now() / 1000),
                    owned_by: 'anthropic',
                },
                {
                    id: 'claude-3-5-haiku-20241022',
                    object: 'model',
                    created: Math.floor(Date.now() / 1000),
                    owned_by: 'anthropic',
                },
            ];
        }

        try {
            const res = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const json = (await res.json()) as {
                data?: Array<{ id: string; created_at?: string; display_name?: string }>;
            };

            if (json.data && Array.isArray(json.data)) {
                return json.data.map((m) => ({
                    id: m.id,
                    object: 'model',
                    created: m.created_at
                        ? Math.floor(new Date(m.created_at).getTime() / 1000)
                        : Math.floor(Date.now() / 1000),
                    owned_by: 'anthropic',
                }));
            }
        } catch {
            // Fallback if fetch fails
        }

        return [
            {
                id: 'claude-3-7-sonnet-20250219',
                object: 'model',
                created: Math.floor(Date.now() / 1000),
                owned_by: 'anthropic',
            },
            {
                id: 'claude-3-5-sonnet-20241022',
                object: 'model',
                created: Math.floor(Date.now() / 1000),
                owned_by: 'anthropic',
            },
            {
                id: 'claude-3-5-haiku-20241022',
                object: 'model',
                created: Math.floor(Date.now() / 1000),
                owned_by: 'anthropic',
            },
        ];
    }

    async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const anthropicReq = openAIToAnthropicRequest(req);
        anthropicReq.stream = false;

        const res = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
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

    async *chatCompletionStream(
        req: ChatCompletionRequest
    ): AsyncGenerator<ChatCompletionChunk, void, void> {
        const anthropicReq = openAIToAnthropicRequest(req);
        anthropicReq.stream = true;

        const res = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(anthropicReq),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Anthropic API Stream Error (${res.status}): ${errorText}`);
        }

        if (!res.body) {
            throw new Error('No response body received from Anthropic');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            let currentEventType = '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('event: ')) {
                    currentEventType = trimmed.slice(7);
                    continue;
                }

                if (trimmed.startsWith('data: ')) {
                    const jsonStr = trimmed.slice(6);
                    try {
                        const parsedJson = JSON.parse(jsonStr);
                        const chunk = anthropicEventToOpenAIChunk(
                            currentEventType,
                            parsedJson,
                            req.model
                        );
                        if (chunk) {
                            yield chunk;
                        }
                    } catch {
                        // ignore malformed SSE line
                    }
                }
            }
        }
    }
}
