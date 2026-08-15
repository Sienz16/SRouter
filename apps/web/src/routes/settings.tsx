import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Activity,
    Check,
    Cpu,
    Database,
    Download,
    Eye,
    Globe,
    KeyRound,
    Lock,
    Moon,
    Palette,
    RefreshCw,
    RotateCcw,
    Server,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    Sun,
    Terminal,
    Trash2,
    Unlock,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import { api, getGatewayBaseUrl } from "@/lib/api";
import { useTheme } from "@/context/Theme";
import { useSettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/settings")({
    staticData: { title: "Settings" },
    component: SettingsPage
});

type SettingsTab =
    "security" | "gateway" | "appearance" | "logging" | "playground" | "data" | "system";

interface ServerSettingsResponse {
    requireApiKey: boolean;
    settings?: Record<string, string>;
}

function SettingsPage() {
    const queryClient = useQueryClient();
    const { theme, toggleTheme } = useTheme();
    const { settings, updateSetting, resetToDefaults, exportSettings, clearPlaygroundHistory } =
        useSettings();
    const apiBase = getGatewayBaseUrl();

    const [activeTab, setActiveTab] = useState<SettingsTab>("security");

    // Fetch server settings from /v1/settings
    const { data: serverSettings, isLoading: isSettingsLoading } = useQuery<ServerSettingsResponse>(
        {
            queryKey: ["server_settings"],
            queryFn: () => api.get<ServerSettingsResponse>("/v1/settings")
        }
    );

    const [requireApiKey, setRequireApiKey] = useState<boolean>(false);

    useEffect(() => {
        if (serverSettings && typeof serverSettings.requireApiKey === "boolean") {
            setRequireApiKey(serverSettings.requireApiKey);
        }
    }, [serverSettings]);

    // Mutation to update server settings
    const updateServerMutation = useMutation({
        mutationFn: (newRequireApiKey: boolean) =>
            api.post("/v1/settings", { requireApiKey: newRequireApiKey }),
        onSuccess: (_data, newRequireApiKey) => {
            queryClient.invalidateQueries({ queryKey: ["server_settings"] });
            toast.success(
                newRequireApiKey
                    ? "API Key Authentication is now REQUIRED"
                    : "API Key Authentication is now OPTIONAL (Open Access)",
                {
                    description: newRequireApiKey
                        ? "Gateway endpoints will reject unauthenticated requests with HTTP 401."
                        : "Public access enabled for localhost development and clients."
                }
            );
        },
        onError: (err) => {
            toast.error("Failed to update security setting", {
                description: err instanceof Error ? err.message : "Unknown error"
            });
        }
    });

    const handleToggleRequireApiKey = (value: boolean) => {
        setRequireApiKey(value);
        updateServerMutation.mutate(value);
    };

    const tabs: { id: SettingsTab; label: string; icon: typeof Palette }[] = [
        { id: "security", label: "Security & API Key", icon: KeyRound },
        { id: "gateway", label: "Gateway & Proxy", icon: Server },
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "logging", label: "Logging & Privacy", icon: Shield },
        { id: "playground", label: "Playground Defaults", icon: Terminal },
        { id: "data", label: "Data & Storage", icon: Database },
        { id: "system", label: "System Info", icon: Cpu }
    ];

    return (
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-6 font-mono">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--line)] pb-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">
                            Settings
                        </h1>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border border-[var(--line)] bg-[var(--field)] text-[var(--ink-2)]">
                            Preferences
                        </span>
                    </div>
                    <p className="text-xs text-[var(--ink-3)]">
                        Manage gateway routing rules, API key authentication requirements, telemetry
                        logging, and UI preferences.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={exportSettings}
                        className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--field)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition-colors cursor-pointer shadow-2xs"
                    >
                        <Download className="size-3.5" />
                        <span>Export Config</span>
                    </button>
                    <button
                        type="button"
                        onClick={resetToDefaults}
                        className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--field)] px-3 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
                    >
                        <RotateCcw className="size-3.5" />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Layout: Sidebar Tabs + Content Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Navigation Tabs */}
                <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-xs font-semibold transition-all text-left whitespace-nowrap cursor-pointer ${
                                activeTab === id
                                    ? "bg-[var(--ink)] text-[var(--canvas)] shadow-xs"
                                    : "text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--field)]"
                            }`}
                        >
                            <Icon className="size-3.5 shrink-0" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Settings Card */}
                <div className="md:col-span-3 space-y-4">
                    {/* 1. SECURITY & API KEY REQUIREMENT */}
                    {activeTab === "security" && (
                        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-6 shadow-2xs">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                                    <KeyRound className="size-4 text-amber-500" />
                                    <span>API Key & Authentication Enforcement</span>
                                </h3>
                                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                                    Control whether external clients must provide a Bearer API Key
                                    to access `/v1/chat/completions`.
                                </p>
                            </div>

                            {/* Main Toggle Box */}
                            <div className="rounded-[10px] border border-[var(--line)] bg-[var(--field)]/40 p-4 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3.5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-[var(--ink)]">
                                                Require API Key (Bearer Auth)
                                            </span>
                                            {requireApiKey ? (
                                                <span className="inline-flex items-center gap-1 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <ShieldCheck className="size-3" />
                                                    <span>Enforced (Protected)</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-[4px] border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                    <Unlock className="size-3" />
                                                    <span>Open Access (Optional)</span>
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-[var(--ink-3)] leading-relaxed">
                                            {requireApiKey
                                                ? "Gateway will reject all requests that do not provide a valid virtual SRouter key in the 'Authorization: Bearer <key>' header."
                                                : "Anyone can send requests to SRouter without providing an API key. (Ideal for local development, Cursor/VSCode, or trusted networks)."}
                                        </p>
                                    </div>

                                    {/* Action Switch Buttons */}
                                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] p-1 shadow-2xs">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleRequireApiKey(false)}
                                            className={`flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-xs transition-all cursor-pointer ${
                                                !requireApiKey
                                                    ? "bg-[var(--ink)] text-[var(--canvas)] font-bold shadow-xs"
                                                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                                            }`}
                                        >
                                            <Unlock className="size-3" />
                                            <span>Disabled</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleRequireApiKey(true)}
                                            className={`flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-xs transition-all cursor-pointer ${
                                                requireApiKey
                                                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                                                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                                            }`}
                                        >
                                            <Lock className="size-3" />
                                            <span>Required</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Guidance Box */}
                                <div className="text-xs space-y-2 text-[var(--ink-2)]">
                                    <div className="font-bold text-[11px] uppercase tracking-wider text-[var(--ink-3)]">
                                        Client Request Example:
                                    </div>
                                    <div className="rounded-[6px] bg-[var(--surface)] border border-[var(--line)] p-2.5 font-mono text-[11px] text-[var(--ink)] overflow-x-auto select-all">
                                        curl {apiBase}/chat/completions \<br />
                                        {requireApiKey ? (
                                            <span className="text-emerald-500 font-semibold">
                                                {"  "}-H "Authorization: Bearer
                                                sr-live-your_key_here" \<br />
                                            </span>
                                        ) : (
                                            <span className="text-[var(--ink-3)]">
                                                {"  "}# Authorization header is optional in Open
                                                Access mode
                                                <br />
                                            </span>
                                        )}
                                        {"  "}-H "Content-Type: application/json" \<br />
                                        {"  "}-d '
                                        {
                                            '{"model": "antigravity/gemini-2.5-flash", "messages": [{"role": "user", "content": "Hi!"}]}'
                                        }
                                        '
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. GATEWAY & PROXY */}
                    {activeTab === "gateway" && (
                        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-6 shadow-2xs">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--ink)]">
                                    Gateway & Proxy Configuration
                                </h3>
                                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                                    Upstream timeout, retry mechanics, and token refresh schedules.
                                </p>
                            </div>

                            {/* Global Request Timeout */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--ink)]">
                                    Request Timeout (Seconds)
                                </label>
                                <p className="text-[11px] text-[var(--ink-3)]">
                                    Maximum duration the gateway will wait for upstream LLM response
                                    streaming.
                                </p>
                                <div className="flex items-center gap-2">
                                    {[30, 60, 120, 300].map((sec) => (
                                        <button
                                            key={sec}
                                            type="button"
                                            onClick={() => updateSetting("requestTimeoutSec", sec)}
                                            className={`rounded-[6px] border px-3 py-1.5 text-xs tabular-nums transition-all cursor-pointer ${
                                                settings.requestTimeoutSec === sec
                                                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--canvas)] font-bold"
                                                    : "border-[var(--line)] bg-[var(--field)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                                            }`}
                                        >
                                            {sec}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto Retry on Rate Limit (429) */}
                            <div className="space-y-3 pt-4 border-t border-[var(--line)]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-[var(--ink)]">
                                            Auto-Retry on Rate Limit (HTTP 429)
                                        </div>
                                        <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                                            Automatically retry with exponential backoff if upstream
                                            returns rate limited.
                                        </p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoRetryOn429}
                                        onChange={(e) =>
                                            updateSetting("autoRetryOn429", e.target.checked)
                                        }
                                        className="size-4 accent-amber-500 rounded cursor-pointer"
                                    />
                                </div>

                                {settings.autoRetryOn429 && (
                                    <div className="flex items-center gap-2 pt-2 text-xs">
                                        <span className="text-[var(--ink-3)]">Max Retries:</span>
                                        {[1, 2, 3, 5].map((retries) => (
                                            <button
                                                key={retries}
                                                type="button"
                                                onClick={() => updateSetting("maxRetries", retries)}
                                                className={`rounded-[4px] border px-2 py-0.5 text-xs tabular-nums transition-all cursor-pointer ${
                                                    settings.maxRetries === retries
                                                        ? "border-amber-500 bg-amber-500/10 text-amber-500 font-bold"
                                                        : "border-[var(--line)] bg-[var(--field)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                                                }`}
                                            >
                                                {retries}x
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Token Refresh Lead Time */}
                            <div className="space-y-2 pt-4 border-t border-[var(--line)]">
                                <label className="text-xs font-bold text-[var(--ink)]">
                                    OAuth Token Refresh Lead Time
                                </label>
                                <p className="text-[11px] text-[var(--ink-3)]">
                                    Background worker will refresh tokens N minutes before
                                    expiration.
                                </p>
                                <div className="flex items-center gap-2">
                                    {[2, 5, 10, 15].map((min) => (
                                        <button
                                            key={min}
                                            type="button"
                                            onClick={() =>
                                                updateSetting("tokenRefreshLeadMin", min)
                                            }
                                            className={`rounded-[6px] border px-3 py-1.5 text-xs tabular-nums transition-all cursor-pointer ${
                                                settings.tokenRefreshLeadMin === min
                                                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--canvas)] font-bold"
                                                    : "border-[var(--line)] bg-[var(--field)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                                            }`}
                                        >
                                            {min} min
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. APPEARANCE */}
                    {activeTab === "appearance" && (
                        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-6 shadow-2xs">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--ink)]">
                                    Appearance & Theme
                                </h3>
                                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                                    Customize visual theme, color palette, and component density.
                                </p>
                            </div>

                            {/* Theme Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--ink)]">
                                    Color Theme
                                </label>
                                <div className="grid grid-cols-2 gap-3 max-w-sm">
                                    <button
                                        type="button"
                                        onClick={(e) => theme !== "dark" && toggleTheme(e)}
                                        className={`flex items-center gap-2.5 rounded-[8px] border p-3 text-xs transition-all cursor-pointer ${
                                            theme === "dark"
                                                ? "border-amber-500 bg-[var(--field)] text-[var(--ink)] font-bold shadow-xs"
                                                : "border-[var(--line)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                                        }`}
                                    >
                                        <Moon className="size-4 text-amber-500" />
                                        <span>Dark Mode</span>
                                        {theme === "dark" && (
                                            <Check className="size-3.5 ml-auto text-amber-500" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => theme !== "light" && toggleTheme(e)}
                                        className={`flex items-center gap-2.5 rounded-[8px] border p-3 text-xs transition-all cursor-pointer ${
                                            theme === "light"
                                                ? "border-amber-500 bg-[var(--field)] text-[var(--ink)] font-bold shadow-xs"
                                                : "border-[var(--line)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                                        }`}
                                    >
                                        <Sun className="size-4 text-amber-500" />
                                        <span>Light Mode</span>
                                        {theme === "light" && (
                                            <Check className="size-3.5 ml-auto text-amber-500" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* UI Density */}
                            <div className="space-y-2 pt-4 border-t border-[var(--line)]">
                                <label className="text-xs font-bold text-[var(--ink)]">
                                    UI Layout Density
                                </label>
                                <p className="text-[11px] text-[var(--ink-3)]">
                                    Adjust vertical padding and table row spacing.
                                </p>
                                <div className="flex items-center gap-3">
                                    {(["compact", "cozy"] as const).map((density) => (
                                        <button
                                            key={density}
                                            type="button"
                                            onClick={() => updateSetting("uiDensity", density)}
                                            className={`rounded-[6px] border px-3 py-1.5 text-xs capitalize transition-all cursor-pointer ${
                                                settings.uiDensity === density
                                                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--canvas)] font-bold"
                                                    : "border-[var(--line)] bg-[var(--field)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                                            }`}
                                        >
                                            {density}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. LOGGING & PRIVACY */}
                    {activeTab === "logging" && (
                        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-6 shadow-2xs">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--ink)]">
                                    Logging & Privacy
                                </h3>
                                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                                    Audit logging granularity and data retention in SQLite.
                                </p>
                            </div>

                            {/* Logging Level */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--ink)]">
                                    Payload Logging Level
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                        {
                                            id: "full",
                                            title: "Full Body",
                                            desc: "Log messages & responses"
                                        },
                                        {
                                            id: "metadata",
                                            title: "Metadata Only",
                                            desc: "Model, latency, tokens"
                                        },
                                        {
                                            id: "disabled",
                                            title: "Disabled",
                                            desc: "Do not write request logs"
                                        }
                                    ].map(({ id, title, desc }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => updateSetting("loggingLevel", id as any)}
                                            className={`flex flex-col text-left p-3 rounded-[8px] border transition-all cursor-pointer ${
                                                settings.loggingLevel === id
                                                    ? "border-[var(--ink)] bg-[var(--field)] text-[var(--ink)] font-bold shadow-xs"
                                                    : "border-[var(--line)] text-[var(--ink-3)] hover:text-[var(--ink)]"
                                            }`}
                                        >
                                            <span className="text-xs font-bold">{title}</span>
                                            <span className="text-[10px] text-[var(--ink-3)] mt-0.5">
                                                {desc}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Log Retention */}
                            <div className="space-y-2 pt-4 border-t border-[var(--line)]">
                                <label className="text-xs font-bold text-[var(--ink)]">
                                    Log Retention Window
                                </label>
                                <p className="text-[11px] text-[var(--ink-3)]">
                                    Logs older than this threshold will be pruned automatically.
                                </p>
                                <div className="flex items-center gap-2">
                                    {[7, 30, 90, 365].map((days) => (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => updateSetting("logRetentionDays", days)}
                                            className={`rounded-[6px] border px-3 py-1.5 text-xs tabular-nums transition-all cursor-pointer ${
                                                settings.logRetentionDays === days
                                                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--canvas)] font-bold"
                                                    : "border-[var(--line)] bg-[var(--field)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                                            }`}
                                        >
                                            {days === 365 ? "1 Year" : `${days} Days`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. PLAYGROUND DEFAULTS */}
                    {activeTab === "playground" && (
                        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-6 shadow-2xs">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--ink)]">
                                    Playground Defaults
                                </h3>
                                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                                    Default parameters applied when initiating new playground
                                    sessions.
                                </p>
                            </div>

                            {/* Temperature Slider */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <label className="font-bold text-[var(--ink)]">
                                        Default Temperature
                                    </label>
                                    <span className="font-bold tabular-nums text-amber-500">
                                        {settings.defaultTemperature}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.05"
                                    value={settings.defaultTemperature}
                                    onChange={(e) =>
                                        updateSetting(
                                            "defaultTemperature",
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full accent-amber-500 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-[var(--ink-3)]">
                                    <span>0.0 (Precise)</span>
                                    <span>1.0 (Balanced)</span>
                                    <span>2.0 (Creative)</span>
                                </div>
                            </div>

                            {/* Max Tokens */}
                            <div className="space-y-2 pt-4 border-t border-[var(--line)]">
                                <label className="text-xs font-bold text-[var(--ink)]">
                                    Default Max Output Tokens
                                </label>
                                <div className="flex items-center gap-2">
                                    {[2048, 4096, 8192, 16384].map((tokens) => (
                                        <button
                                            key={tokens}
                                            type="button"
                                            onClick={() =>
                                                updateSetting("defaultMaxTokens", tokens)
                                            }
                                            className={`rounded-[6px] border px-3 py-1.5 text-xs tabular-nums transition-all cursor-pointer ${
                                                settings.defaultMaxTokens === tokens
                                                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--canvas)] font-bold"
                                                    : "border-[var(--line)] bg-[var(--field)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                                            }`}
                                        >
                                            {tokens.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Default System Prompt */}
                            <div className="space-y-2 pt-4 border-t border-[var(--line)]">
                                <label className="text-xs font-bold text-[var(--ink)]">
                                    Default System Prompt
                                </label>
                                <textarea
                                    rows={3}
                                    value={settings.systemPromptDefault}
                                    onChange={(e) =>
                                        updateSetting("systemPromptDefault", e.target.value)
                                    }
                                    className="w-full rounded-[6px] border border-[var(--line)] bg-[var(--field)] p-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* 6. DATA & STORAGE */}
                    {activeTab === "data" && (
                        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-6 shadow-2xs">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--ink)]">
                                    Data & Storage Management
                                </h3>
                                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                                    Export system state or purge locally cached sessions.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3.5 rounded-[8px] border border-[var(--line)] bg-[var(--field)]/30">
                                    <div>
                                        <div className="text-xs font-bold text-[var(--ink)]">
                                            Clear Playground Chat History
                                        </div>
                                        <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                                            Remove all locally stored playground conversations and
                                            messages.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearPlaygroundHistory}
                                        className="inline-flex items-center gap-1 rounded-[6px] border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="size-3" />
                                        <span>Clear History</span>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3.5 rounded-[8px] border border-[var(--line)] bg-[var(--field)]/30">
                                    <div>
                                        <div className="text-xs font-bold text-[var(--ink)]">
                                            Export Configuration Backup
                                        </div>
                                        <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
                                            Download all active preferences as a JSON archive.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={exportSettings}
                                        className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--hover)] transition-colors cursor-pointer"
                                    >
                                        <Download className="size-3" />
                                        <span>Export JSON</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. SYSTEM INFO */}
                    {activeTab === "system" && (
                        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-6 shadow-2xs">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--ink)]">
                                    System Diagnostics & Runtime
                                </h3>
                                <p className="text-xs text-[var(--ink-3)] mt-0.5">
                                    Underlying runtime environment and gateway architecture.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 rounded-[8px] border border-[var(--line)] bg-[var(--field)]/30 space-y-1">
                                    <span className="text-[10.5px] text-[var(--ink-3)]">
                                        SRouter Gateway
                                    </span>
                                    <div className="font-bold text-[var(--ink)]">
                                        v0.1.0-beta (Beta Core)
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-[8px] border border-[var(--line)] bg-[var(--field)]/30 space-y-1">
                                    <span className="text-[10.5px] text-[var(--ink-3)]">
                                        Database Engine
                                    </span>
                                    <div className="font-bold text-[var(--ink)]">
                                        SQLite WAL Mode (Local Embedded)
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-[8px] border border-[var(--line)] bg-[var(--field)]/30 space-y-1">
                                    <span className="text-[10.5px] text-[var(--ink-3)]">
                                        Gateway Protocol
                                    </span>
                                    <div className="font-bold text-emerald-500 flex items-center gap-1.5">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>OpenAI v1 Compatible SSE</span>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-[8px] border border-[var(--line)] bg-[var(--field)]/30 space-y-1">
                                    <span className="text-[10.5px] text-[var(--ink-3)]">
                                        Server Engine
                                    </span>
                                    <div className="font-bold text-[var(--ink)]">
                                        Hono API Framework (Node.js / Bun)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
