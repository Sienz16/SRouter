import { useState } from "react";
import { toast } from "sonner";

export interface AppSettings {
    // Appearance
    uiDensity: "compact" | "cozy";
    // Gateway
    requestTimeoutSec: number;
    autoRetryOn429: boolean;
    maxRetries: number;
    tokenRefreshLeadMin: number;
    // Logging & Privacy
    loggingLevel: "full" | "metadata" | "disabled";
    logRetentionDays: number;
    recordTokenUsage: boolean;
    // Playground Defaults
    defaultTemperature: number;
    defaultTopP: number;
    defaultMaxTokens: number;
    systemPromptDefault: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    uiDensity: "compact",
    requestTimeoutSec: 120,
    autoRetryOn429: true,
    maxRetries: 3,
    tokenRefreshLeadMin: 5,
    loggingLevel: "full",
    logRetentionDays: 30,
    recordTokenUsage: true,
    defaultTemperature: 0.7,
    defaultTopP: 0.95,
    defaultMaxTokens: 4096,
    systemPromptDefault: "You are a helpful and versatile AI assistant.",
};

const STORAGE_KEY = "srouter_app_settings";

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(() => {
        if (typeof window === "undefined") return DEFAULT_SETTINGS;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings((prev) => {
            const updated = { ...prev, [key]: value };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error("Failed to save settings to localStorage", e);
            }
            return updated;
        });
    };

    const resetToDefaults = () => {
        setSettings(DEFAULT_SETTINGS);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
            toast.success("Settings restored to defaults");
        } catch (e) {
            console.error("Failed to reset settings", e);
        }
    };

    const exportSettings = () => {
        const dataStr =
            "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute(
            "download",
            `srouter-settings-${new Date().toISOString().slice(0, 10)}.json`,
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("Settings configuration exported");
    };

    const clearPlaygroundHistory = () => {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (
                    k &&
                    (k.startsWith("srouter_playground_") ||
                        k.startsWith("srouter_chat_") ||
                        k.startsWith("srouter_messages_"))
                ) {
                    keysToRemove.push(k);
                }
            }
            for (const k of keysToRemove) {
                localStorage.removeItem(k);
            }
            toast.success("Playground chat sessions cleared");
        } catch {
            toast.error("Failed to clear playground history");
        }
    };

    return {
        settings,
        updateSetting,
        resetToDefaults,
        exportSettings,
        clearPlaygroundHistory,
    };
}
