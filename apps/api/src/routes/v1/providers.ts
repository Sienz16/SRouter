import { Hono } from "hono";
import { ProvidersController } from "@/controllers/providers.controller.js";
import { adminAuth } from "@/middleware/adminAuth.js";

export const providersRoute = new Hono();
providersRoute.use("/*", adminAuth);

// GET /v1/providers - Flat list of all provider definitions
providersRoute.get("/providers", ProvidersController.listProviders);

// GET /v1/providers/catalog - Grouped by categories
providersRoute.get("/providers/catalog", ProvidersController.getCatalog);

// POST /v1/providers/verify - Verify / test connection & API key
providersRoute.post("/providers/verify", ProvidersController.verifyProvider);

// GET /v1/providers/:providerId - Get single provider details
providersRoute.get("/providers/:providerId", ProvidersController.getProvider);

// POST /v1/providers - Add / Configure a new provider
providersRoute.post("/providers", ProvidersController.addProvider);

// DELETE /v1/providers/:id - Delete a saved provider connection
providersRoute.delete("/providers/:id", ProvidersController.deleteProvider);
