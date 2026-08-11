import { useMatches } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
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

    return (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
            <SidebarTrigger />

            <Separator orientation="vertical" className="h-5" />

            <Breadcrumb className="min-w-0">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>{title}</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden sm:block" />
                    <BreadcrumbItem className="hidden sm:block">
                        <BreadcrumbPage className="text-muted">SRouter Gateway</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-3">
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    className="flex size-8 items-center justify-center rounded-md border border-border bg-surface-2 text-muted transition-colors hover:text-foreground"
                >
                    {theme === "dark" ? (
                        <Sun className="size-4" strokeWidth={1.75} />
                    ) : (
                        <Moon className="size-4" strokeWidth={1.75} />
                    )}
                </button>
            </div>
        </header>
    );
}
