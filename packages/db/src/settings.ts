import { db } from "./db.js";

export function getSettingDB(key: string, defaultValue = ""): string {
    const stmt = db.prepare("SELECT value FROM system_settings WHERE key = ?");
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : defaultValue;
}

export function setSettingDB(key: string, value: string): void {
    const stmt = db.prepare(`
        INSERT INTO system_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
}

export function getAllSettingsDB(): Record<string, string> {
    const stmt = db.prepare("SELECT key, value FROM system_settings");
    const rows = stmt.all() as Array<{ key: string; value: string }>;
    const result: Record<string, string> = {};
    for (const r of rows) {
        result[r.key] = r.value;
    }
    return result;
}

export function getRequireApiKeyDB(): boolean {
    const val = getSettingDB("require_api_key", "false");
    return val === "true" || val === "1";
}

export function setRequireApiKeyDB(required: boolean): void {
    setSettingDB("require_api_key", required ? "true" : "false");
}
