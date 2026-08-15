import { useMatches } from "@tanstack/react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/context/Theme";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/lib/api";

function usePageTitle(): string {
    const matches = useMatches();
    const match = [...matches].reverse().find((item) => item.staticData?.title);
    return (match?.staticData?.title as string | undefined) ?? "Dashboard";
}

export function Topbar() {
    const title = usePageTitle();
    const { theme, toggleTheme } = useTheme();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        setIsLoggingOut(true);
        try {
            await api.post<void>("/v1/admin/logout");
            window.location.reload();
        } catch {
            // An expired session should still return the user to the login screen.
            window.location.reload();
        } finally {
            setIsLoggingOut(false);
        }
    }

    return (
        <header className="sticky top-0 z-30 flex h-12 min-h-12 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background px-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="size-7 rounded-none text-muted-foreground outline-offset-0 hover:bg-transparent hover:text-foreground focus-visible:ring-1" />
                <h1 className="truncate text-xs font-semibold text-foreground">{title}</h1>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={(event) => toggleTheme(event)}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    className="rounded-none text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                    {theme === "dark" ? <Sun /> : <Moon />}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => void handleLogout()}
                    disabled={isLoggingOut}
                    aria-label="Sign out"
                    className="rounded-none text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                    <LogOut />
                </Button>
            </div>
        </header>
    );
}
