import { Hono } from "hono";
import { LogsController } from "@/controllers/logs.controller.js";
import { adminAuth } from "@/middleware/adminAuth.js";

export const logsRoute = new Hono();
logsRoute.use("/*", adminAuth);

// GET /v1/logs - Get recent request logs
logsRoute.get("/logs", LogsController.listLogs);

// GET /v1/logs/stats - Get token usage summary & request count
logsRoute.get("/logs/stats", LogsController.getStats);
