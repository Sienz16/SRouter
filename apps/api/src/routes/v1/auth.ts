import { Hono } from "hono";
import { AuthController } from "@/controllers/auth.controller.js";

export const authRoute = new Hono();

export const handleOAuthCallback = AuthController.handleOAuthCallback;
export const handleAntigravityOAuthCallback = AuthController.handleAntigravityOAuthCallback;
export const handleCommandCodeTokenImport = AuthController.importCommandCodeToken;
export const handleQoderOAuthCallback = AuthController.handleQoderOAuthCallback;

// --- OpenAI OAuth ---
// 1. GET /v1/auth/openai/login - Initiate OAuth PKCE Login Flow
authRoute.get("/auth/openai/login", AuthController.loginOpenAI);

// 2. GET & POST /v1/auth/openai/callback - OAuth Callback Receiver
authRoute.get("/auth/openai/callback", AuthController.handleOAuthCallback);
authRoute.post("/auth/openai/callback", AuthController.handleOAuthCallback);

// 3. POST /v1/auth/openai/token & POST /v1/auth/openai/import-token
authRoute.post("/auth/openai/token", AuthController.importToken);
authRoute.post("/auth/openai/import-token", AuthController.importToken);

// --- Antigravity OAuth ---
// 1. GET /v1/auth/antigravity/login - Initiate Antigravity OAuth PKCE Login Flow
authRoute.get("/auth/antigravity/login", AuthController.loginAntigravity);

// 2. GET & POST /v1/auth/antigravity/callback - Antigravity OAuth Callback Receiver
authRoute.get("/auth/antigravity/callback", AuthController.handleAntigravityOAuthCallback);
authRoute.post("/auth/antigravity/callback", AuthController.handleAntigravityOAuthCallback);

// 3. POST /v1/auth/antigravity/token & POST /v1/auth/antigravity/import-token
authRoute.post("/auth/antigravity/token", AuthController.importAntigravityToken);
authRoute.post("/auth/antigravity/import-token", AuthController.importAntigravityToken);

// --- CommandCode Provider (API key) ---
// 1. POST /v1/auth/commandcode/token & POST /v1/auth/commandcode/import-token
authRoute.post("/auth/commandcode/token", AuthController.importCommandCodeToken);
authRoute.post("/auth/commandcode/import-token", AuthController.importCommandCodeToken);

// --- Anthropic Provider (API key) ---
// 1. POST /v1/auth/anthropic/token & POST /v1/auth/anthropic/import-token
authRoute.post("/auth/anthropic/token", AuthController.importAnthropicToken);
authRoute.post("/auth/anthropic/import-token", AuthController.importAnthropicToken);

// --- GoRouter Provider (API key) ---
// 1. POST /v1/auth/gorouter/token & POST /v1/auth/gorouter/import-token
authRoute.post("/auth/gorouter/token", AuthController.importGoRouterToken);
authRoute.post("/auth/gorouter/import-token", AuthController.importGoRouterToken);

// --- BluesMinds Provider (API key) ---
// 1. POST /v1/auth/bluesminds/token & POST /v1/auth/bluesminds/import-token
authRoute.post("/auth/bluesminds/token", AuthController.importBluesMindsToken);
authRoute.post("/auth/bluesminds/import-token", AuthController.importBluesMindsToken);

// --- SeekAI Provider (API key) ---
// 1. POST /v1/auth/seekai/token & POST /v1/auth/seekai/import-token
authRoute.post("/auth/seekai/token", AuthController.importSeekAIToken);
authRoute.post("/auth/seekai/import-token", AuthController.importSeekAIToken);

// --- Qoder Provider (OAuth & PAT) ---
// 1. GET /v1/auth/qoder/login - Initiate Qoder OAuth PKCE Login Flow
authRoute.get("/auth/qoder/login", AuthController.loginQoder);

// 2. GET & POST /v1/auth/qoder/callback - Qoder OAuth Callback Receiver
authRoute.get("/auth/qoder/callback", AuthController.handleQoderOAuthCallback);
authRoute.post("/auth/qoder/callback", AuthController.handleQoderOAuthCallback);

// 3. GET & POST /v1/auth/qoder/poll - Device Flow Poll Receiver
authRoute.get("/auth/qoder/poll", AuthController.pollQoder);
authRoute.post("/auth/qoder/poll", AuthController.pollQoder);

// 4. POST /v1/auth/qoder/token & POST /v1/auth/qoder/import-token
authRoute.post("/auth/qoder/token", AuthController.importQoderToken);
authRoute.post("/auth/qoder/import-token", AuthController.importQoderToken);
