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
  const pathname = usePathname();

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const [expanded, setExpanded] = useState(isActive);

    return (
      <div>
        <Link
          href={item.href}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            level > 0 && "ml-6",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => {
            if (item.subItems) {
              setExpanded(!expanded);
            }
            setMobileOpen(false);
          }}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
              {item.subItems && (
                <ChevronRightIcon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    expanded && "rotate-90"
                  )}
                />
              )}
            </>
          )}
        </Link>
        {item.subItems && expanded && !collapsed && (
          <div className="mt-1 space-y-1">
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
        <div className="flex h-16 items-center border-b px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BoltIcon className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">Comet DevOps</span>
            </div>
          )}
          
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <XMarkIcon className="h-6 w-6" />
          </Button>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("hidden lg:flex", collapsed ? "mx-auto" : "ml-auto")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigationItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <span className="text-sm font-medium">JD</span>
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