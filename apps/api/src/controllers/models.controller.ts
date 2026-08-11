import type { Context } from "hono";
import type { ModelListResponse } from "@srouter/types";
import { ModelsLogic } from "@/logic/models.logic.js";
import { err, ok } from "@/utils/response.js";

export class ModelsController {
    public static async listModels(c: Context): Promise<Response> {
        const models = await ModelsLogic.getAllModels();
        const response: ModelListResponse = {
            object: "list",
            data: models,
        };
        return ok(c, response);
    }

    public static async getModelById(c: Context): Promise<Response> {
        const modelId = c.req.param("model");
        if (!modelId) {
            return err(c, "Model ID parameter is required", 400, {
                type: "invalid_request_error",
            });
        }

        const model = await ModelsLogic.getModelById(modelId);
        if (model) {
            return ok(c, model);
        }

        return err(c, `Model '${modelId}' not found`, 404, {
            type: "invalid_request_error",
            code: "model_not_found",
        });
    }
}
