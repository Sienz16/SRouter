import {
    AnthropicProvider,
    MockProvider,
    OpenAIProvider,
    OpenRouterProvider,
    ProviderRegistry,
} from '@srouter/providers';

// Create a global ProviderRegistry instance with Mock fallback
export const registry = new ProviderRegistry(new MockProvider());

// Register OpenRouter Provider for live public model listing
registry.registerProvider(new OpenRouterProvider());

// Register OpenAI Provider if key is present
if (process.env.OPENAI_API_KEY) {
    registry.registerProvider(
        new OpenAIProvider({
            id: 'openai',
            name: 'OpenAI',
            apiKey: process.env.OPENAI_API_KEY,
            baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        })
    );
}

// Register Anthropic Provider if key is present
if (process.env.ANTHROPIC_API_KEY) {
    registry.registerProvider(
        new AnthropicProvider({
            id: 'anthropic',
            name: 'Anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY,
            baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
        })
    );
}
