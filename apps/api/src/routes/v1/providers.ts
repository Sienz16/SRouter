import { Hono } from "hono";
import { ProvidersController } from "@/controllers/providers.controller.js";

export const providersRoute = new Hono();

// GET /v1/providers - Flat list of all provider definitions
providersRoute.get("/providers", ProvidersController.listProviders);

// GET /v1/providers/catalog - Grouped by 9Router categories
providersRoute.get("/providers/catalog", ProvidersController.getCatalog);
