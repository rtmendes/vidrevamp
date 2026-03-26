/**
 * VidRevamp — Spend Estimation Engine
 *
 * Platforms don't expose real ad spend. We use two proxy models:
 *  1. Time-Velocity (Meta): tiered daily budget based on how long an ad survived
 *  2. Impression-Velocity (TikTok / YouTube): views × estimated CPM
 */

// ── 1. Meta Time-Velocity Model ───────────────────────────────────────────────

/**
 * Estimate total historical spend for a Meta ad based on days active.
 * Returns a 30-day rolling average (i.e. "monthly spend" number).
 *
 * Phase logic:
 *  Days  1-5  → $50/day  (testing)
 *  Days  6-14 → $150/day (optimization)
 *  Days 15-30 → $400/day (scaling)
 *  Days 31+   → $1,000/day (mega-scale)
 */
export function estimateMetaAdSpend(daysActive: number): number {
  if (daysActive <= 0) return 0;

  let totalSpend = 0;

  // Phase 1: Days 1–5 ($50/day)
  const phase1Days = Math.min(daysActive, 5);
  totalSpend += phase1Days * 50;

  // Phase 2: Days 6–14 ($150/day)
  if (daysActive > 5) {
    const phase2Days = Math.min(daysActive - 5, 9);
    totalSpend += phase2Days * 150;
  }

  // Phase 3: Days 15–30 ($400/day)
  if (daysActive > 14) {
    const phase3Days = Math.min(daysActive - 14, 16);
    totalSpend += phase3Days * 400;
  }

  // Phase 4: Days 31+ ($1,000/day)
  if (daysActive > 30) {
    const phase4Days = daysActive - 30;
    totalSpend += phase4Days * 1000;
  }

  // Convert to 30-day average monthly spend
  const avgDailySpend = totalSpend / daysActive;
  return avgDailySpend * 30;
}

// ── 2. Impression-Velocity Model (TikTok / YouTube) ──────────────────────────

/**
 * Estimate total paid spend from view count and platform CPM.
 * CPMs: TikTok $10 | YouTube $15
 */
export function estimateVideoAdSpend(
  views: number,
  platform: 'TIKTOK' | 'YOUTUBE'
): number {
  const cpm = platform === 'TIKTOK' ? 10 : 15;
  return (views / 1000) * cpm;
}

// ── 3. Brand Aggregation ──────────────────────────────────────────────────────

export interface AdForEstimation {
  platform: string;                 // 'META' | 'TIKTOK' | 'YOUTUBE'
  status: string;                   // 'ACTIVE' | 'INACTIVE'
  days_active?: number;             // snake_case from DB
  daysActive?: number;              // camelCase fallback
  engagement_data?: { views?: number } | null;  // snake_case from DB
  engagementData?: { views?: number } | null;   // camelCase fallback
}

/**
 * Sum estimated monthly spend across all active ads for a competitor.
 * This powers the "$320K" badge on Competitor Cards.
 */
export function calculateBrandMonthlySpend(ads: AdForEstimation[]): number {
  let total = 0;

  for (const ad of ads) {
    if (ad.status !== 'ACTIVE') continue;
    const days = ad.days_active ?? ad.daysActive ?? 0;
    const views = (ad.engagement_data ?? ad.engagementData)?.views ?? 0;

    if (ad.platform === 'META') {
      total += estimateMetaAdSpend(days);
    } else if (ad.platform === 'TIKTOK' || ad.platform === 'YOUTUBE') {
      total += estimateVideoAdSpend(views, ad.platform as 'TIKTOK' | 'YOUTUBE');
    }
  }

  return total;
}

// ── 4. Display Formatter ──────────────────────────────────────────────────────

/** Turns 320000 → "$320K", 1500000 → "$1.5M", 900 → "$900" */
export function formatSpend(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount)}`;
}

/** Color class based on spend tier — for badge styling */
export function spendColorClass(amount: number): string {
  if (amount >= 100_000) return 'text-red-400 bg-red-950/60 border-red-700/30';
  if (amount >= 50_000) return 'text-orange-400 bg-orange-950/60 border-orange-700/30';
  return 'text-yellow-400 bg-yellow-950/60 border-yellow-700/30';
}
