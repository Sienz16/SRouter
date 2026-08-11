import type { ChatMessageRole, ToolDefinition } from "./openai.js";

export interface AnthropicContentBlock {
    type: "text" | "image" | "tool_use" | "tool_result";
    text?: string;
    source?: {
        type: "base64";
        media_type: string;
        data: string;
    };
    id?: string;
    name?: string;
    input?: Record<string, string | number | boolean>;
    tool_use_id?: string;
    content?: string | AnthropicContentBlock[];
}

export interface AnthropicMessage {
    role: Extract<ChatMessageRole, "user" | "assistant">;
    content: string | AnthropicContentBlock[];
}

export interface AnthropicMessageRequest {
    model: string;
    messages: AnthropicMessage[];
    system?: string | AnthropicContentBlock[];
    max_tokens: number;
    metadata?: Record<string, string | number | boolean>;
    stop_sequences?: string[];
    stream?: boolean;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    tools?: ToolDefinition[];
}

export interface AnthropicMessageResponse {
    id: string;
    type: "message";
    role: "assistant";
    content: AnthropicContentBlock[];
    model: string;
    stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use" | null;
    stop_sequence?: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
        cache_read_input_tokens?: number;
        cache_creation_input_tokens?: number;
    };
}
