import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function getOutlierColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-zinc-400';
}

export function getOutlierLabel(score: number): string {
  if (score >= 8) return 'Mega Outlier';
  if (score >= 5) return 'Outlier';
  return 'Average';
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'YOUTUBE': return 'bg-red-500';
    case 'TIKTOK': return 'bg-zinc-100 text-zinc-900';
    case 'INSTAGRAM': return 'bg-gradient-to-r from-purple-500 to-pink-500';
    default: return 'bg-zinc-600';
  }
}
