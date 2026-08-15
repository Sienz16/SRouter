import { Link } from "@tanstack/react-router";
import {
    Boxes,
    Gauge,
    KeyRound,
    LayoutDashboard,
    ScrollText,
    Settings,
    Terminal,
    Zap
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail
} from "@/components/ui/sidebar";

const mainNavItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/playground", label: "Playground", icon: Terminal },
    { to: "/keys", label: "API Keys", icon: KeyRound }
] as const;

const routingNavItems = [
    { to: "/providers", label: "Providers", icon: Boxes },
    { to: "/quota", label: "Quotas", icon: Gauge },
    { to: "/logs", label: "Logs", icon: ScrollText }
] as const;

export function AppSidebar() {
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
                                                        "aria-current": "page"
                                                    }}
                                                    inactiveProps={{
                                                        className:
                                                            "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-transparent hover:text-foreground"
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
                                {routingNavItems.map(({ to, label, icon: Icon }) => (
                                    <SidebarMenuItem key={to}>
                                        <SidebarMenuButton
                                            render={
                                                <Link
                                                    to={to}
                                                    activeOptions={{ exact: to !== "/providers" }}
                                                    activeProps={{
                                                        className:
                                                            "border-foreground bg-sidebar-accent/60 text-foreground",
                                                        "aria-current": "page"
                                                    }}
                                                    inactiveProps={{
                                                        className:
                                                            "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-transparent hover:text-foreground"
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
                </nav>
            </SidebarContent>

            {/* Footer with Settings */}
            <SidebarFooter className="border-t border-border/70 p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            render={
                                <Link
                                    to="/settings"
                                    activeOptions={{ exact: true }}
                                    activeProps={{
                                        className:
                                            "border-foreground bg-sidebar-accent/60 text-foreground",
                                        "aria-current": "page"
                                    }}
                                    inactiveProps={{
                                        className:
                                            "border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-transparent hover:text-foreground"
                                    }}
                                />
                            }
                            tooltip="Settings"
                            className="h-8 rounded-none border-l-2 px-2.5 transition-colors group-data-[collapsible=icon]:border-l-0"
                        >
                            <Settings strokeWidth={1.75} className="size-3.5 shrink-0" />
                            <span className="text-xs">Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
