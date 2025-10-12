import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

export interface KpiMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  delta?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  icon?: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
}

const colorSchemes: Record<NonNullable<KpiMetricProps["color"]>, {
  value: string;
  delta: string;
  icon: string;
  iconBg: string;
  iconHover: string;
  iconBgHover: string;
  hover: string;
  selected: string;
  selectedIconBg: string;
  indicatorDot: string;
  deltaBorder: string;
}> = {
  blue: {
    value: "text-blue-600",
    delta: "text-blue-500",
    icon: "text-blue-500",
    iconBg: "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50",
    iconHover: "group-hover:text-white group-hover:drop-shadow-sm",
    iconBgHover: "group-hover:from-blue-500 group-hover:to-blue-600 group-hover:border-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/25",
    hover: "hover:bg-blue-50/50 hover:border-blue-200",
    selected: "bg-blue-50 border-blue-300 shadow-lg shadow-blue-500/10",
    selectedIconBg: "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500",
    indicatorDot: "bg-blue-600",
    deltaBorder: "border-blue-200/60"
  },
  green: {
    value: "text-emerald-600",
    delta: "text-emerald-500", 
    icon: "text-emerald-500",
    iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50",
    iconHover: "group-hover:text-white group-hover:drop-shadow-sm",
    iconBgHover: "group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:border-emerald-500 group-hover:shadow-lg group-hover:shadow-emerald-500/25",
    hover: "hover:bg-emerald-50/50 hover:border-emerald-200",
    selected: "bg-emerald-50 border-emerald-300 shadow-lg shadow-emerald-500/10",
    selectedIconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500",
    indicatorDot: "bg-emerald-600",
    deltaBorder: "border-emerald-200/60"
  },
  purple: {
    value: "text-purple-600",
    delta: "text-purple-500",
    icon: "text-purple-500",
    iconBg: "bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50",
    iconHover: "group-hover:text-white group-hover:drop-shadow-sm",
    iconBgHover: "group-hover:from-purple-500 group-hover:to-purple-600 group-hover:border-purple-500 group-hover:shadow-lg group-hover:shadow-purple-500/25",
    hover: "hover:bg-purple-50/50 hover:border-purple-200",
    selected: "bg-purple-50 border-purple-300 shadow-lg shadow-purple-500/10",
    selectedIconBg: "bg-gradient-to-br from-purple-500 to-purple-600 border-purple-500",
    indicatorDot: "bg-purple-600",
    deltaBorder: "border-purple-200/60"
  },
  orange: {
    value: "text-orange-600",
    delta: "text-orange-500",
    icon: "text-orange-500",
    iconBg: "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50",
    iconHover: "group-hover:text-white group-hover:drop-shadow-sm",
    iconBgHover: "group-hover:from-orange-500 group-hover:to-orange-600 group-hover:border-orange-500 group-hover:shadow-lg group-hover:shadow-orange-500/25",
    hover: "hover:bg-orange-50/50 hover:border-orange-200",
    selected: "bg-orange-50 border-orange-300 shadow-lg shadow-orange-500/10",
    selectedIconBg: "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-500",
    indicatorDot: "bg-orange-600",
    deltaBorder: "border-orange-200/60"
  },
  red: {
    value: "text-red-600", 
    delta: "text-red-500",
    icon: "text-red-500",
    iconBg: "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50",
    iconHover: "group-hover:text-white group-hover:drop-shadow-sm",
    iconBgHover: "group-hover:from-red-500 group-hover:to-red-600 group-hover:border-red-500 group-hover:shadow-lg group-hover:shadow-red-500/25",
    hover: "hover:bg-red-50/50 hover:border-red-200",
    selected: "bg-red-50 border-red-300 shadow-lg shadow-red-500/10",
    selectedIconBg: "bg-gradient-to-br from-red-500 to-red-600 border-red-500",
    indicatorDot: "bg-red-600",
    deltaBorder: "border-red-200/60"
  },
};

export function KpiMetric({ 
  label, 
  value, 
  delta, 
  color = "blue", 
  icon, 
  selected = false,
  onSelect,
  className, 
  ...props 
}: KpiMetricProps) {
  const scheme = colorSchemes[color];
  
  return (
    <div 
      className={cn(
        "group relative cursor-pointer rounded-3xl p-8 transition-all duration-300 border shadow-sm",
        "hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-900/5",
        selected 
          ? `${scheme.selected}` 
          : `bg-white border-gray-100/50 ${scheme.hover}`,
        className
      )} 
      onClick={onSelect}
      {...props}
    >
      
      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-4 right-4">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", scheme.indicatorDot)} />
        </div>
      )}

      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-8">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 backdrop-blur-sm",
          "group-hover:scale-110 group-hover:-translate-y-1",
          selected 
            ? scheme.selectedIconBg 
            : cn(scheme.iconBg, scheme.iconBgHover)
        )}>
          <div className={cn(
            "text-2xl transition-all duration-300 transform",
            "group-hover:scale-110",
            selected ? "text-white drop-shadow-sm" : cn(scheme.icon, scheme.iconHover)
          )}>
            {icon}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Value - The star of the show */}
        <div className={cn(
          "text-5xl font-bold tracking-tight leading-none transition-all duration-300",
          "group-hover:scale-105",
          scheme.value
        )}>
          {value}
        </div>

        {/* Label */}
        <h3 className={cn(
          "text-lg font-semibold leading-tight transition-colors duration-300",
          selected ? "text-gray-900" : "text-gray-700 group-hover:text-gray-900"
        )}>
          {label}
        </h3>

        {/* Delta */}
        {delta && (
          <div className={cn("pt-3 border-t-2 transition-colors duration-300", scheme.deltaBorder)}>
            <span className={cn(
              "text-sm font-medium transition-all duration-300",
              "group-hover:font-semibold",
              scheme.delta
            )}>
              {delta}
            </span>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className={cn(
        "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
        selected 
          ? `bg-gradient-to-br ${scheme.value.replace('text-', 'from-')}/5 to-transparent` 
          : `bg-gradient-to-br from-gray-500/5 to-transparent`
      )} />
    </div>
  );
}
