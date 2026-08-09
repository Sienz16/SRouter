import { Hono } from "hono";
import { AuthController } from "@/controllers/auth.controller.js";

export const authRoute = new Hono();

export const handleOAuthCallback = AuthController.handleOAuthCallback;

// 1. GET /v1/auth/openai/login - Initiate OAuth PKCE Login Flow
authRoute.get("/auth/openai/login", AuthController.loginOpenAI);

// 2. GET & POST /v1/auth/openai/callback - OAuth Callback Receiver
authRoute.get("/auth/openai/callback", AuthController.handleOAuthCallback);
authRoute.post("/auth/openai/callback", AuthController.handleOAuthCallback);

// 3. POST /v1/auth/openai/token & POST /v1/auth/openai/import-token (9Router-style token import)
authRoute.post("/auth/openai/token", AuthController.importToken);
authRoute.post("/auth/openai/import-token", AuthController.importToken);
