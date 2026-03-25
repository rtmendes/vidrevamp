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

// ── AI cost estimation (USD per 1K tokens) ──────────────────────────────────
const AI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o':        { input: 0.005,   output: 0.015 },
  'gpt-4o-mini':   { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo':   { input: 0.01,    output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005,  output: 0.0015 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = AI_PRICING[model] ?? AI_PRICING['gpt-4o'];
  return (inputTokens / 1000) * p.input + (outputTokens / 1000) * p.output;
}
