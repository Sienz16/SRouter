import { randomUUID } from "node:crypto";
import type { AIProvider, ChatCompletionChunk, ChatCompletionRequest, ChatCompletionResponse, ModelObject } from "@srouter/types";
import { accumulateChunks, buildRequestBody, commandCodeEventToOpenAIChunk, createCommandCodeStreamState, type CommandCodeEvent } from "@srouter/translator";
import { parseDataLine } from "./base.js";

export interface CommandCodeExecutorOptions {
    id?: string;
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    accessToken?: string;
}

const DEFAULT_BASE_URL = "https://api.commandcode.ai/alpha/generate";

// --- Static model catalog (mirrors 9router open-sse/providers/registry/commandcode.js) ---
const FALLBACK_MODELS: string[] = ["deepseek/deepseek-v4-pro", "deepseek/deepseek-v4-flash", "moonshotai/Kimi-K2.6", "moonshotai/Kimi-K2.5", "zai-org/GLM-5.1", "zai-org/GLM-5", "MiniMaxAI/MiniMax-M2.7", "MiniMaxAI/MiniMax-M2.5", "Qwen/Qwen3.6-Max-Preview", "Qwen/Qwen3.6-Plus", "stepfun/Step-3.5-Flash"];

export class CommandCodeExecutor implements AIProvider {
    id: string;
    name: string;
    private baseUrl: string;
    private apiKey: string;
    private accessToken: string;

    constructor(options: CommandCodeExecutorOptions = {}) {
        this.id = options.id ?? "commandcode";
        this.name = options.name ?? "Command Code Provider";
        this.baseUrl = (options.baseUrl ?? process.env.COMMANDCODE_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
        this.apiKey = options.apiKey ?? process.env.COMMANDCODE_API_KEY ?? "";
        this.accessToken = options.accessToken ?? "";
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-command-code-version": "0.25.7",
            "x-cli-environment": "cli",
            "x-session-id": randomUUID(),
        };
        const token = this.accessToken || this.apiKey;
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }

    async listModels(): Promise<ModelObject[]> {
        return FALLBACK_MODELS.map((id) => ({
            id,
            object: "model" as const,
            owned_by: "command-code",
        }));
    }

    async chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        // CommandCode upstream is streaming-only (forceStream). Run the stream and
        // accumulate the final response for non-streaming callers.
        const chunks: ChatCompletionChunk[] = [];
        for await (const chunk of this.chatCompletionStream(req)) {
            chunks.push(chunk);
        }
        return accumulateChunks(chunks, req.model);
    }

    async *chatCompletionStream(req: ChatCompletionRequest): AsyncGenerator<ChatCompletionChunk, void, void> {
        const body = buildRequestBody(req);
        const res = await fetch(this.baseUrl, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`CommandCode Provider Error (${res.status}): ${errorText}`);
        }

        if (!res.body) {
            throw new Error("No response body received for streaming");
        }

        const state = createCommandCodeStreamState();

        for await (const line of streamCommandCodeLines(res.body)) {
            const jsonStr = parseDataLine(line);
            if (jsonStr === null) continue;
            let event: CommandCodeEvent;
            try {
                event = JSON.parse(jsonStr) as CommandCodeEvent;
            } catch {
                continue;
            }
            for (const chunk of commandCodeEventToOpenAIChunk(event, state)) {
                yield chunk;
            }
        }
    }
}

// CommandCode upstream emits NDJSON (one JSON object per line, no "data:" prefix),
// but tolerate "data:" framing if the wrapper inserts it.
async function* streamCommandCodeLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, void> {
    const reader = body.getReader();
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
            if (trimmed) yield trimmed;
        }
    }
}
