import { Hono } from "hono";
import { createAPIKeyDB, deleteAPIKeyDB, getAllAPIKeysDB } from "@srouter/db";
import { CreateAPIKeySchema } from "@srouter/types";
import { validateJson } from "../../middleware/validator.js";

export const keysRoute = new Hono();

// GET /v1/keys - List all client API keys
keysRoute.get("/keys", (c) => {
    const keys = getAllAPIKeysDB();
    return c.json({
        object: "list",
        data: keys,
    });
});

// POST /v1/keys - Generate a new client API key with Zod validation
keysRoute.post("/keys", validateJson(CreateAPIKeySchema), (c) => {
    const body = c.req.valid("json");
    const newKey = createAPIKeyDB(body);
    return c.json(newKey, 201);
});

// DELETE /v1/keys/:id - Delete an API key
keysRoute.delete("/keys/:id", (c) => {
    const id = c.req.param("id");
    const deleted = deleteAPIKeyDB(id);
    if (!deleted) {
        return c.json({ error: { message: "API key not found" } }, 404);
    }
    return c.json({ success: true, id });
});
