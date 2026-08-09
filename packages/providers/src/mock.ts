import type {
    AIProvider,
    ChatCompletionChunk,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ModelObject,
} from "@srouter/types";

export class MockProvider implements AIProvider {
    id = "mock";
    name = "Mock Provider";

    private models: ModelObject[] = [
        {
            id: "srouter-mock-gpt-4o",
            object: "model",
            created: Math.floor(Date.now() / 1000),
            owned_by: "srouter-mock",
        },
        {
            id: "srouter-mock-claude-3.5-sonnet",
            object: "model",
            created: Math.floor(Date.now() / 1000),
            owned_by: "srouter-mock",
        },
    ];

    async listModels(): Promise<ModelObject[]> {
        return this.models;
    }

    async chatCompletion(
        req: ChatCompletionRequest,
    ): Promise<ChatCompletionResponse> {
        const lastMessage = req.messages[req.messages.length - 1];
        const userPrompt =
            typeof lastMessage?.content === "string"
                ? lastMessage.content
                : JSON.stringify(lastMessage?.content ?? "");

        const responseText = `[SRouter Mock Response] Received your prompt: "${userPrompt}". Using model: ${req.model}`;

        return {
            id: `chatcmpl-${Math.random().toString(36).substring(2, 11)}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: req.model,
            choices: [
                {
                    index: 0,
                    message: {
                        role: "assistant",
                        content: responseText,
                    },
                    finish_reason: "stop",
                },
            ],
            usage: {
                prompt_tokens: Math.max(1, userPrompt.length / 4),
                completion_tokens: Math.max(1, responseText.length / 4),
                total_tokens:
                    Math.max(1, userPrompt.length / 4) +
                    Math.max(1, responseText.length / 4),
            },
        };
    }

    async *chatCompletionStream(
        req: ChatCompletionRequest,
    ): AsyncGenerator<ChatCompletionChunk, void, void> {
        const lastMessage = req.messages[req.messages.length - 1];
        const userPrompt =
            typeof lastMessage?.content === "string"
                ? lastMessage.content
                : JSON.stringify(lastMessage?.content ?? "");

        const responseText = `[SRouter Mock Stream] Response for prompt: "${userPrompt}" via model ${req.model}`;
        const completionId = `chatcmpl-${Math.random().toString(36).substring(2, 11)}`;
        const created = Math.floor(Date.now() / 1000);

        // 1. Initial role chunk
        yield {
            id: completionId,
            object: "chat.completion.chunk",
            created,
            model: req.model,
            choices: [
                {
                    index: 0,
                    delta: { role: "assistant" },
                    finish_reason: null,
                },
            ],
        };

        // 2. Stream tokens in small chunks
        const tokens = responseText.split(" ");
        for (let i = 0; i < tokens.length; i++) {
            const token = (i === 0 ? "" : " ") + tokens[i];
            yield {
                id: completionId,
                object: "chat.completion.chunk",
                created,
                model: req.model,
                choices: [
                    {
                        index: 0,
                        delta: { content: token },
                        finish_reason: null,
                    },
                ],
            };
        }

        // 3. Final stop chunk
        yield {
            id: completionId,
            object: "chat.completion.chunk",
            created,
            model: req.model,
            choices: [
                {
                    index: 0,
                    delta: {},
                    finish_reason: "stop",
                },
            ],
        };
    }
}
