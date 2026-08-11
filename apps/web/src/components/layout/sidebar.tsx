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
    SidebarGroupLabel,
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
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={<Link to="/" />}
                            className="hover:bg-transparent data-active:bg-transparent"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-accent text-white">
                                <Zap className="size-4" strokeWidth={2} />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">SRouter</span>
                                <span className="truncate text-xs text-muted">Gateway</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted">Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map(({ to, label, icon: Icon }) => (
                                <SidebarMenuItem key={to}>
                                    <SidebarMenuButton
                                        render={
                                            <Link
                                                to={to}
                                                activeOptions={{ exact: true }}
                                                activeProps={{
                                                    className: "bg-accent/10",
                                                }}
                                            />
                                        }
                                        tooltip={label}
                                    >
                                        <Icon strokeWidth={1.75} />
                                        <span>{label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="hover:bg-transparent">
                            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-sm font-semibold text-foreground">
                                S
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">Gateway</span>
                                <span className="truncate text-xs text-muted">localhost:3000</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
