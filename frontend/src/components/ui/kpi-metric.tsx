import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

export interface KpiMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  delta?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  icon?: React.ReactNode;
}

const colorMap: Record<NonNullable<KpiMetricProps["color"]>, string> = {
  blue: "text-blue-600 bg-blue-50 border border-blue-100",
  green: "text-emerald-600 bg-emerald-50 border border-emerald-100",
  purple: "text-purple-600 bg-purple-50 border border-purple-100",
  orange: "text-orange-600 bg-orange-50 border border-orange-100",
  red: "text-red-600 bg-red-50 border border-red-100",
};

export function KpiMetric({ label, value, delta, color = "blue", icon, className, ...props }: KpiMetricProps) {
  return (
    <Card className={cn("group border-neutral-200/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-neutral-900/5", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
            <div className="space-y-1">
              <p className={cn("text-3xl font-bold tracking-tight", 
                color === "green" ? "text-emerald-600" : 
                color === "orange" ? "text-orange-600" : 
                color === "purple" ? "text-purple-600" : 
                color === "red" ? "text-red-600" : "text-blue-600"
              )}>
                {value}
              </p>
              {delta && (
                <p className="text-sm text-neutral-600 font-medium">{delta}</p>
              )}
            </div>
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105", colorMap[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
