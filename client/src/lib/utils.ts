import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = bytes;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(value * 100) / 100} ${units[unitIndex]}`;
}

export function generateIncidentId(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `INC-${year}-${timestamp}`;
}

export function generateThreatId(): string {
  const timestamp = Date.now().toString().slice(-8);
  return `THR-${timestamp}`;
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical': return 'text-red-400';
    case 'high': return 'text-orange-400';
    case 'medium': return 'text-yellow-400';
    case 'low': return 'text-green-400';
    default: return 'text-gray-400';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'resolved': return 'text-green-400';
    case 'investigating': return 'text-yellow-400';
    case 'analyzing': return 'text-blue-400';
    case 'open': return 'text-red-400';
    default: return 'text-gray-400';
  }
}
