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
    dashboard: true, // Always viewed - no green dot
    pipelines: false, // Show green dots
    deployments: false, // Show green dots
    testing: false, // Show green dots
    monitoring: false, // Show green dots
    analytics: false, // Show green dots
    settings: true // Always viewed - no green dot
  });
  const [sidebarHovered, setSidebarHovered] = useState(false);
  
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
      // Sub-item styling - modern industry standard design with full names
      return (
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center gap-3 rounded-lg px-4 py-2.5 ml-2 text-sm font-medium transition-all duration-75 ease-out",
            isActive
              ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/5 text-blue-700 border border-blue-200/50 backdrop-blur-sm"
              : "text-slate-600 border border-transparent hover:text-slate-800 hover:bg-white/70 hover:border-slate-200/30"
          )}
          onClick={() => {
            markAsViewed(item.href);
            setMobileOpen(false);
          }}
        >
          {/* Enhanced icon with background */}
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-75 shrink-0",
            isActive 
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white" 
              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
          )}>
            <item.icon className="w-4 h-4 stroke-2" />
          </div>
          
          {/* Text content with green dot - NO TRUNCATION */}
          <div className="flex items-center gap-1 flex-1">
            <span className="font-medium whitespace-nowrap">{item.label}</span>
            {/* Green dot for sub-items with updates */}
            {(() => {
              // Get parent key from the current navigation structure
              const parentItem = navigationItems.find(nav => nav.subItems?.some(sub => sub.href === item.href));
              const parentKey = parentItem?.href.replace('/', '');
              return parentKey && hasSubItemNotification(item, parentKey) && (
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/80"></div>
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-80"></div>
                </div>
              );
            })()}
          </div>
          
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
              "group relative flex items-center transition-all duration-75 ease-out overflow-hidden w-full text-left",
              collapsed 
                ? "justify-center w-12 h-12 rounded-xl mx-auto my-1"
                : "justify-between rounded-2xl px-4 py-4",
              isActive || expanded
                ? collapsed
                  ? (itemKey === 'dashboard' || itemKey === 'settings') 
                    ? "text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/50 ring-1 ring-blue-300/30 backdrop-blur-sm"
                    : "bg-gradient-to-br from-blue-500/90 to-indigo-600/90 text-white border border-blue-400/30 ring-1 ring-blue-300/40 backdrop-blur-sm"
                  : "bg-gradient-to-r from-white to-blue-50/50 text-slate-800 border border-blue-200/50 ring-1 ring-blue-300/20"
                : collapsed
                  ? "text-slate-700 bg-slate-200/80 border border-transparent ring-1 ring-transparent hover:text-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50/80 hover:border-blue-200/50 hover:ring-blue-300/30 backdrop-blur-sm"
                  : "text-slate-600 border border-transparent ring-1 ring-transparent hover:bg-gradient-to-r hover:from-white hover:to-blue-50/50 hover:text-slate-800 hover:border-blue-200/50 hover:ring-blue-300/20",
              "text-sm font-semibold backdrop-blur-sm"
            )}
            onClick={() => {
              // For dropdown items, different behavior based on sidebar state
              if (collapsed) {
                // If sidebar is collapsed, open it and expand this menu
                handleSidebarToggle(false);
                setExpandedItems(prev => ({
                  ...prev,
                  [itemKey]: true
                }));
              } else {
                // If sidebar is open, just toggle the menu
                toggleExpanded();
              }
              setMobileOpen(false);
            }}
          >
            {collapsed ? (
              // Collapsed state - enhanced icon with tooltip indicator
              <div className="relative flex items-center justify-center">
                <item.icon className="h-6 w-6 shrink-0 stroke-2" />
                {hasMainItemNotification(item) && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white ring-1 ring-green-300/50"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-80"></div>
                  </div>
                )}
              </div>
            ) : (
              // Expanded state - full layout
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0 overflow-visible">
                  <div className={cn(
                    "flex items-center justify-center rounded-xl p-2.5 transition-all duration-75 ease-out relative",
                    isActive || expanded
                      ? "bg-blue-50 text-blue-600 ring-2 ring-blue-200/30 border border-blue-200/40" 
                      : "bg-slate-200/80 text-slate-700 border border-transparent ring-2 ring-transparent group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-blue-200/30 group-hover:border-blue-200/40"
                  )}>
                    <item.icon className="h-6 w-6 shrink-0 stroke-2" />
                    {/* Subtle glow effect for active state */}
                    {(isActive || expanded) && (
                      <div className="absolute inset-0 rounded-xl bg-blue-100/30 animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className={cn(
                      "font-semibold text-base tracking-tight whitespace-nowrap",
                      isActive ? "text-slate-800" : "text-slate-700"
                    )}>{item.label}</span>
                    {hasMainItemNotification(item) && (
                      <div className="relative">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/80"></div>
                        <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-80"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.subItems && (
                    <div 
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-75 ease-out cursor-pointer",
                        expanded 
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white ring-2 ring-blue-300/50 rotate-90" 
                          : "bg-slate-200/80 text-slate-700 group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white group-hover:ring-2 group-hover:ring-blue-300/50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded();
                      }}
                    >
                      <ChevronRightIcon className="h-4 w-4 shrink-0 stroke-[2.5]" />
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
              "group relative flex items-center transition-all duration-75 ease-out overflow-hidden",
              collapsed 
                ? "justify-center w-12 h-12 rounded-xl mx-auto my-1"
                : "justify-between w-full rounded-2xl px-4 py-4",
              isActive
                ? collapsed
                  ? (itemKey === 'dashboard' || itemKey === 'settings')
                    ? "text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/50 ring-1 ring-blue-300/30 backdrop-blur-sm"
                    : "bg-gradient-to-br from-blue-500/90 to-indigo-600/90 text-white border border-blue-400/30 ring-1 ring-blue-300/40 backdrop-blur-sm"
                  : "bg-gradient-to-r from-white to-blue-50/50 text-slate-800 border border-blue-200/50 ring-1 ring-blue-300/20"
                : collapsed
                  ? "text-slate-700 bg-slate-200/80 border border-transparent ring-2 ring-transparent hover:text-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50/80 hover:border-blue-200/50 hover:ring-blue-300/30 backdrop-blur-sm"
                  : "text-slate-600 border border-transparent ring-1 ring-transparent hover:bg-white/80 hover:text-slate-800 hover:border-slate-200/50 hover:ring-blue-300/20",
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
                {hasMainItemNotification(item) && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white ring-1 ring-green-300/50"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-80"></div>
                  </div>
                )}
              </div>
            ) : (
              // Expanded state
              <>
                <div className="flex items-center gap-3 flex-1 min-w-0 overflow-visible">
                  <div className={cn(
                    "flex items-center justify-center rounded-xl p-2.5 transition-all duration-75 ease-out relative",
                    isActive 
                      ? "bg-blue-50 text-blue-600 ring-2 ring-blue-200/30 border border-blue-200/40" 
                      : "bg-slate-200/80 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-2 group-hover:ring-blue-200/30 group-hover:border group-hover:border-blue-200/40"
                  )}>
                    <item.icon className="h-6 w-6 shrink-0 stroke-2" />
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-blue-100/30 animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className={cn(
                      "font-semibold text-base tracking-tight whitespace-nowrap",
                      isActive ? "text-slate-800" : "text-slate-700"
                    )}>{item.label}</span>
                    {hasMainItemNotification(item) && (
                      <div className="relative">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/80"></div>
                        <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-80"></div>
                      </div>
                    )}
                  </div>
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

  // Set CSS custom property for sidebar width
  React.useEffect(() => {
    const sidebarWidth = collapsed ? '64px' : '320px';
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
  }, [collapsed]);

  // Initialize CSS custom property on mount
  React.useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '320px');
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
          <Bars3Icon className="h-6 w-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Comet DevOps</h1>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          "bg-white/95 backdrop-blur-xl border-r border-slate-200/50",
          "shadow-xl shadow-slate-200/20",
          "overscroll-contain sidebar-hover-no-scroll",
          collapsed ? "w-16" : "w-80",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          className
        )}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Allow scrolling within sidebar if it has scrollable content
          const nav = e.currentTarget.querySelector('nav');
          if (nav && nav.scrollHeight > nav.clientHeight) {
            nav.scrollTop += e.deltaY;
          }
        }}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-white/50 backdrop-blur-sm shadow-sm transition-all duration-300 box-border",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 flex-shrink-0 relative overflow-hidden">
                  <img 
                    src="/Comet.png" 
                    alt="Comet Logo" 
                    className="w-10 h-10 object-contain"
                    style={{ 
                      mixBlendMode: 'multiply',
                      filter: 'brightness(0) invert(1)'
                    }}
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold tracking-tight text-slate-900 truncate">Comet DevOps</span>
                  <span className="text-[10px] font-medium tracking-wide text-slate-500 truncate">DEVOPS PLATFORM</span>
                </div>
              </div>
              {/* Desktop collapse button - aligned with menu chevrons */}
              <div className="group flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ease-out bg-slate-200/80 hover:bg-gradient-to-br hover:from-blue-500 hover:to-indigo-600 hover:ring-2 hover:ring-blue-300/50 cursor-pointer mr-4" onClick={() => handleSidebarToggle(!collapsed)}>
                <ChevronLeftIcon className="h-4 w-4 shrink-0 stroke-[2.5] text-slate-700 group-hover:text-white" />
              </div>
            </>
          ) : (
            <button
              type="button"
              className={cn(
                "group relative flex items-center transition-all duration-300 ease-out overflow-hidden text-left hidden lg:flex",
                "justify-center w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 rounded-xl flex-shrink-0",
                "text-blue-600 hover:bg-gradient-to-br hover:from-blue-500 hover:to-indigo-600 hover:text-white hover:ring-2 hover:ring-blue-300/50",
                "text-sm font-semibold backdrop-blur-sm"
              )}
              onClick={() => handleSidebarToggle(false)}
            >
              <div className="relative flex items-center justify-center">
                <ChevronRightIcon className="h-6 w-6 shrink-0 stroke-2" />
              </div>
            </button>
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
          "flex-1 overflow-y-auto overscroll-contain sidebar-scroll-container scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent",
          "will-change-scroll transform-gpu",
          collapsed ? "p-2 space-y-3" : "p-4 space-y-3"
        )} style={{ 
          transform: 'translate3d(0,0,0)',
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div className="space-y-2" style={{ containIntrinsicSize: 'auto 1000px' }}>
            {navigationItems.map((item, index) => (
              <div key={item.href}>
                <NavItemComponent item={item} />
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
          collapsed ? "lg:ml-16" : "lg:ml-80"
        )}
      >
        {children}
      </div>
    </>
  );
}