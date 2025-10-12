"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@heroicons/react/24/outline";

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
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
    badge: "3",
    subItems: [
      { label: "All Pipelines", href: "/pipelines", icon: BoltIcon },
      { label: "Running", href: "/pipelines/running", icon: BoltIcon },
      { label: "History", href: "/pipelines/history", icon: BoltIcon },
    ],
  },
  {
    label: "Testing",
    href: "/testing",
    icon: BeakerIcon,
    subItems: [
      { label: "Test Suites", href: "/testing/suites", icon: BeakerIcon },
      { label: "Test Results", href: "/testing/results", icon: BeakerIcon },
      { label: "Coverage", href: "/testing/coverage", icon: BeakerIcon },
    ],
  },
  {
    label: "Deployments",
    href: "/deployments",
    icon: RocketLaunchIcon,
    badge: "2",
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    icon: EyeIcon,
    subItems: [
      { label: "Metrics", href: "/monitoring/metrics", icon: ChartBarIcon },
      { label: "Logs", href: "/monitoring/logs", icon: EyeIcon },
      { label: "Alerts", href: "/monitoring/alerts", icon: EyeIcon },
    ],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: ChartBarIcon,
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
  const [viewedItems, setViewedItems] = useState<Record<string, boolean>>({
    pipelines: false,
    deployments: false
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

  // Check if item has notification
  const hasNotification = (item: NavItem) => {
    if (!item.badge) return false;
    const itemKey = item.href.replace('/', '');
    return !viewedItems[itemKey];
  };

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const [expanded, setExpanded] = useState(isActive);

    if (level > 0) {
      // Sub-item styling - clean and minimal
      return (
        <Link
          href={item.href}
          className={cn(
            "group flex items-center gap-4 rounded-xl px-5 py-3 ml-6 text-sm transition-all duration-300 ease-out",
            isActive
              ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-500 shadow-md shadow-blue-100/50 font-medium"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:translate-x-1"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            isActive ? "bg-blue-500 shadow-md shadow-blue-500/50" : "bg-slate-300 group-hover:bg-slate-400"
          )}></div>
          <span className="truncate">{item.label}</span>
        </Link>
      );
    }

    // Main item styling - prominent and feature-rich
    return (
      <div>
        <Link
          href={item.href}
          className={cn(
            "group flex items-center transition-all duration-300 ease-out",
            collapsed 
              ? "justify-center w-12 h-12 rounded-xl mx-auto my-1"
              : "justify-between w-full rounded-2xl px-5 py-4",
            isActive
              ? collapsed
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-white text-slate-800 shadow-xl shadow-slate-200/60 border border-slate-200/80 ring-1 ring-slate-300/20"
              : collapsed
                ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-800 hover:shadow-md hover:shadow-slate-200/40 hover:-translate-y-0.5",
            "text-sm font-medium"
          )}
          onClick={() => {
            markAsViewed(item.href);
            if (item.subItems) {
              setExpanded(!expanded);
            }
            setMobileOpen(false);
          }}
        >
          {collapsed ? (
            // Collapsed state - icon only
            <div className="flex items-center justify-center">
              <item.icon className="h-6 w-6 shrink-0 stroke-2" />
            </div>
          ) : (
            // Expanded state - full layout
            <>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={cn(
                  "flex items-center justify-center rounded-xl p-2.5 transition-all duration-300 ease-out",
                  isActive 
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30" 
                    : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-105"
                )}>
                  <item.icon className="h-5 w-5 shrink-0" />
                </div>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className={cn(
                    "font-semibold tracking-wide whitespace-nowrap",
                    isActive ? "text-slate-800" : "text-slate-700"
                  )}>{item.label}</span>
                  {hasNotification(item) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  )}
                </div>
              </div>
              {item.subItems && (
                <ChevronRightIcon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all duration-300 ease-out",
                    expanded && "rotate-90",
                    isActive ? "text-slate-600" : "text-slate-400 group-hover:text-slate-500"
                  )}
                />
              )}
            </>
          )}
        </Link>
        {item.subItems && expanded && !collapsed && (
          <div className="mt-3 mb-4 space-y-1 pl-1">
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
          <h1 className="text-lg font-semibold">Comet DevOps</h1>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center border-b px-3">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 flex-shrink-0 relative overflow-hidden">
                  {/* Your exact comet logo */}
                  <img 
                    src="/Comet.png" 
                    alt="Comet Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold tracking-tight text-slate-900 truncate">Comet DevOps</span>
                  <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase truncate">DevOps Platform</span>
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
          "flex-1 space-y-2 transition-all duration-300",
          collapsed ? "p-2" : "p-4"
        )}>
          {navigationItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t transition-all duration-300",
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
                <p className="text-xs text-muted-foreground">john@comet.dev</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        {children}
      </div>
    </>
  );
}