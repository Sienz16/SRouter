import { Hono } from "hono";
import { registry } from "../../services/registry.js";

export const providersRoute = new Hono();

// GET /v1/providers - Flat list of all provider definitions
providersRoute.get("/providers", (c) => {
    const catalog = registry.getCatalog();
    return c.json({
        object: "list",
        data: catalog,
    });
});

// GET /v1/providers/catalog - Grouped by 9Router categories
providersRoute.get("/providers/catalog", (c) => {
    const catalog = registry.getCatalog();

    const grouped = {
        custom: catalog.filter((p) => p.category === "custom"),
        oauth: catalog.filter((p) => p.category === "oauth"),
        free_tier: catalog.filter((p) => p.category === "free_tier"),
        api_key: catalog.filter((p) => p.category === "api_key"),
    };

    return c.json({
        total: catalog.length,
        categories: grouped,
    });
});
