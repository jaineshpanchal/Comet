"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarTooltip } from "@/components/ui/tooltip-sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Workflow,
  FlaskConical,
  Rocket,
  Activity,
  Menu,
  X,
  Play,
  History,
  FileText,
  Shield,
  ShieldCheck,
  PieChart,
  AlertTriangle,
  Server,
  Cloud,
  Cpu,
  CheckCircle2,
  Users,
  ScrollText,
  Puzzle,
  Bell,
  BellRing,
  SlidersHorizontal,
  List,
  BarChart3,
  TrendingDown,
  Package,
  Gauge,
} from "lucide-react";

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
    icon: LayoutDashboard,
  },
  {
    label: "Pipelines",
    href: "/pipelines",
    icon: Workflow,
    subItems: [
      { label: "All Pipelines", href: "/pipelines", icon: List },
      { label: "Running", href: "/pipelines/running", icon: Play },
      { label: "History", href: "/pipelines/history", icon: History },
    ],
  },
  {
    label: "Testing",
    href: "/testing",
    icon: FlaskConical,
    subItems: [
      { label: "Test Suites", href: "/testing/suites", icon: Package },
      { label: "Test Results", href: "/testing/results", icon: CheckCircle2 },
      { label: "Coverage", href: "/testing/coverage", icon: Gauge },
    ],
  },
  {
    label: "Deployments",
    href: "/deployments",
    icon: Rocket,
    subItems: [
      { label: "Active Deployments", href: "/deployments", icon: Activity },
      { label: "Production", href: "/deployments/production", icon: Server },
      { label: "Staging", href: "/deployments/staging", icon: Cloud },
    ],
  },
  {
    label: "Monitoring",
    href: "/monitoring",
    icon: Activity,
    subItems: [
      { label: "System Metrics", href: "/monitoring/metrics", icon: Cpu },
      { label: "Application Logs", href: "/monitoring/logs", icon: ScrollText },
      { label: "Alerts & Incidents", href: "/monitoring/alerts", icon: AlertTriangle },
    ],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
    subItems: [
      { label: "Performance Metrics", href: "/analytics/performance", icon: BarChart3 },
      { label: "Usage Statistics", href: "/analytics/usage", icon: PieChart },
      { label: "Reports", href: "/analytics/reports", icon: FileText },
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
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    subItems: [
      { label: "All Notifications", href: "/notifications", icon: Bell },
      { label: "Alert Rules", href: "/notifications/alerts", icon: BellRing },
      { label: "Preferences", href: "/notifications/preferences", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Admin",
    href: "/admin/users",
    icon: ShieldCheck,
    subItems: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ children, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [viewedItems, setViewedItems] = useState<Record<string, boolean>>({
    dashboard: true, // Always viewed - no green dot
    pipelines: false, // Show green dots
    deployments: false, // Show green dots
    testing: false, // Show green dots
    monitoring: false, // Show green dots
    analytics: false, // Show green dots
    security: false, // Show green dots
    notifications: false, // Show green dots (NEW!)
    settings: true, // Always viewed - no green dot
    admin: true // Always viewed - no green dot
  });
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Restore expanded state from localStorage after mount
  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-expanded-items');
      if (saved) {
        try {
          setExpandedItems(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved expanded items:', e);
        }
      }
    }
  }, []);

  // Save expanded state to localStorage whenever it changes (only after mount)
  React.useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('sidebar-expanded-items', JSON.stringify(expandedItems));
    }
  }, [expandedItems, mounted]);
  
  // Track specific sub-items that have updates (Dashboard and Settings excluded)
  const [subItemUpdates, setSubItemUpdates] = useState<Record<string, string>>({
    pipelines: "/pipelines/running", // Points to "Running" sub-item
    deployments: "/deployments/production", // Points to "Production" sub-item
    testing: "/testing/results", // Points to "Test Results" sub-item
    monitoring: "/monitoring/alerts", // Points to "Alerts & Incidents" sub-item
    analytics: "/analytics/performance", // Points to "Performance Metrics" sub-item
    // dashboard and settings intentionally excluded - no green dots
  });
  
  // Track when green dots are actively transferred to sub-items
  const [transferredNotifications, setTransferredNotifications] = useState<Record<string, boolean>>({});

  // Debug logging for initial state
  React.useEffect(() => {
    console.log('Initial notification state:');
    console.log('viewedItems:', {
      dashboard: true,
      pipelines: false,
      deployments: false,
      testing: false,
      monitoring: false,
      analytics: false,
      settings: true
    });
    console.log('subItemUpdates:', {
      pipelines: "/pipelines/running",
      deployments: "/deployments/production", 
      testing: "/testing/results",
      monitoring: "/monitoring/alerts",
      analytics: "/analytics/performance"
    });
  }, []);

  const pathname = usePathname();
  const router = useRouter();

  // Handle sidebar collapse with menu reset
  const handleSidebarToggle = (newCollapsedState: boolean) => {
    setCollapsed(newCollapsedState);
    
    // If collapsing sidebar, reset all expanded menus to default closed state
    if (newCollapsedState) {
      setExpandedItems({});
    }
  };

  // Mark item as viewed when clicked
  const markAsViewed = (itemHref: string) => {
    const itemKey = itemHref.replace('/', '');
    
    // Mark the main item as viewed
    setViewedItems(prev => ({
      ...prev,
      [itemKey]: true
    }));
    
    // Remove any sub-item updates for this specific href (if it's a sub-item)
    setSubItemUpdates(prev => {
      const updated = { ...prev };
      
      // Check if this href matches any sub-item updates and remove it
      Object.keys(updated).forEach(parentKey => {
        if (updated[parentKey] === itemHref) {
          delete updated[parentKey];
        }
      });
      
      // Also clear any updates for the main item itself
      if (updated[itemKey]) {
        delete updated[itemKey];
      }
      
      return updated;
    });
    
    // Clear any transferred notifications for this item
    setTransferredNotifications(prev => ({
      ...prev,
      [itemKey]: false
    }));
  };

  // Check if main item has notification
  const hasMainItemNotification = (item: NavItem) => {
    const itemKey = item.href.replace('/', '');
    
    // Never show notifications on Dashboard and Settings
    if (itemKey === 'dashboard' || itemKey === 'settings') {
      return false;
    }
    
    const hasUpdate = !!subItemUpdates[itemKey];
    const isViewed = viewedItems[itemKey];
    const isExpanded = expandedItems[itemKey];
    const isTransferred = transferredNotifications[itemKey];
    
    // If dropdown is expanded and notification is transferred, don't show dot on main item
    if (isExpanded && isTransferred) {
      console.log(`🔸 ${itemKey}: hiding main dot - transferred to sub-item`);
      return false;
    }
    
    // Show dot if there's an update for this item's sub-items and it hasn't been viewed
    const shouldShow = hasUpdate && !isViewed;
    console.log(`🔸 ${itemKey}: main dot should show: ${shouldShow}`, { 
      hasUpdate, 
      isViewed, 
      isExpanded, 
      isTransferred 
    });
    return shouldShow;
  };

  // Check if sub-item has notification
  const hasSubItemNotification = (subItem: NavItem, parentKey: string) => {
    const expanded = expandedItems[parentKey];
    const transferred = transferredNotifications[parentKey];
    const updateUrl = subItemUpdates[parentKey];
    const isThisSubItem = updateUrl === subItem.href;
    
    // Only show on sub-item if:
    // 1. Parent is expanded
    // 2. Notification has been transferred to sub-items
    // 3. This specific sub-item has the update
    const shouldShow = expanded && transferred && isThisSubItem;
    console.log(`🔹 sub-item ${subItem.href}: should show dot: ${shouldShow}`, { 
      expanded, 
      transferred, 
      updateUrl, 
      subItemHref: subItem.href,
      isThisSubItem,
      parentKey
    });
    return shouldShow;
  };

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    const itemKey = item.href.replace('/', '');
    const expanded = expandedItems[itemKey] || false;
    
    const toggleExpanded = () => {
      const isCurrentlyExpanded = expandedItems[itemKey] || false;
      const hasUpdate = !!subItemUpdates[itemKey];
      const isViewed = viewedItems[itemKey];
      
      console.log(`=== Toggling ${itemKey} ===`);
      console.log(`Currently expanded: ${isCurrentlyExpanded}`);
      console.log(`Has update: ${hasUpdate}`);
      console.log(`Is viewed: ${isViewed}`);
      console.log(`Update URL: ${subItemUpdates[itemKey]}`);
      
      if (!isCurrentlyExpanded) {
        // EXPANDING: Transfer green dot to sub-item if there's an update and it's not viewed
        if (hasUpdate && !isViewed) {
          console.log(`✅ ${itemKey}: TRANSFERRING notification to sub-item`);
          setTransferredNotifications(prev => ({
            ...prev,
            [itemKey]: true
          }));
        } else {
          console.log(`❌ ${itemKey}: NOT transferring (hasUpdate: ${hasUpdate}, isViewed: ${isViewed})`);
        }
      } else {
        // COLLAPSING: If notification was transferred and sub-item wasn't clicked,
        // transfer it back to main item
        if (transferredNotifications[itemKey] && hasUpdate) {
          console.log(`🔄 ${itemKey}: TRANSFERRING notification back to main item`);
          setTransferredNotifications(prev => ({
            ...prev,
            [itemKey]: false
          }));
          // Keep the main item as unviewed so the green dot shows
          setViewedItems(prev => ({
            ...prev,
            [itemKey]: false
          }));
        } else {
          console.log(`❌ ${itemKey}: NOT transferring back (transferred: ${transferredNotifications[itemKey]}, hasUpdate: ${hasUpdate})`);
        }
      }
      
      setExpandedItems(prev => ({
        ...prev,
        [itemKey]: !prev[itemKey]
      }));
    };

    if (level > 0) {
      // Sub-item styling - Ultra-premium design with stunning hover effects
      return (
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 ml-3 text-sm font-medium transition-all duration-300 ease-out",
            isActive
              ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-md"
              : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:shadow-md hover:scale-[1.03]"
          )}
          onClick={() => {
            markAsViewed(item.href);
            setMobileOpen(false);
          }}
        >
          {/* Enhanced active indicator with glow effect */}
          <div className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full transition-all duration-300",
            isActive
              ? "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-500 shadow-lg shadow-blue-500/50"
              : "bg-transparent group-hover:bg-gradient-to-b group-hover:from-gray-400 group-hover:via-gray-500 group-hover:to-gray-400"
          )}></div>

          {/* Icon with enhanced hover */}
          <div className={cn(
            "flex items-center justify-center w-5 h-5 transition-all duration-300 shrink-0 transform",
            isActive
              ? "text-blue-600 scale-110"
              : "text-gray-400 group-hover:text-blue-600 group-hover:scale-110"
          )}>
            <item.icon className="w-5 h-5 stroke-[1.5]" />
          </div>

          {/* Text content with enhanced visibility */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn(
              "font-semibold text-[13px] leading-none transition-all duration-300",
              isActive
                ? "text-blue-700"
                : "text-gray-700 group-hover:text-gray-900 group-hover:translate-x-1"
            )}>{item.label}</span>

            {/* Enhanced notification dot with pulse */}
            {(() => {
              const parentItem = navigationItems.find(nav => nav.subItems?.some(sub => sub.href === item.href));
              const parentKey = parentItem?.href.replace('/', '');
              return parentKey && hasSubItemNotification(item, parentKey) && (
                <div className="relative w-1.5 h-1.5 shrink-0">
                  <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                </div>
              );
            })()}
          </div>

          {/* Enhanced hover highlight */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </Link>
      );
    }

    // Main item styling - Apple-inspired premium design
    return (
      <div>
        {item.subItems ? (
          // Items with submenus - Ultra-professional with enhanced hover
          <div
            className={cn(
              "group relative flex items-center transition-all duration-300 ease-out w-full text-left cursor-pointer overflow-hidden",
              collapsed
                ? "justify-center w-12 h-12 rounded-lg mx-auto my-1.5"
                : "justify-between rounded-lg px-3 py-2.5 my-0.5",
              isActive || expanded
                ? collapsed
                  ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-md border border-blue-100/50"
                : collapsed
                  ? "bg-gray-100 text-gray-600 hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-100 hover:text-gray-900 hover:shadow-md"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:shadow-md hover:scale-[1.02]",
              "text-sm font-medium"
            )}
            onClick={() => {
              if (collapsed) {
                handleSidebarToggle(false);
              }

              const isCurrentPage = pathname === item.href || pathname.startsWith(item.href + "/");

              if (isCurrentPage) {
                toggleExpanded();
              } else {
                setExpandedItems(prev => ({
                  ...prev,
                  [itemKey]: true
                }));
                markAsViewed(item.href);
                router.push(item.href);
              }

              setMobileOpen(false);
            }}
          >
            {collapsed ? (
              // Collapsed state - premium icon with tooltip
              <SidebarTooltip content={item.label} side="right" delayDuration={150}>
                <div className="relative transform transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="h-5 w-5 shrink-0 stroke-[1.5]" />
                  {hasMainItemNotification(item) && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <div className="relative w-1.5 h-1.5">
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  )}
                </div>
              </SidebarTooltip>
            ) : (
              // Expanded state - enhanced visibility and animations
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0 z-10">
                  <div className={cn(
                    "flex items-center justify-center w-5 h-5 transition-all duration-300 shrink-0 transform",
                    isActive || expanded
                      ? "text-blue-600 scale-110"
                      : "text-gray-500 group-hover:text-blue-600 group-hover:scale-110"
                  )}>
                    <item.icon className="h-5 w-5 shrink-0 stroke-[1.5]" />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={cn(
                      "font-semibold text-[13px] leading-none transition-all duration-300",
                      isActive || expanded
                        ? "text-blue-700"
                        : "text-gray-700 group-hover:text-gray-900 group-hover:translate-x-1"
                    )}>{item.label}</span>
                    {hasMainItemNotification(item) && (
                      <div className="relative w-1.5 h-1.5 shrink-0">
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center shrink-0 z-10">
                  {item.subItems && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 stroke-[2] transition-all duration-300 ease-out",
                        isActive || expanded
                          ? "text-blue-600 scale-110"
                          : "text-gray-400 group-hover:text-blue-600 group-hover:scale-110",
                        expanded ? "rotate-90" : "rotate-0"
                      )}
                    />
                  )}
                </div>
                {/* Sophisticated hover shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -skew-x-12"></div>
              </>
            )}
          </div>
        ) : (
          // Items without submenus - Ultra-professional link design
          <Link
            href={item.href}
            className={cn(
              "group relative flex items-center transition-all duration-300 ease-out overflow-hidden",
              collapsed
                ? "justify-center w-12 h-12 rounded-lg mx-auto my-1.5"
                : "justify-between rounded-lg px-3 py-2.5 my-0.5",
              isActive
                ? collapsed
                  ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-md border border-blue-100/50"
                : collapsed
                  ? "bg-gray-100 text-gray-600 hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-100 hover:text-gray-900 hover:shadow-md"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:shadow-md hover:scale-[1.02]",
              "text-sm font-medium"
            )}
            onClick={() => {
              markAsViewed(item.href);
              setMobileOpen(false);
            }}
          >
            {collapsed ? (
              // Collapsed state - premium icon with tooltip
              <SidebarTooltip content={item.label} side="right" delayDuration={150}>
                <div className="relative transform transition-transform duration-300 group-hover:scale-110">
                  <item.icon className="h-5 w-5 shrink-0 stroke-[1.5]" />
                  {hasMainItemNotification(item) && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <div className="relative w-1.5 h-1.5">
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  )}
                </div>
              </SidebarTooltip>
            ) : (
              // Expanded state - enhanced visibility with animations
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0 z-10">
                  <div className={cn(
                    "flex items-center justify-center w-5 h-5 transition-all duration-300 shrink-0 transform",
                    isActive
                      ? "text-blue-600 scale-110"
                      : "text-gray-500 group-hover:text-blue-600 group-hover:scale-110"
                  )}>
                    <item.icon className="h-5 w-5 shrink-0 stroke-[1.5]" />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={cn(
                      "font-semibold text-[13px] leading-none transition-all duration-300",
                      isActive
                        ? "text-blue-700"
                        : "text-gray-700 group-hover:text-gray-900 group-hover:translate-x-1"
                    )}>{item.label}</span>
                    {hasMainItemNotification(item) && (
                      <div className="relative w-1.5 h-1.5 shrink-0">
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Sophisticated hover shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none transform -skew-x-12"></div>
              </>
            )}
          </Link>
        )}

        {/* Sub-menu items with clean animation */}
        {item.subItems && !collapsed && (
          <div
            className={cn(
              "overflow-hidden transition-all duration-200 ease-out",
              expanded ? "max-h-[1000px] opacity-100 mt-1 mb-1" : "max-h-0 opacity-0 mt-0 mb-0"
            )}
          >
            <div className="space-y-0.5 py-1">
              {item.subItems.map((subItem) => (
                <NavItemComponent key={subItem.href} item={subItem} level={level + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Set CSS custom property for sidebar width
  React.useEffect(() => {
    const sidebarWidth = collapsed ? '64px' : '256px';
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
  }, [collapsed]);

  // Initialize CSS custom property on mount
  React.useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '256px');
  }, []);

  // Prevent page scroll when sidebar is hovered
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (sidebarHovered) {
        e.preventDefault();
      }
    };

    if (sidebarHovered) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('wheel', handleWheel, { passive: false });
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('wheel', handleWheel);
    };
  }, [sidebarHovered]);

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
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">GoLive DevOps</h1>
        </div>
      </div>

      {/* Sidebar - Ultra-premium design with depth */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          "bg-gradient-to-b from-white via-gray-50/30 to-white",
          "border-r border-gray-200 shadow-xl shadow-gray-200/50",
          "overscroll-contain sidebar-hover-no-scroll",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          className
        )}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const nav = e.currentTarget.querySelector('nav');
          if (nav && nav.scrollHeight > nav.clientHeight) {
            nav.scrollTop += e.deltaY;
          }
        }}
      >
        {/* Header - Ultra-premium design with enhanced interactions */}
        <div className={cn(
          "h-16 flex items-center border-b border-gray-200/80 bg-gradient-to-r from-white via-gray-50/20 to-white transition-all duration-300",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="group flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex-shrink-0 relative overflow-hidden shadow-md shadow-gray-900/20 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/30 hover:scale-105 cursor-pointer">
                  <img
                    src="/GoLive.png"
                    alt="GoLive Logo"
                    className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-110"
                    style={{
                      mixBlendMode: 'multiply',
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                  {/* Subtle shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold tracking-tight text-gray-900 truncate">GoLive DevOps</span>
                  <span className="text-[10px] font-semibold text-gray-500 truncate uppercase tracking-wider">Platform</span>
                </div>
              </div>
              {/* Desktop collapse button - Bold hover effects */}
              <button
                onClick={() => handleSidebarToggle(!collapsed)}
                className="group flex items-center justify-center w-7 h-7 rounded-lg bg-white hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-50 transition-all duration-300 hover:scale-110 hover:shadow-md shadow-sm border border-gray-200 hover:border-blue-300"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="group hidden lg:flex items-center justify-center w-10 h-10 rounded-lg bg-white hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-50 transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-md border border-gray-200 hover:border-blue-300"
              onClick={() => handleSidebarToggle(false)}
            >
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110" />
            </button>
          )}

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 ml-2"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation - Clean scrollable area */}
        <nav className={cn(
          "flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          collapsed ? "px-2 py-3" : "px-3 py-3"
        )} style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </nav>

        {/* Footer - Ultra-premium user profile with hover effects */}
        <div className={cn(
          "border-t border-gray-200/80 transition-all duration-300 bg-gradient-to-r from-white via-gray-50/20 to-white",
          collapsed ? "p-2" : "p-3"
        )}>
          <div className="group flex items-center gap-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/30 p-1.5 -m-1.5 hover:shadow-sm hover:scale-[1.02]">
            <div className={cn(
              "flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold transition-all duration-300 shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 group-hover:scale-105 relative overflow-hidden",
              collapsed ? "h-10 w-10 mx-auto rounded-lg text-xs" : "h-8 w-8 rounded-lg text-xs"
            )}>
              <span className="relative z-10">JD</span>
              {/* Subtle shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
            {!collapsed && (
              <div className="flex-1 truncate">
                <p className="text-[13px] font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">John Doe</p>
                <p className="text-[11px] font-medium text-gray-500 group-hover:text-gray-700 transition-colors duration-300">john@golive.dev</p>
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