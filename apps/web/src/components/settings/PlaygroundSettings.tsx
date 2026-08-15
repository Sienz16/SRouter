import { Terminal, Sparkles, Sliders, Radio, Code2, Bot, FileJson, PenTool } from "lucide-react";
import type { AppSettings } from "@/hooks/useSettings";
import { Switch } from "@/components/ui/switch";

interface PlaygroundSettingsProps {
    settings: AppSettings;
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

const SYSTEM_PROMPT_PRESETS = [
    {
        name: "General Assistant",
        icon: Bot,
        prompt: "You are a helpful, versatile, and precise AI assistant."
    },
    {
        name: "Senior Engineer",
        icon: Code2,
        prompt: "You are a senior full-stack software engineer. Provide robust, clean, idiomatic code with clear explanations and best practices."
    },
    {
        name: "JSON Extractor",
        icon: FileJson,
        prompt: "You are an automated data extractor. Always output raw, valid JSON only without markdown formatting or introductory text."
    },
    {
        name: "Technical Writer",
        icon: PenTool,
        prompt: "You are an expert technical writer. Explain complex engineering concepts clearly using concise metaphors and structured tables."
    }
];

export function PlaygroundSettings({ settings, updateSetting }: PlaygroundSettingsProps) {
    return (
        <div className="rounded-xl border border-border/80 bg-card p-5 space-y-6 shadow-2xs">
            <div>
                <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-foreground" />
                    <h2 className="text-sm font-bold text-foreground tracking-tight">
                        Playground & Model Defaults
                    </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Pre-populate default inference parameters when starting new sessions in the
                    SRouter Playground.
                </p>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-foreground flex items-center gap-1.5">
                        <Sliders className="size-3.5 text-muted-foreground" />
                        <span>Default Temperature</span>
                    </label>
                    <span className="font-mono font-bold tabular-nums text-foreground px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                        {settings.defaultTemperature.toFixed(2)}
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={settings.defaultTemperature}
                    onChange={(e) =>
                        updateSetting("defaultTemperature", parseFloat(e.target.value))
                    }
                    className="w-full accent-foreground cursor-pointer h-1.5 rounded-lg bg-muted appearance-none"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>0.0 (Deterministic / Code)</span>
                    <span>0.7 (Balanced)</span>
                    <span>2.0 (High Creativity)</span>
                </div>
            </div>

            {/* Top P Slider */}
            <div className="space-y-2 pt-5 border-t border-border/70">
                <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-muted-foreground" />
                        <span>Default Top P (Nucleus Sampling)</span>
                    </label>
                    <span className="font-mono font-bold tabular-nums text-foreground px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                        {settings.defaultTopP.toFixed(2)}
                    </span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.defaultTopP}
                    onChange={(e) => updateSetting("defaultTopP", parseFloat(e.target.value))}
                    className="w-full accent-foreground cursor-pointer h-1.5 rounded-lg bg-muted appearance-none"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>0.0 (Strict)</span>
                    <span>0.95 (Standard)</span>
                    <span>1.0 (Full Distribution)</span>
                </div>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-3 pt-5 border-t border-border/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <label className="text-xs font-bold text-foreground">
                            Default Max Output Tokens
                        </label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            Upper bound on tokens generated per single model completion.
                        </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground tabular-nums px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                        {settings.defaultMaxTokens.toLocaleString()} tokens
                    </span>
                </div>

                <div className="inline-flex items-center rounded-lg border border-border/80 bg-muted/40 p-1 font-mono gap-1">
                    {[1024, 2048, 4096, 8192, 16384].map((tokens) => {
                        const isActive = settings.defaultMaxTokens === tokens;
                        return (
                            <button
                                key={tokens}
                                type="button"
                                onClick={() => updateSetting("defaultMaxTokens", tokens)}
                                className={`rounded-md px-3 py-1.5 text-xs tabular-nums font-semibold transition-all cursor-pointer ${
                                    isActive
                                        ? "bg-background text-foreground shadow-xs border border-border/80 font-bold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                                }`}
                            >
                                {tokens >= 1000 ? `${tokens / 1024}k` : tokens}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stream Response Toggle */}
            <div className="flex items-center justify-between pt-5 border-t border-border/70 gap-4">
                <div className="space-y-0.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Radio className="size-3.5 text-muted-foreground" />
                        <span>Stream Completion Tokens by Default</span>
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                        Enable real-time token streaming animation in the playground chat window.
                    </p>
                </div>
                <Switch
                    checked={settings.streamResponse}
                    onCheckedChange={(val) => updateSetting("streamResponse", val)}
                />
            </div>

            {/* Default System Prompt */}
            <div className="space-y-3 pt-5 border-t border-border/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-foreground">
                        Default System Prompt
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                        Quick Preset Templates:
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SYSTEM_PROMPT_PRESETS.map(({ name, icon: Icon, prompt }) => (
                        <button
                            key={name}
                            type="button"
                            onClick={() => updateSetting("systemPromptDefault", prompt)}
                            className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background hover:bg-muted/60 p-2.5 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <Icon className="size-3.5 shrink-0 text-foreground" />
                            <span className="truncate">{name}</span>
                        </button>
                    ))}
                </div>

                <textarea
                    rows={3}
                    value={settings.systemPromptDefault}
                    onChange={(e) => updateSetting("systemPromptDefault", e.target.value)}
                    placeholder="Enter default system instructions..."
                    className="w-full rounded-lg border border-border/80 bg-background p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
        </div>
    );
}
