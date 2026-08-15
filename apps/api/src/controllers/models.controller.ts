import type { Context } from "hono";
import type { ModelListResponse } from "@srouter/types";
import { ModelsLogic } from "@/logic/models.logic.js";
import { err, ok } from "@/utils/response.js";

export class ModelsController {
    public static async listModels(c: Context): Promise<Response> {
        const refreshParam = c.req.query("refresh") || c.req.query("force");
        const cacheControlReq = c.req.header("cache-control");
        const forceRefresh =
            refreshParam === "true" ||
            refreshParam === "1" ||
            cacheControlReq?.includes("no-cache") ||
            cacheControlReq?.includes("no-store");

        const models = await ModelsLogic.getAllModels(undefined, forceRefresh);
        const response: ModelListResponse = {
            object: "list",
            data: models
        };
        c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
        return ok(c, response);
    }

    public static async getModelById(c: Context): Promise<Response> {
        const rawModelId = c.req.param("model") || c.req.param("*");
        const modelId = rawModelId ? decodeURIComponent(rawModelId) : undefined;
        if (!modelId) {
            return err(c, "Model ID parameter is required", 400, {
                type: "invalid_request_error"
            });
        }

        const refreshParam = c.req.query("refresh") || c.req.query("force");
        const forceRefresh = refreshParam === "true" || refreshParam === "1";

        const model = await ModelsLogic.getModelById(modelId, forceRefresh);
        if (model) {
            c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
            return ok(c, model);
        }

        return err(c, `Model '${modelId}' not found`, 404, {
            type: "invalid_request_error",
            code: "model_not_found"
        });
    }
}
