import { Link } from "@tanstack/react-router";
import {
    Activity,
    Boxes,
    Bot,
    LayoutDashboard,
    ScrollText,
    Zap,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/providers", label: "Providers", icon: Boxes },
    { to: "/models", label: "Models", icon: Bot },
    { to: "/logs", label: "Logs", icon: ScrollText },
    { to: "/playground", label: "Playground", icon: Activity },
] as const;

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar">
            <SidebarHeader className="h-14 border-b border-border/60 px-3 flex items-center">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={<Link to="/" />}
                            className="hover:bg-sidebar-accent/60 transition-colors"
                        >
                            <div className="flex size-7 items-center justify-center rounded bg-primary text-primary-foreground font-bold">
                                <Zap className="size-3.5 fill-current" strokeWidth={2.5} />
                            </div>
                            <div className="flex items-center justify-between flex-1 min-w-0">
                                <span className="font-semibold tracking-tight text-sm text-foreground">SRouter</span>
                                <span className="text-[10px] font-mono text-muted-foreground border border-border/60 px-1 py-0.2 rounded">v1.0</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-3">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-0.5">
                            {navItems.map(({ to, label, icon: Icon }) => (
                                <SidebarMenuItem key={to}>
                                    <SidebarMenuButton
                                        render={
                                            <Link
                                                to={to}
                                                activeOptions={{ exact: true }}
                                                activeProps={{
                                                    className: "bg-sidebar-accent font-medium text-foreground",
                                                }}
                                                inactiveProps={{
                                                    className: "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40",
                                                }}
                                            />
                                        }
                                        tooltip={label}
                                        className="h-8 px-2.5 transition-colors"
                                    >
                                        <Icon strokeWidth={1.75} className="size-4 shrink-0" />
                                        <span className="text-xs">{label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/60 p-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center justify-between px-2 py-1 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500" />
                                <span className="font-medium text-foreground text-xs">Gateway</span>
                            </div>
                            <span className="font-mono text-[11px] text-muted-foreground">3000</span>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}



