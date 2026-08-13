import { randomUUID } from "node:crypto";
import type {
    ChatCompletionChunk,
    ChatCompletionChunkDelta,
    ChatCompletionRequest,
    ChatCompletionResponse,
    FinishReason,
    ToolCall,
} from "@srouter/types";

const DEFAULT_MAX_TOKENS = 4096;

// --- Request translation helpers (port of 9router openai-to-commandcode.js) ---

function flattenText(content: unknown): string {
    if (content == null) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        const parts: string[] = [];
        for (const p of content) {
            if (typeof p === "string") parts.push(p);
            else if (
                p &&
                typeof p === "object" &&
                typeof (p as { text?: unknown }).text === "string"
            )
                parts.push((p as { text: string }).text);
        }
        return parts.join("\n");
    }
    return String(content);
}

function toContentBlocks(content: unknown): Array<{ type: string; text: string }> {
    if (content == null) return [{ type: "text", text: "" }];
    if (typeof content === "string") return [{ type: "text", text: content }];
    if (Array.isArray(content)) {
        const blocks: Array<{ type: string; text: string }> = [];
        for (const part of content) {
            if (typeof part === "string") {
                blocks.push({ type: "text", text: part });
            } else if (part && typeof part === "object") {
                const p = part as { type?: string; text?: string };
                if (p.type === "text" && typeof p.text === "string") {
                    blocks.push({ type: "text", text: p.text });
                } else if (p.type === "image_url" || p.type === "image") {
                    blocks.push({ type: "text", text: "[image omitted]" });
                } else if (typeof p.text === "string") {
                    blocks.push({ type: "text", text: p.text });
                }
            }
        }
        return blocks.length ? blocks : [{ type: "text", text: "" }];
    }
    return [{ type: "text", text: String(content) }];
}

function safeParseJson(s: unknown): unknown {
    if (s == null) return {};
    if (typeof s !== "string") return s;
    try {
        return JSON.parse(s);
    } catch {
        return {};
    }
}

export interface CommandCodeMessage {
    role: "user" | "assistant" | "tool";
    content: Array<{
        type: string;
        text?: string;
        toolCallId?: string;
        toolName?: string;
        input?: unknown;
        output?: unknown;
    }>;
}

export interface CommandCodeRequestBody {
    threadId: string;
    memory: string;
    config: {
        workingDir: string;
        date: string;
        environment: string;
        structure: unknown[];
        isGitRepo: boolean;
        currentBranch: string;
        mainBranch: string;
        gitStatus: string;
        recentCommits: unknown[];
    };
    params: {
        model: string;
        messages: CommandCodeMessage[];
        stream: boolean;
        max_tokens: number;
        temperature: number;
        system?: string;
        tools?: Array<{ name: string; description?: string; input_schema: unknown }>;
        top_p?: number;
    };
}

function convertMessages(messages: ChatCompletionRequest["messages"]): {
    messages: CommandCodeMessage[];
    system: string;
} {
    const out: CommandCodeMessage[] = [];
    const systemTexts: string[] = [];

    for (const m of messages) {
        if (!m) continue;

        if (m.role === "system") {
            const t = flattenText(m.content);
            if (t) systemTexts.push(t);
            continue;
        }

        if (m.role === "tool") {
            const value = typeof m.content === "string" ? m.content : flattenText(m.content);
            out.push({
                role: "tool",
                content: [
                    {
                        type: "tool-result",
                        toolCallId: m.tool_call_id || "",
                        toolName: m.name || "",
                        output: { type: "text", value },
                    },
                ],
            });
            continue;
        }

        if (m.role === "assistant") {
            const blocks: CommandCodeMessage["content"] = [];
            const text = flattenText(m.content);
            if (text) blocks.push({ type: "text", text });
            if (Array.isArray(m.tool_calls)) {
                for (const tc of m.tool_calls) {
                    const fn = tc.function || {};
                    blocks.push({
                        type: "tool-call",
                        toolCallId: tc.id || "",
                        toolName: fn.name || "",
                        input: safeParseJson(fn.arguments),
                    });
                }
            }
            out.push({
                role: "assistant",
                content: blocks.length ? blocks : [{ type: "text", text: "" }],
            });
            continue;
        }

        out.push({ role: "user", content: toContentBlocks(m.content) });
    }

    return { messages: out, system: systemTexts.join("\n\n") };
}

function convertTools(
    tools: ChatCompletionRequest["tools"],
): Array<{ name: string; description?: string; input_schema: unknown }> | undefined {
    if (!Array.isArray(tools) || tools.length === 0) return undefined;
    const result: Array<{ name: string; description?: string; input_schema: unknown }> = [];
    for (const t of tools) {
        if (!t || t.type !== "function" || !t.function) continue;
        result.push({
            name: t.function.name,
            description: t.function.description,
            input_schema: t.function.parameters || { type: "object" },
        });
    }
    return result.length ? result : undefined;
}

export function buildRequestBody(req: ChatCompletionRequest): CommandCodeRequestBody {
    const { messages, system } = convertMessages(req.messages);
    // Strip only the first (provider alias) segment: "commandcode/deepseek/deepseek-v4-pro" -> "deepseek/deepseek-v4-pro".
    // Upstream model ids keep their own namespace (deepseek/..., moonshotai/..., zai-org/...).
    const model = req.model.includes("/") ? req.model.slice(req.model.indexOf("/") + 1) : req.model;
    const params: CommandCodeRequestBody["params"] = {
        model,
        messages,
        stream: true,
        max_tokens: req.max_tokens ?? DEFAULT_MAX_TOKENS,
        temperature: req.temperature ?? 0.3,
    };

    if (system) params.system = system;

    const tools = convertTools(req.tools);
    if (tools) params.tools = tools;
    if (req.top_p != null) params.top_p = req.top_p;

    return {
        threadId: randomUUID(),
        memory: "",
        config: {
            workingDir: process.cwd(),
            date: new Date().toISOString().slice(0, 10),
            environment: process.platform,
            structure: [],
            isGitRepo: false,
            currentBranch: "",
            mainBranch: "",
            gitStatus: "",
            recentCommits: [],
        },
        params,
    };
}

// --- Response translation helpers (port of 9router commandcode-to-openai.js) ---

export interface CommandCodeStreamState {
    responseId: string;
    created: number;
    model: string;
    chunkIndex: number;
    toolIndex: number;
    toolIndexById: Map<string, number>;
    openTools: Set<string>;
    finishReason: FinishReason | null;
    usage: unknown;
}

export function createCommandCodeStreamState(): CommandCodeStreamState {
    return {
        responseId: "",
        created: 0,
        model: "",
        chunkIndex: 0,
        toolIndex: 0,
        toolIndexById: new Map(),
        openTools: new Set(),
        finishReason: null,
        usage: null,
    };
}

function ensureState(state: CommandCodeStreamState, model: string): void {
    if (!state.responseId) {
        state.responseId = `chatcmpl-${Date.now()}`;
        state.created = Math.floor(Date.now() / 1000);
        state.model = model || "commandcode";
        state.chunkIndex = 0;
        state.toolIndex = 0;
        state.toolIndexById = new Map();
        state.openTools = new Set();
        state.finishReason = null;
        state.usage = null;
    }
}

function makeChunk(
    state: CommandCodeStreamState,
    delta: ChatCompletionChunkDelta,
    finishReason: FinishReason = null,
): ChatCompletionChunk {
    return {
        id: state.responseId,
        object: "chat.completion.chunk",
        created: state.created,
        model: state.model,
        choices: [{ index: 0, delta, finish_reason: finishReason }],
    };
}

const mapFinishReason = (reason: unknown): FinishReason => {
    switch (reason) {
        case "stop":
            return "stop";
        case "length":
            return "length";
        case "tool-calls":
        case "tool_use":
            return "tool_calls";
        case "content-filter":
            return "content_filter";
        case "error":
            return "stop";
        default:
            return (reason as FinishReason) || "stop";
    }
};

function fallbackToolCallId(index: number): string {
    return `call_${index}_${Date.now()}`;
}

export interface CommandCodeEvent {
    type?: string;
    text?: string;
    delta?: string;
    inputTextDelta?: string;
    id?: string;
    toolCallId?: string;
    toolName?: string;
    input?: unknown;
    finishReason?: unknown;
    usage?: unknown;
    totalUsage?: unknown;
    model?: string;
    error?: unknown;
    message?: unknown;
}

export function commandCodeEventToOpenAIChunk(
    event: CommandCodeEvent,
    state: CommandCodeStreamState,
): ChatCompletionChunk[] {
    if (!event || typeof event !== "object" || !event.type) return [];

    ensureState(state, event.model ?? "");
    const out: ChatCompletionChunk[] = [];

    switch (event.type) {
        case "text-delta": {
            const text = event.text || event.delta || "";
            if (!text) break;
            const delta: ChatCompletionChunkDelta =
                state.chunkIndex === 0 ? { role: "assistant", content: text } : { content: text };
            state.chunkIndex++;
            out.push(makeChunk(state, delta));
            break;
        }
        case "reasoning-delta": {
            const text = event.text || "";
            if (!text) break;
            const delta: ChatCompletionChunkDelta =
                state.chunkIndex === 0
                    ? { role: "assistant", reasoning_content: text }
                    : { reasoning_content: text };
            state.chunkIndex++;
            out.push(makeChunk(state, delta));
            break;
        }
        case "tool-input-start": {
            const id = event.id || event.toolCallId || fallbackToolCallId(state.toolIndex);
            let idx = state.toolIndexById.get(id);
            if (idx == null) {
                idx = state.toolIndex++;
                state.toolIndexById.set(id, idx);
            }
            state.openTools.add(id);
            const delta: ChatCompletionChunkDelta = {
                ...(state.chunkIndex === 0 ? { role: "assistant" as const } : {}),
                tool_calls: [
                    {
                        index: idx,
                        id,
                        type: "function",
                        function: { name: event.toolName || "", arguments: "" },
                    },
                ],
            };
            state.chunkIndex++;
            out.push(makeChunk(state, delta));
            break;
        }
        case "tool-input-delta": {
            const id = event.id || event.toolCallId;
            if (!id) break;
            const idx = state.toolIndexById.get(id);
            if (idx == null) break;
            const delta: ChatCompletionChunkDelta = {
                tool_calls: [
                    {
                        index: idx,
                        function: { arguments: event.delta || event.inputTextDelta || "" },
                    },
                ],
            };
            out.push(makeChunk(state, delta));
            break;
        }
        case "tool-call": {
            const id = event.toolCallId;
            if (!id || state.toolIndexById.has(id)) break;
            const idx = state.toolIndex++;
            state.toolIndexById.set(id, idx);
            const argsStr =
                typeof event.input === "string" ? event.input : JSON.stringify(event.input ?? {});
            const delta: ChatCompletionChunkDelta = {
                ...(state.chunkIndex === 0 ? { role: "assistant" as const } : {}),
                tool_calls: [
                    {
                        index: idx,
                        id,
                        type: "function",
                        function: { name: event.toolName || "", arguments: argsStr },
                    },
                ],
            };
            state.chunkIndex++;
            out.push(makeChunk(state, delta));
            break;
        }
        case "finish-step": {
            state.finishReason = mapFinishReason(event.finishReason);
            if (event.usage) state.usage = event.usage;
            break;
        }
        case "finish": {
            const finishReason =
                state.finishReason || mapFinishReason(event.finishReason || "stop");
            const finalChunk = makeChunk(state, {}, finishReason);
            const totalUsage = event.totalUsage || state.usage;
            const usage = toOpenAIUsage(totalUsage);
            if (usage) finalChunk.usage = usage;
            out.push(finalChunk);
            break;
        }
        case "error": {
            const errVal = event.error ?? event.message ?? "unknown";
            const errStr = typeof errVal === "string" ? errVal : JSON.stringify(errVal);
            out.push(makeChunk(state, { content: `\n\n[CommandCode error: ${errStr}]` }));
            out.push(makeChunk(state, {}, "stop"));
            break;
        }
        default:
            break;
    }

    return out;
}

interface UsageInfo {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

function toOpenAIUsage(raw: unknown): UsageInfo | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as { inputTokens?: unknown; outputTokens?: unknown; totalTokens?: unknown };
    const n = (v: unknown): number => (typeof v === "number" ? v : 0);
    const input = n(r.inputTokens);
    const output = n(r.outputTokens);
    const total = typeof r.totalTokens === "number" ? r.totalTokens : input + output;
    return { prompt_tokens: input, completion_tokens: output, total_tokens: total };
}

// Accumulate streamed OpenAI chunks into a single non-streaming ChatCompletionResponse.
export function accumulateChunks(
    chunks: ChatCompletionChunk[],
    model: string,
): ChatCompletionResponse {
    let content = "";
    const toolCalls: ToolCall[] = [];
    const toolCallMap = new Map<number, { id: string; name: string; args: string }>();

    for (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;
        if (typeof delta.content === "string") content += delta.content;
        if (Array.isArray(delta.tool_calls)) {
            for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                const entry = toolCallMap.get(idx) || { id: "", name: "", args: "" };
                if (tc.id) entry.id = tc.id;
                if (tc.function?.name) entry.name = tc.function.name;
                if (tc.function?.arguments) entry.args += tc.function.arguments;
                toolCallMap.set(idx, entry);
            }
        }
    }

    for (const entry of toolCallMap.values()) {
        toolCalls.push({
            id: entry.id,
            type: "function",
            function: { name: entry.name, arguments: entry.args },
        });
    }

    const finishReason: FinishReason = chunks.at(-1)?.choices[0]?.finish_reason ?? "stop";
    const usage = [...chunks].reverse().find((c) => c.usage)?.usage;

    return {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
            {
                index: 0,
                message: {
                    role: "assistant",
                    content: content || null,
                    ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
                },
                finish_reason: finishReason,
            },
        ],
        ...(usage ? { usage } : {}),
    };
}
