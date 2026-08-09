import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authRoute } from "./routes/v1/auth.js";
import { chatRoute } from "./routes/v1/chat.js";
import { keysRoute } from "./routes/v1/keys.js";
import { logsRoute } from "./routes/v1/logs.js";
import { modelsRoute } from "./routes/v1/models.js";
import { providersRoute } from "./routes/v1/providers.js";

const app = new Hono();

// Health check endpoint
app.get("/", (c) => {
    return c.json({
        name: "SRouter API",
        status: "ok",
        version: "1.0.0",
        documentation:
            "Multi-Provider OpenAI & Anthropic Compatible LLM Gateway",
    });
});

app.get("/health", (c) => {
    return c.json({ status: "ok" });
});

// Mount OpenAI & Anthropic v1 API routes
app.route("/v1", modelsRoute);
app.route("/v1", chatRoute);
app.route("/v1", providersRoute);
app.route("/v1", keysRoute);
app.route("/v1", logsRoute);
app.route("/v1", authRoute);

const port = Number(process.env.PORT) || 3000;

serve(
    {
        fetch: app.fetch,
        port,
    },
    (info) => {
        console.log(
            `🚀 SRouter API Server running at http://localhost:${info.port}`,
        );
    },
);

export default app;
