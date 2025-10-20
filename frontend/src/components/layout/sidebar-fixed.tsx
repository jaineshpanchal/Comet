"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  CogIcon,
  ChartBarIcon,
  BoltIcon,
  BeakerIcon,
  RocketLaunchIcon,
  EyeIcon,
  Bars3Icon,
  XMarkIcon,
  PlayIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  CloudIcon,
  CpuChipIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    label: "Pipelines",
    href: "/pipelines",
    icon: BoltIcon,
    subItems: [
      { label: "All Pipelines", href: "/pipelines", icon: BoltIcon },
      { label: "Running", href: "/pipelines/running", icon: PlayIcon },
      { label: "History", href: "/pipelines/history", icon: ClockIcon },
    ],
  },
  {
    label: "Testing",
    href: "/testing",
    icon: BeakerIcon,
    subItems: [
      { label: "Test Suites", href: "/testing/suites", icon: DocumentTextIcon },
      { label: "Test Results", href: "/testing/results", icon: CheckCircleIcon },
      { label: "Coverage", href: "/testing/coverage", icon: ShieldCheckIcon },
    ],
  },
  {
    label: "Deployments",
    href: "/deployments",
    icon: RocketLaunchIcon,
    subItems: [
      { label: "Active Deployments", href: "/deployments", icon: RocketLaunchIcon },
      { label: "Production", href: "/deployments/production", icon: ServerIcon },
      { label: "Staging", href: "/deployments/staging", icon: CloudIcon },
    ],
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    icon: EyeIcon,
    subItems: [
      { label: "System Metrics", href: "/monitoring/metrics", icon: CpuChipIcon },
      { label: "Application Logs", href: "/monitoring/logs", icon: DocumentTextIcon },
      { label: "Alerts & Incidents", href: "/monitoring/alerts", icon: ExclamationTriangleIcon },
    ],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: ChartBarIcon,
    subItems: [
      { label: "Performance Metrics", href: "/analytics/performance", icon: ChartBarIcon },
      { label: "Usage Statistics", href: "/analytics/usage", icon: ChartPieIcon },
      { label: "Reports", href: "/analytics/reports", icon: DocumentTextIcon },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: CogIcon,
  },
];

export function Sidebar({ children, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [viewedItems, setViewedItems] = useState<Record<string, boolean>>({
    pipelines: false,
    deployments: false,
    testing: false,
    monitoring: false,
    analytics: false,
    settings: false
  });
  const pathname = usePathname();

  // Mark item as viewed when clicked
  const markAsViewed = (itemHref: string) => {
    const itemKey = itemHref.replace('/', '');
    setViewedItems(prev => ({
      ...prev,
      [itemKey]: true
    }));
  };

  // Check if item has notification - only green dots now
  const hasNotification = (item: NavItem) => {
    const itemKey = item.href.replace('/', '');
    // Show green dot for items that haven't been viewed yet
    return !viewedItems[itemKey];
  };

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const itemKey = item.href.replace('/', '');
    const expanded = expandedItems[itemKey] || false;
    
    const toggleExpanded = () => {
      setExpandedItems(prev => ({
        ...prev,
        [itemKey]: !prev[itemKey]
      }));
    };

    if (level > 0) {
      // Sub-item styling - modern industry standard design with full names
      return (
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center gap-3 rounded-lg px-4 py-2.5 ml-2 text-sm font-medium transition-all duration-300 ease-in-out",
            "hover:scale-[1.02] hover:shadow-sm",
            isActive
              ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/5 text-blue-700 border border-blue-200/50 shadow-sm backdrop-blur-sm"
              : "text-slate-600 hover:text-slate-800 hover:bg-white/70 hover:border hover:border-slate-200/30 hover:shadow-sm"
          )}
          onClick={() => {
            markAsViewed(item.href);
            setMobileOpen(false);
          }}
        >
          {/* Enhanced icon with background */}
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 shrink-0",
            isActive 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25" 
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
          )}>
            <item.icon className="w-4 h-4 stroke-2" />
          </div>
          
          {/* Text content - NO TRUNCATION */}
          <span className="flex-1 font-medium whitespace-nowrap">{item.label}</span>
          
          {/* Status indicator for active state */}
          {isActive && (
            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50 animate-pulse"></div>
          )}
          
          {/* Subtle border accent */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full transition-all duration-300",
            isActive ? "bg-gradient-to-b from-blue-500 to-indigo-600" : "bg-transparent"
          )}></div>
        </Link>
      );
    }

    // Main item styling - premium professional design
    return (
      <div>
        {item.subItems ? (
          // Items with submenus - button for dropdown toggle
          <button
            type="button"
            className={cn(
              "group relative flex items-center transition-all duration-300 ease-out overflow-hidden w-full text-left",
              collapsed 
                ? "justify-center w-12 h-12 rounded-xl mx-auto my-1"
                : "justify-between rounded-2xl px-4 py-4 hover:scale-[1.02]",
              isActive
                ? collapsed
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-300/50"
                  : "bg-gradient-to-r from-white to-blue-50/50 text-slate-800 shadow-xl shadow-slate-200/60 border border-blue-200/50 ring-1 ring-blue-300/20"
                : collapsed
                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-200/30"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:shadow-lg hover:shadow-slate-200/60 hover:border hover:border-slate-200/50",
              "text-sm font-semibold backdrop-blur-sm"
            )}
            onClick={() => {
              markAsViewed(item.href);
              toggleExpanded();
              setMobileOpen(false);
            }}
          >
            {collapsed ? (
              // Collapsed state - enhanced icon with tooltip indicator
              <div className="relative flex items-center justify-center">
                <item.icon className="h-6 w-6 shrink-0 stroke-2" />
                {hasNotification(item) && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <div className="w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse shadow-xl shadow-green-500/80 border-2 border-white ring-2 ring-green-300/50"></div>
                    <div className="absolute inset-0 w-3.5 h-3.5 bg-green-500 rounded-full animate-ping opacity-80"></div>
                  </div>
                )}
              </div>
            ) : (
              // Expanded state - full layout
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0 overflow-visible">
                  <div className={cn(
                    "flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ease-out relative",
                    isActive 
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-300/30" 
                      : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 group-hover:from-white group-hover:to-slate-50 group-hover:text-slate-700 group-hover:shadow-lg group-hover:shadow-slate-200/60"
                  )}>
                    <item.icon className="h-6 w-6 shrink-0 stroke-2" />
                    {/* Subtle glow effect for active state */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={cn(
                      "font-semibold text-base tracking-tight whitespace-nowrap",
                      isActive ? "text-slate-800" : "text-slate-700"
                    )}>{item.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasNotification(item) && (
                    <div className="relative">
                      <div className="w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse shadow-xl shadow-green-500/80 border-2 border-white ring-2 ring-green-300/50"></div>
                      <div className="absolute inset-0 w-3.5 h-3.5 bg-green-500 rounded-full animate-ping opacity-80"></div>
                    </div>
                  )}
                  {item.subItems && (
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ease-out",
                      expanded 
                        ? "bg-slate-200/80 text-slate-600 rotate-90" 
                        : "bg-slate-100/50 text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600"
                    )}>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 stroke-2" />
                    </div>
                  )}
                </div>
              </>
            )}
          </button>
        ) : (
          // Items without submenus - regular link
          <Link
            href={item.href}
            className={cn(
              "group relative flex items-center transition-all duration-300 ease-out overflow-hidden",
              collapsed 
                ? "justify-center w-12 h-12 rounded-xl mx-auto my-1"
                : "justify-between w-full rounded-2xl px-4 py-4 hover:scale-[1.02]",
              isActive
                ? collapsed
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-300/50"
                  : "bg-gradient-to-r from-white to-blue-50/50 text-slate-800 shadow-xl shadow-slate-200/60 border border-blue-200/50 ring-1 ring-blue-300/20"
                : collapsed
                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-200/30"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:shadow-lg hover:shadow-slate-200/60 hover:border hover:border-slate-200/50",
              "text-sm font-semibold backdrop-blur-sm"
            )}
            onClick={() => {
              markAsViewed(item.href);
              setMobileOpen(false);
            }}
          >
            {collapsed ? (
              // Collapsed state
              <div className="relative flex items-center justify-center">
                <item.icon className="h-6 w-6 shrink-0 stroke-2" />
                {hasNotification(item) && (
                  <div className="absolute -top-0.5 -right-0.5">
                    <div className="w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse shadow-xl shadow-green-500/80 border-2 border-white ring-2 ring-green-300/50"></div>
                    <div className="absolute inset-0 w-3.5 h-3.5 bg-green-500 rounded-full animate-ping opacity-80"></div>
                  </div>
                )}
              </div>
            ) : (
              // Expanded state
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0 overflow-visible">
                  <div className={cn(
                    "flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ease-out relative",
                    isActive 
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-300/30" 
                      : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 group-hover:from-white group-hover:to-slate-50 group-hover:text-slate-700 group-hover:shadow-lg group-hover:shadow-slate-200/60"
                  )}>
                    <item.icon className="h-6 w-6 shrink-0 stroke-2" />
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={cn(
                      "font-semibold text-base tracking-tight whitespace-nowrap",
                      isActive ? "text-slate-800" : "text-slate-700"
                    )}>{item.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasNotification(item) && (
                    <div className="relative">
                      <div className="w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse shadow-xl shadow-green-500/80 border-2 border-white ring-2 ring-green-300/50"></div>
                      <div className="absolute inset-0 w-3.5 h-3.5 bg-green-500 rounded-full animate-ping opacity-80"></div>
                    </div>
                  )}
                </div>
              </>
            )}
          </Link>
        )}
        
        {/* Sub-menu items */}
        {item.subItems && expanded && !collapsed && (
          <div className="mt-2 mb-4 space-y-1 pl-3 pr-2 py-2 bg-gradient-to-b from-slate-50/50 to-white/30 rounded-xl border border-slate-100/50 backdrop-blur-sm">
            {item.subItems.map((subItem) => (
              <NavItemComponent key={subItem.href} item={subItem} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <div className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">GoLive DevOps</h1>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          "bg-white/95 backdrop-blur-xl border-r border-slate-200/50",
          "shadow-xl shadow-slate-200/20",
          collapsed ? "w-16" : "w-80",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center border-b border-slate-200/50 px-3 bg-gradient-to-r from-slate-50/50 to-white/50 backdrop-blur-sm">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 flex-shrink-0 relative overflow-hidden">
                  <img 
                    src="/GoLive.png" 
                    alt="GoLive Logo" 
                    className="w-10 h-10 object-contain"
                    style={{ 
                      mixBlendMode: 'multiply',
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold tracking-tight text-slate-900 truncate">GoLive DevOps</span>
                  <span className="text-[10px] font-medium tracking-wide text-slate-500 truncate">DEVOPS PLATFORM</span>
                </div>
              </div>
              {/* Desktop collapse button */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex shrink-0 ml-2 h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 rounded-xl"
                onClick={() => setCollapsed(!collapsed)}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex w-12 h-12 mx-auto my-1 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRightIcon className="h-6 w-6 stroke-2" />
            </Button>
          )}

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 ml-2"
            onClick={() => setMobileOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 transition-all duration-300 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent",
          collapsed ? "p-2 space-y-3" : "p-4 space-y-3"
        )}>
          <div className="space-y-2">
            {navigationItems.map((item, index) => (
              <div key={item.href}>
                <NavItemComponent item={item} />
                {/* Subtle divider between sections */}
                {index < navigationItems.length - 1 && item.subItems && !collapsed && (
                  <div className="my-4 mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t border-slate-200/50 transition-all duration-300 bg-gradient-to-r from-slate-50/30 to-white/30 backdrop-blur-sm",
          collapsed ? "p-2" : "p-4"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center bg-slate-200 text-slate-700 font-semibold transition-all duration-300",
              collapsed ? "h-12 w-12 mx-auto rounded-xl text-sm" : "h-8 w-8 rounded-lg text-xs"
            )}>
              <span>JD</span>
            </div>
            {!collapsed && (
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">john@golive.dev</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "lg:ml-16" : "lg:ml-80"
        )}
      >
        {children}
      </div>
    </>
  );
}