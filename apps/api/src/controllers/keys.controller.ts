import type { Context } from "hono";
import type { CreateAPIKeyZod } from "@srouter/types";
import { KeysLogic } from "@/logic/keys.logic.js";

export class KeysController {
    public static listKeys(c: Context): Response {
        const keys = KeysLogic.listAPIKeys();
        return c.json({
            object: "list",
            data: keys,
        });
    }

    public static createKey(c: Context): Response {
        const body = c.req.valid("json" as never) as CreateAPIKeyZod;
        const newKey = KeysLogic.generateAPIKey(body);
        return c.json(newKey, 201);
    }

    public static deleteKey(c: Context): Response {
        const id = c.req.param("id");
        if (!id) {
            return c.json({ error: { message: "API key ID is required" } }, 400);
        }
        const deleted = KeysLogic.removeAPIKey(id);
        if (!deleted) {
            return c.json({ error: { message: "API key not found" } }, 404);
        }
        return c.json({ success: true, id });
    }
}
