import { Hono } from "hono";
import { ModelsController } from "@/controllers/models.controller.js";
import { apiKeyAuth } from "@/middleware/apiKeyAuth.js";

export const modelsRoute = new Hono();
modelsRoute.use("/*", apiKeyAuth);

// GET /v1/models
modelsRoute.get("/models", ModelsController.listModels);

// GET /v1/models/:model
modelsRoute.get("/models/:model", ModelsController.getModelById);
