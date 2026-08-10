import type { Context } from "hono";
import { ProvidersLogic } from "@/logic/providers.logic.js";
import { ok } from "@/utils/response.js";

export class ProvidersController {
    public static listProviders(c: Context): Response {
        const catalog = ProvidersLogic.listProviders();
        return ok(c, {
            object: "list",
            data: catalog,
        });
    }

    public static getCatalog(c: Context): Response {
        const summary = ProvidersLogic.getCatalog();
        return ok(c, summary);
    }
}
