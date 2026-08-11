import { useState } from "react";
import { useMatches } from "@tanstack/react-router";
import { Check, Copy, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/lib/theme";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

function usePageTitle(): string {
    const matches = useMatches();
    const match = [...matches].reverse().find((m) => m.staticData?.title);
    return (match?.staticData?.title as string | undefined) ?? "Dashboard";
}

export function Topbar() {
    const title = usePageTitle();
    const { theme, toggleTheme } = useTheme();
    const [copied, setCopied] = useState(false);

    const apiBaseUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/v1`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(apiBaseUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="size-8 rounded border border-border/60 hover:bg-secondary" />

                <Separator orientation="vertical" className="h-4 bg-border/60" />

                <Breadcrumb className="min-w-0">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-semibold text-foreground tracking-tight text-xs uppercase">
                                {title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 rounded border border-border/60 bg-secondary/40 px-2.5 py-1 text-xs">
                    <span className="text-[11px] text-muted-foreground">Endpoint:</span>
                    <code className="font-mono text-[11px] text-foreground font-medium">{apiBaseUrl}</code>
                    <button
                        type="button"
                        onClick={() => void handleCopy()}
                        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy Endpoint"
                    >
                        {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    </button>
                </div>

                <motion.button
                    type="button"
                    onClick={(e) => toggleTheme(e)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    className="relative flex size-8 items-center justify-center rounded border border-border/70 bg-secondary/40 text-muted-foreground transition-colors hover:text-foreground overflow-hidden"
                >

                    <AnimatePresence mode="wait" initial={false}>
                        {theme === "dark" ? (
                            <motion.div
                                key="sun"
                                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="flex items-center justify-center"
                            >
                                <Sun className="size-3.5 text-amber-400" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="moon"
                                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="flex items-center justify-center"
                            >
                                <Moon className="size-3.5 text-indigo-500" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </header>
    );
}



