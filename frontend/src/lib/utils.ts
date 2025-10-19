import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "running":
    case "in_progress":
      return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
    case "success":
    case "completed":
    case "passed":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
    case "failed":
    case "error":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
    case "warning":
    case "unstable":
      return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20";
    case "pending":
    case "queued":
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
    case "cancelled":
    case "stopped":
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
}

export function parseGitUrl(url: string) {
  const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
  if (match) {
    return {
      platform: "github",
      owner: match[1],
      repo: match[2],
    };
  }
  return null;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function camelToKebab(str: string) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

export function kebabToCamel(str: string) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}