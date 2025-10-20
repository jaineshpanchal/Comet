"use client";

import React, { useState, useEffect } from "react";
import {
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RocketLaunchIcon,
  UserIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Activity {
  id: string;
  type: string;
  action: string;
  resource: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  limit?: number;
  showLiveIndicator?: boolean;
}

export default function ActivityFeed({ limit = 20, showLiveIndicator = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState(0);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

  const { status } = useWebSocket({
    url: `${WS_URL}/ws`,
    enabled: true,
    onMessage: (message) => {
      if (message.type === "activity") {
        setActivities((prev) => [message.data, ...prev].slice(0, limit));
        setLiveUpdates((prev) => prev + 1);
      }
    },
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("golive_jwt");
      const response = await fetch(
        `http://localhost:8000/api/metrics/activities?limit=${limit}&type=all`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setActivities(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "pipeline":
        return BoltIcon;
      case "deployment":
        return RocketLaunchIcon;
      case "test":
        return CheckCircleIcon;
      case "build":
        return CodeBracketIcon;
      case "user":
        return UserIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (action: string) => {
    if (action.includes("success") || action.includes("completed")) {
      return "text-green-600 bg-green-100";
    }
    if (action.includes("failed") || action.includes("error")) {
      return "text-red-600 bg-red-100";
    }
    if (action.includes("started") || action.includes("running")) {
      return "text-blue-600 bg-blue-100";
    }
    return "text-gray-600 bg-gray-100";
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showLiveIndicator && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                status === "connected" ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {status === "connected" ? "Live" : "Reconnecting..."}
            </span>
          </div>
          {liveUpdates > 0 && (
            <span className="text-xs text-blue-600 font-medium">
              {liveUpdates} new {liveUpdates === 1 ? "update" : "updates"}
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.action);

            return (
              <div
                key={activity.id}
                className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className={`p-2.5 rounded-lg ${colorClass} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{activity.userName}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(activity.metadata).slice(0, 3).map(([key, value]) => (
                        <span
                          key={key}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
