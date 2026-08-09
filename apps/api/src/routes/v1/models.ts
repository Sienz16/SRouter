import { Hono } from "hono";
import { ModelsController } from "@/controllers/models.controller.js";

export const modelsRoute = new Hono();

// GET /v1/models
modelsRoute.get("/models", ModelsController.listModels);

// GET /v1/models/:model
modelsRoute.get("/models/:model", ModelsController.getModelById);
