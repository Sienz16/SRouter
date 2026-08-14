import { Hono } from "hono";
import { KeysController } from "@/controllers/keys.controller.js";

export const keysRoute = new Hono();

// GET /v1/keys - List all virtual API keys
keysRoute.get("/keys", KeysController.listKeys);

// POST /v1/keys - Generate a new virtual API key
keysRoute.post("/keys", KeysController.createKey);

// DELETE /v1/keys/:id - Revoke & delete an API key
keysRoute.delete("/keys/:id", KeysController.deleteKey);
