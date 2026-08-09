import { Hono } from "hono";
import { ChatCompletionRequestSchema } from "@srouter/types";
import { ChatController } from "@/controllers/chat.controller.js";
import { validateJson } from "@/middleware/validator.js";

export const chatRoute = new Hono();

// POST /v1/chat/completions with Zod validation middleware
chatRoute.post("/chat/completions", validateJson(ChatCompletionRequestSchema), ChatController.createCompletion);
