import type { Context } from "hono";
import {
    getAllSettingsDB,
    getRequireApiKeyDB,
    setRequireApiKeyDB,
    setSettingDB,
} from "@srouter/db";
import { ok, err } from "@/utils/response.js";

export class SettingsController {
    public static getSettings(c: Context): Response {
        const requireApiKey = getRequireApiKeyDB();
        const all = getAllSettingsDB();
        return ok(c, {
            requireApiKey,
            settings: all,
        });
    }

    public static async updateSettings(c: Context): Promise<Response> {
        try {
            const body = await c.req.json();
            if (typeof body.requireApiKey === "boolean") {
                setRequireApiKeyDB(body.requireApiKey);
            }
            if (body.settings && typeof body.settings === "object") {
                for (const [key, value] of Object.entries(body.settings)) {
                    if (typeof value === "string") {
                        setSettingDB(key, value);
                    }
                }
            }
            const requireApiKey = getRequireApiKeyDB();
            const all = getAllSettingsDB();
            return ok(c, {
                message: "Settings updated successfully",
                requireApiKey,
                settings: all,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return err(c, errorMessage, 400);
        }
    }
}
