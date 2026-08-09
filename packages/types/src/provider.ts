export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export interface ChatMessageContentPart {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;
        detail?: 'auto' | 'low' | 'high';
    };
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ToolFunctionParameterProperty {
    type: string;
    description?: string;
    enum?: string[];
}

export interface ToolFunctionParameters {
    type: 'object';
    properties?: Record<string, ToolFunctionParameterProperty>;
    required?: string[];
}

export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description?: string;
        parameters?: ToolFunctionParameters;
    };
}

export type ToolChoiceOption =
    | 'none'
    | 'auto'
    | 'required'
    | { type: 'function'; function: { name: string } };

export interface ChatMessage {
    role: ChatMessageRole;
    content: string | ChatMessageContentPart[] | null;
    name?: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}

export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stop?: string | string[];
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    user?: string;
    tools?: ToolDefinition[];
    tool_choice?: ToolChoiceOption;
    response_format?: { type: string };
}

export interface UsageInfo {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface ChatCompletionChoice {
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

export interface ChatCompletionResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: ChatCompletionChoice[];
    usage?: UsageInfo;
    system_fingerprint?: string;
}

export interface ChatCompletionChunkDelta {
    role?: ChatMessageRole;
    content?: string;
    tool_calls?: ToolCall[];
}

export interface ChatCompletionChunkChoice {
    index: number;
    delta: ChatCompletionChunkDelta;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

export interface ChatCompletionChunk {
    id: string;
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    choices: ChatCompletionChunkChoice[];
    usage?: UsageInfo;
}

export interface ModelObject {
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
}

export interface ModelListResponse {
    object: 'list';
    data: ModelObject[];
}

// --- Provider Spectrum & Catalog Types ---

export type ProviderCategory = 'custom' | 'oauth' | 'free_tier' | 'api_key';

export type ProviderProtocol = 'openai' | 'anthropic' | 'gemini' | 'custom';

export type ProviderStatusState = 'connected' | 'disconnected' | 'ready' | 'no_connections' | 'error';

export interface ProviderStatus {
    state: ProviderStatusState;
    message?: string;
    connectedCount?: number;
}

export interface ProviderDefinition {
    id: string;
    name: string;
    category: ProviderCategory;
    protocol: ProviderProtocol;
    description?: string;
    icon?: string;
    defaultBaseUrl?: string;
    requiresApiKey: boolean;
    requiresOAuth?: boolean;
    supportsCustomUrl?: boolean;
    status: ProviderStatus;
    models: ModelObject[];
}

export interface ProviderConfig {
    id: string;
    providerId: string;
    name: string;
    baseUrl?: string;
    apiKey?: string;
    accessToken?: string;
    customHeaders?: Record<string, string>;
    enabled: boolean;
    createdAt: number;
}

// --- Anthropic Messages API Protocol Types ---

export interface AnthropicContentBlock {
    type: 'text' | 'image' | 'tool_use' | 'tool_result';
    text?: string;
    source?: {
        type: 'base64';
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
    role: 'user' | 'assistant';
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
    type: 'message';
    role: 'assistant';
    content: AnthropicContentBlock[];
    model: string;
    stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
    stop_sequence?: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

export interface AIProvider {
    id: string;
    name: string;
    category?: ProviderCategory;
    protocol?: ProviderProtocol;
    listModels(): Promise<ModelObject[]>;
    chatCompletion(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    chatCompletionStream(
        req: ChatCompletionRequest
    ): AsyncGenerator<ChatCompletionChunk, void, void>;
}
