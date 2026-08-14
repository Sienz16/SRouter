import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
    Bot,
    Boxes,
    ChevronDown,
    KeyRound,
    LayoutDashboard,
    ScrollText,
    Terminal,
    Zap,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { ProviderIcon } from "@/components/ProviderIcon";

const mainNavItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/playground", label: "Playground", icon: Terminal },
    { to: "/keys", label: "API Keys", icon: KeyRound },
] as const;

const providerCategories = [
    {
        category: "OAuth Session",
        items: [
            { providerId: "antigravity", label: "Google Antigravity" },
            { providerId: "openai_codex", label: "OpenAI ChatGPT" },
            { providerId: "anthropic", label: "Anthropic Claude" },
        ],
    },
    {
        category: "API Key",
        items: [
            { providerId: "neosantara", label: "Neosantara" },
            { providerId: "kiro", label: "Kiro" },
            { providerId: "commandcode", label: "Command Code" },
        ],
    },
] as const;

export function AppSidebar() {
    const routerState = useRouterState();
    const isProvidersPath = routerState.location.pathname.startsWith("/providers");
    const [isProvidersOpen, setIsProvidersOpen] = useState(true);

    return (
        <Sidebar collapsible="icon" className="border-r border-border/70 bg-sidebar font-mono">
            <SidebarHeader className="h-12 min-h-12 shrink-0 justify-center border-b border-border/70 p-0">
                <SidebarMenu className="items-center">
                    <SidebarMenuItem className="w-full">
                        <SidebarMenuButton
                            size="lg"
                            render={<Link to="/" aria-label="SRouter dashboard" />}
                            className="h-11 w-full rounded-none px-4 text-foreground hover:bg-transparent group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!"
                        >
                            <Zap className="size-4 shrink-0 fill-current" strokeWidth={1.75} />
                            <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
                                SRouter
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <nav aria-label="Primary navigation" className="space-y-5">
                    {/* Workspace Group */}
                    <SidebarGroup className="p-0">
                        <SidebarGroupLabel className="mb-1 h-6 rounded-none px-2 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                            Workspace
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-0.5">
                                {mainNavItems.map(({ to, label, icon: Icon }) => (
                                    <SidebarMenuItem key={to}>
                                        <SidebarMenuButton
                                            render={
                                                <Link
                                                    to={to}
                                                    activeOptions={{ exact: true }}
                                                    activeProps={{
                                                        className:
                                                            "border-foreground bg-sidebar-accent/60 text-foreground",
                                                        "aria-current": "page",
                                                    }}
                                                    inactiveProps={{
                                                        className:
                                                            "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-transparent hover:text-foreground",
                                                    }}
                                                />
                                            }
                                            tooltip={label}
                                            className="h-8 rounded-none border-l-2 px-2.5 transition-colors group-data-[collapsible=icon]:border-l-0"
                                        >
                                            <Icon
                                                strokeWidth={1.75}
                                                className="size-3.5 shrink-0"
                                            />
                                            <span className="text-xs">{label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* Routing Group */}
                    <SidebarGroup className="border-t border-border/60 p-0 pt-4">
                        <SidebarGroupLabel className="mb-1 h-6 rounded-none px-2 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                            Routing
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-0.5">
                                {/* Providers with Categorized Collapsible Dropdown */}
                                <SidebarMenuItem>
                                    <div className="flex items-center justify-between group-data-[collapsible=icon]:block">
                                        <SidebarMenuButton
                                            render={
                                                <Link
                                                    to="/providers"
                                                    activeOptions={{ exact: true }}
                                                    activeProps={{
                                                        className:
                                                            "border-foreground bg-sidebar-accent/60 text-foreground",
                                                        "aria-current": "page",
                                                    }}
                                                    inactiveProps={{
                                                        className:
                                                            "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-transparent hover:text-foreground",
                                                    }}
                                                />
                                            }
                                            tooltip="Providers"
                                            className="h-8 flex-1 rounded-none border-l-2 px-2.5 transition-colors group-data-[collapsible=icon]:border-l-0"
                                        >
                                            <Boxes
                                                strokeWidth={1.75}
                                                className="size-3.5 shrink-0"
                                            />
                                            <span className="text-xs">Providers</span>
                                        </SidebarMenuButton>
                                        <button
                                            type="button"
                                            onClick={() => setIsProvidersOpen((prev) => !prev)}
                                            className="flex size-7 items-center justify-center text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden cursor-pointer"
                                            title="Toggle Providers dropdown"
                                        >
                                            <ChevronDown
                                                className={`size-3 transition-transform duration-200 ${
                                                    isProvidersOpen ? "rotate-0" : "-rotate-90"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Categorized Submenu Items */}
                                    {isProvidersOpen && (
                                        <SidebarMenuSub className="my-1 space-y-2">
                                            {providerCategories.map((group) => (
                                                <div key={group.category} className="space-y-0.5">
                                                    <div className="px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                                                        {group.category}
                                                    </div>
                                                    {group.items.map(({ providerId, label }) => (
                                                        <SidebarMenuSubItem key={providerId}>
                                                            <SidebarMenuSubButton
                                                                size="sm"
                                                                render={
                                                                    <Link
                                                                        to="/providers/$providerId"
                                                                        params={{ providerId }}
                                                                        activeProps={{
                                                                            className:
                                                                                "bg-sidebar-accent text-foreground font-semibold",
                                                                            "aria-current": "page",
                                                                        }}
                                                                        inactiveProps={{
                                                                            className:
                                                                                "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                                                                        }}
                                                                    />
                                                                }
                                                                className="h-6.5 text-[11px] gap-2 px-2"
                                                            >
                                                                <ProviderIcon
                                                                    providerId={providerId}
                                                                    className="size-3.5 shrink-0"
                                                                />
                                                                <span className="truncate">
                                                                    {label}
                                                                </span>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </div>
                                            ))}
                                        </SidebarMenuSub>
                                    )}
                                </SidebarMenuItem>

                                {/* Models */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        render={
                                            <Link
                                                to="/models"
                                                activeOptions={{ exact: true }}
                                                activeProps={{
                                                    className:
                                                        "border-foreground bg-sidebar-accent/60 text-foreground",
                                                    "aria-current": "page",
                                                }}
                                                inactiveProps={{
                                                    className:
                                                        "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-transparent hover:text-foreground",
                                                }}
                                            />
                                        }
                                        tooltip="Models"
                                        className="h-8 rounded-none border-l-2 px-2.5 transition-colors group-data-[collapsible=icon]:border-l-0"
                                    >
                                        <Bot strokeWidth={1.75} className="size-3.5 shrink-0" />
                                        <span className="text-xs">Models</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                {/* Logs */}
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        render={
                                            <Link
                                                to="/logs"
                                                activeOptions={{ exact: true }}
                                                activeProps={{
                                                    className:
                                                        "border-foreground bg-sidebar-accent/60 text-foreground",
                                                    "aria-current": "page",
                                                }}
                                                inactiveProps={{
                                                    className:
                                                        "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-transparent hover:text-foreground",
                                                }}
                                            />
                                        }
                                        tooltip="Logs"
                                        className="h-8 rounded-none border-l-2 px-2.5 transition-colors group-data-[collapsible=icon]:border-l-0"
                                    >
                                        <ScrollText
                                            strokeWidth={1.75}
                                            className="size-3.5 shrink-0"
                                        />
                                        <span className="text-xs">Logs</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </nav>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
