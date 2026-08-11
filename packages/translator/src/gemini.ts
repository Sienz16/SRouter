import type { ChatCompletionRequest, ChatCompletionResponse } from "@srouter/types";

export interface GeminiContentPart {
    text: string;
}

export interface GeminiContent {
    role: string;
    parts: GeminiContentPart[];
}

export interface CloudCodePayload {
    model: string;
    request: {
        contents: GeminiContent[];
    };
}

export interface GeminiNativePayload {
    contents: GeminiContent[];
}

export function parseGeminiModelName(rawModel: string): string {
    let model = rawModel.includes("/") ? (rawModel.split("/")[1] ?? rawModel) : rawModel;
    if (model === "gemini-3.6-flash" || model === "gemini-3.5-flash" || model === "gemini-2.0-flash") {
        model = "gemini-2.5-flash";
    }
    return model;
}

export function buildGeminiContents(req: ChatCompletionRequest): GeminiContent[] {
    return req.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
    }));
}

// CloudCode (ya29 OAuth) uses { model, request: { contents } }; Gemini native uses bare { contents }.
export function buildGeminiBody(contents: GeminiContent[], modelName: string, token: string): CloudCodePayload | GeminiNativePayload {
    if (token.startsWith("ya29.")) {
        return { model: modelName, request: { contents } };
    }
    return { contents };
}

export function buildGeminiUrl(baseUrl: string, modelName: string, token: string): string {
    const cleanBaseUrl = baseUrl.replace(/\/openai$/, "");
    let url = `${cleanBaseUrl}/models/${modelName}:generateContent`;
    if (token.startsWith("AIzaSy")) {
        url += `?key=${token}`;
    }
    return url;
}

export interface GeminiRawResponse {
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
}

export function parseGeminiResponse(data: GeminiRawResponse): string {
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? data.responses?.[0]?.candidates?.[0]?.content?.parts?.[0]?.text ?? data.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export function geminiToOpenAIResponse(data: GeminiRawResponse, requestedModel: string): ChatCompletionResponse {
    const textResponse = parseGeminiResponse(data);
    return {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: requestedModel,
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
