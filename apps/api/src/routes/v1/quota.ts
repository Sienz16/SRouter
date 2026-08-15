import { Hono } from "hono";
import { QuotaController } from "@/controllers/quota.controller.js";
import { adminAuth } from "@/middleware/adminAuth.js";

export const quotaRoute = new Hono();
quotaRoute.use("/*", adminAuth);

// GET /v1/quota and /v1/qouta - Fetch key quota & usage stats
quotaRoute.get("/quota", QuotaController.getQuota);
quotaRoute.get("/qouta", QuotaController.getQuota);
