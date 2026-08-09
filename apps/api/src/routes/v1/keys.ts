import { Hono } from "hono";
import { CreateAPIKeySchema } from "@srouter/types";
import { KeysController } from "../../controllers/keys.controller.js";
import { validateJson } from "../../middleware/validator.js";

export const keysRoute = new Hono();

// GET /v1/keys - List all client API keys
keysRoute.get("/keys", KeysController.listKeys);

// POST /v1/keys - Generate a new client API key with Zod validation
keysRoute.post("/keys", validateJson(CreateAPIKeySchema), KeysController.createKey);

// DELETE /v1/keys/:id - Delete an API key
keysRoute.delete("/keys/:id", KeysController.deleteKey);
