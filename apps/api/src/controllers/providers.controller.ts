import type { Context } from "hono";
import { ProvidersLogic } from "@/logic/providers.logic.js";

export class ProvidersController {
    public static listProviders(c: Context): Response {
        const catalog = ProvidersLogic.listProviders();
        return c.json({
            object: "list",
            data: catalog,
        });
    }

    public static getCatalog(c: Context): Response {
        const summary = ProvidersLogic.getCatalog();
        return c.json(summary);
    }
}
