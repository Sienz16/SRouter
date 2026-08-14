import { Hono } from "hono";
import { SettingsController } from "@/controllers/settings.controller.js";

export const settingsRoute = new Hono();

// GET /v1/settings
settingsRoute.get("/settings", SettingsController.getSettings);

// PATCH /v1/settings and POST /v1/settings
settingsRoute.patch("/settings", SettingsController.updateSettings);
settingsRoute.post("/settings", SettingsController.updateSettings);
