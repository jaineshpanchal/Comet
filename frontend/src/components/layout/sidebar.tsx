"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarTooltip } from "@/components/ui/tooltip-sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Workflow,
  FlaskConical,
  Rocket,
  Activity,
  Menu,
  X,
  Play,
  History,
  List,
  Package,
  CheckCircle2,
  Gauge,
  Server,
  Cloud,
  Cpu,
  ScrollText,
  AlertTriangle,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Users,
  Puzzle,
  Bell,
  Shield,
  SlidersHorizontal,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavItem[];
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    label: "Pipelines",
    href: "/pipelines",
    icon: Workflow,
    subItems: [
      { label: "Overview", href: "/pipelines", icon: Workflow },
      { label: "All Pipelines", href: "/pipelines/all", icon: List },
      { label: "Running", href: "/pipelines/running", icon: Play, badge: "new" },
      { label: "History", href: "/pipelines/history", icon: History },
    ],
  },
  {
    label: "Testing",
    href: "/testing",
    icon: FlaskConical,
    subItems: [
      { label: "Overview", href: "/testing", icon: FlaskConical },
      { label: "Test Suites", href: "/testing/suites", icon: Package },
      { label: "Test Results", href: "/testing/results", icon: CheckCircle2, badge: "new" },
      { label: "Coverage", href: "/testing/coverage", icon: Gauge },
    ],
  },
  {
    label: "Deployments",
    href: "/deployments",
    icon: Rocket,
    subItems: [
      { label: "Overview", href: "/deployments", icon: Rocket },
      { label: "Production", href: "/deployments/production", icon: Server, badge: "new" },
      { label: "Staging", href: "/deployments/staging", icon: Cloud },
    ],
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    icon: Activity,
    subItems: [
      { label: "Overview", href: "/monitoring", icon: Activity },
      { label: "System Metrics", href: "/monitoring/metrics", icon: Cpu },
      { label: "Application Logs", href: "/monitoring/logs", icon: ScrollText },
      { label: "Alerts & Incidents", href: "/monitoring/alerts", icon: AlertTriangle, badge: "new" },
    ],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    subItems: [
      { label: "Overview", href: "/analytics", icon: BarChart3 },
      { label: "Performance Metrics", href: "/analytics/performance", icon: TrendingUp, badge: "new" },
      { label: "Error Tracking", href: "/analytics/errors", icon: TrendingDown },
      { label: "Usage Statistics", href: "/analytics/usage", icon: BarChart3 },
    ],
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    subItems: [
      { label: "Overview", href: "/notifications", icon: Bell },
      { label: "Alerts", href: "/notifications/alerts", icon: AlertTriangle, badge: "new" },
    ],
  },
  {
    label: "Teams",
    href: "/teams",
    icon: Users,
  },
  {
    label: "Integrations",
    href: "/integrations",
    icon: Puzzle,
  },
  {
    label: "Security",
    href: "/security",
    icon: Shield,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Prevent scroll propagation to page when sidebar is at top/bottom
  const handleWheel = (e: React.WheelEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    // Prevent scrolling the page when at boundaries
    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.preventDefault();
    }
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold shadow-lg">
            <span>GL</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">GoLive DevOps</h1>
            <p className="text-xs text-blue-600 font-semibold">PLATFORM</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-gray-200 px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-md shadow-blue-500/30">
                <span>GL</span>
              </div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">GoLive DevOps</h1>
                <p className="text-[10px] text-gray-500 tracking-wider font-semibold">PLATFORM</p>
              </div>
            </div>
          )}

          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-white hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-50 transition-all duration-300 shadow-md border border-gray-200 hover:border-blue-300 group shrink-0"
            >
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg bg-white hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-50 transition-all duration-300 shadow-md border border-gray-200 hover:border-blue-300 group shrink-0"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
            </button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
            collapsed ? "px-2 py-3" : "px-3 py-3"
          )}
          onWheel={handleWheel}
        >
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <div key={item.href}>
                  {/* Main item */}
                  {hasSubItems && !collapsed ? (
                    <div
                      className={cn(
                        "group relative flex items-center transition-colors duration-75 overflow-hidden rounded-lg cursor-default",
                        "justify-between px-3 py-2.5",
                        isActive
                          ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-sm border border-blue-100/50"
                          : "text-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "flex items-center justify-center w-5 h-5 transition-all duration-200 shrink-0",
                          isActive ? "text-blue-600" : "text-blue-600"
                        )}>
                          <item.icon className="h-5 w-5 shrink-0 stroke-[2]" />
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={cn(
                            "font-bold text-[13px] leading-none transition-all duration-200",
                            isActive ? "text-blue-700" : "text-blue-600"
                          )}>{item.label}</span>
                          {item.badge && (
                            <div className="relative w-1.5 h-1.5 shrink-0">
                              <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                              <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center transition-colors duration-75 overflow-hidden rounded-lg",
                        collapsed
                          ? "justify-center w-12 h-12 mx-auto"
                          : "justify-between px-3 py-2.5",
                        isActive
                          ? collapsed
                            ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                            : "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-sm border border-blue-100/50"
                          : collapsed
                            ? "bg-gray-100 text-gray-600"
                            : "text-gray-700"
                      )}
                      onClick={() => setMobileOpen(false)}
                      prefetch={true}
                    >
                      {collapsed ? (
                        <SidebarTooltip content={item.label} side="right" delayDuration={150}>
                          <div className="relative">
                            <item.icon className="h-5 w-5 shrink-0 stroke-[1.5]" />
                            {item.badge && (
                              <div className="absolute -top-1 -right-1">
                                <div className="relative w-1.5 h-1.5">
                                  <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                  <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </SidebarTooltip>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn(
                              "flex items-center justify-center w-5 h-5 transition-all duration-200 shrink-0",
                              isActive ? "text-blue-600" : "text-blue-600"
                            )}>
                              <item.icon className="h-5 w-5 shrink-0 stroke-[2]" />
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={cn(
                                "font-bold text-[13px] leading-none transition-all duration-200",
                                isActive ? "text-blue-700" : "text-blue-600"
                              )}>{item.label}</span>
                              {item.badge && (
                                <div className="relative w-1.5 h-1.5 shrink-0">
                                  <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                  <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </Link>
                  )}

                  {/* Sub-items - Always visible when sidebar is expanded */}
                  {hasSubItems && !collapsed && (
                    <div className="mt-1 mb-2 ml-7 space-y-0.5">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors duration-75",
                              isSubActive
                                ? "bg-blue-50 text-blue-700 shadow-sm"
                                : "text-gray-600 hover:bg-blue-50/70 hover:text-gray-900"
                            )}
                            onClick={() => setMobileOpen(false)}
                            prefetch={true}
                          >
                            <subItem.icon className={cn(
                              "h-4 w-4 shrink-0 stroke-[1.5]",
                              isSubActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
                            )} />
                            <span className={cn(
                              "flex-1 transition-all duration-200",
                              isSubActive ? "font-semibold" : ""
                            )}>{subItem.label}</span>
                            {subItem.badge && (
                              <div className="relative w-1.5 h-1.5 shrink-0">
                                <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer - User profile */}
        <div className={cn(
          "border-t border-gray-200 transition-all duration-300 bg-gradient-to-r from-white via-gray-50/20 to-white",
          collapsed ? "p-2" : "p-3"
        )}>
          <div className="group flex items-center gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/30 p-1.5 -m-1.5 hover:shadow-sm">
            <div className={cn(
              "flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold transition-all duration-300 shadow-md shadow-blue-500/30",
              collapsed ? "h-10 w-10 mx-auto rounded-lg text-xs" : "h-8 w-8 rounded-lg text-xs"
            )}>
              <span>JD</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">John Doe</p>
                <p className="text-xs text-gray-500 truncate">john@golive.dev</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
