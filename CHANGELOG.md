# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-beta] - 2026-08-15

### 🚀 Initial Public Beta Release

#### 🔀 AI Gateway & Protocol Routing

- **OpenAI & Anthropic Compatible Proxy**: Full support for `POST /v1/chat/completions`, `GET /v1/models`, and `GET /v1/models/:model`.
- **Server-Sent Events (SSE) Streaming**: Real-time streaming chunks with usage breakdown normalization and thinking/reasoning model delta preservation.
- **Protocol Translation**: Automatic bidirectional translation between OpenAI JSON Schema function definitions and Anthropic tools.

#### 🌐 Multi-Provider Catalog

- **Supported Upstreams**:
    - Google Antigravity (Gemini 2.5 Flash / Pro)
    - OpenAI Codex & ChatGPT (GPT-4o, o3-mini)
    - Anthropic Claude (Claude 3.7 Sonnet)
    - Neosantara AI
    - Kiro (Amazon Q / CodeWhisperer)
    - Command Code
- **Dynamic Model Discovery**: Direct upstream catalog polling without hardcoded model tables.
- **Provider Management**: Connect, configure, test, and manage upstream accounts.

#### 🔄 Token Sweeper & OAuth PKCE

- **Embedded OAuth Callback Server**: Dedicated listener on port `1455` for seamless browser PKCE authorization.
- **Automated Sweeper**: 60-second periodic background daemon refreshing expiring OAuth tokens with lead time guarantees.

#### 📊 Live Quotas & Limits (`/quota`)

- **Real-Time Telemetry**: Visual progress bars with status badges (`ok`, `warning`, `exhausted`).
- **Reset Countdown Timers**: Localized human-readable reset timestamps.
- **Collapsible Provider Cards**: Per-account cards with individual sync and global expand/collapse.

#### 🔑 Virtual API Keys & Security (`/keys`, `/settings`)

- **Virtual Client Keys**: Secure `sr-live-...` keys for downstream clients with quota limits and usage tracking.
- **Enforced Security Mode**: Toggleable `Require API Key` gateway setting rejecting unauthorized requests with HTTP 401.
- **Open Access Mode**: Seamless unauthenticated access for local development and private sandboxes.

#### 🧪 Web Playground (`/playground`)

- **Interactive Chat Studio**: Multi-session tabs, parameter tuning (temperature, max tokens, system prompts).
- **Reasoning Visualization**: Collapsible thinking blocks for reasoning models.
- **One-Click Code Export**: Copy cURL, Python, TypeScript, and JSON snippets instantly.

#### 🎨 Editorial Minimalist UI

- **Modern Stack**: TanStack Table v8, TanStack Router, React 19, Tailwind CSS v4, Base UI.
- **Theme Transitions**: Dark/Light mode with View Transitions API.
- **Responsive Layout**: Fluid typography, Bento metric summaries, and sidebar navigation.
