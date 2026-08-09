import type { Context } from "hono";
import type { ModelListResponse } from "@srouter/types";
import { ModelsLogic } from "../logic/models.logic.js";

export class ModelsController {
    public static async listModels(c: Context): Promise<Response> {
        const models = await ModelsLogic.getAllModels();
        const response: ModelListResponse = {
            object: "list",
            data: models,
        };
        return c.json(response);
    }

    public static async getModelById(c: Context): Promise<Response> {
        const modelId = c.req.param("model");
        if (!modelId) {
            return c.json(
                {
                    error: {
                        message: "Model ID parameter is required",
                        type: "invalid_request_error",
                    },
                },
                400,
            );
        }
        const model = await ModelsLogic.getModelById(modelId);

        if (!model) {
            return c.json(
                {
                    error: {
                        message: `Model '${modelId}' not found`,
                        type: "invalid_request_error",
                        code: "model_not_found",
                    },
                },
                404,
            );
        }

        return c.json(model);
    }
}
