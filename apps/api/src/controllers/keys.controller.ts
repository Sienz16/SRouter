import type { Context } from "hono";
import type { CreateAPIKeyZod } from "@srouter/types";
import { KeysLogic } from "@/logic/keys.logic.js";
import { err, ok } from "@/utils/response.js";

export class KeysController {
    public static listKeys(c: Context): Response {
        const keys = KeysLogic.listAPIKeys();
        return ok(c, {
            object: "list",
            data: keys,
        });
    }

    public static createKey(c: Context): Response {
        const body = c.req.valid("json" as never) as CreateAPIKeyZod;
        const newKey = KeysLogic.generateAPIKey(body);
        return ok(c, newKey, 201);
    }

    public static deleteKey(c: Context): Response {
        const id = c.req.param("id");
        if (!id) {
            return err(c, "API key ID is required", 400, { type: "invalid_request_error" });
        }
        const deleted = KeysLogic.removeAPIKey(id);
        if (!deleted) {
            return err(c, "API key not found", 404, { type: "invalid_request_error" });
        }
        return ok(c, { id });
    }
}
