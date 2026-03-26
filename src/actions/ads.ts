'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logUsageEvent } from './log-usage';
import { calculateBrandMonthlySpend } from '@/lib/utils/spendEstimator';
import { searchFbAdLibrary, searchTikTok, searchYouTube } from './scrape-creators';
import type { ScFbAd, ScTikTokVideo, ScYouTubeVideo } from './scrape-creators';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdCreative {
  id: string;
  competitor_id: string;
  external_ad_id: string;
  platform: string;
  video_url: string;
  thumbnail_url: string | null;
  transcript: string | null;
  ad_copy: string | null;
  call_to_action: string | null;
  landing_url: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  days_active: number;
  engagement_data: { views?: number; likes?: number; shares?: number; comments?: number } | null;
  discovered_at: string;
  competitor?: { name: string; platform: string };
  estimated_spend?: number;
}

export interface Competitor {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  external_url: string | null;
  est_monthly_spend: number;
  alerts_enabled: boolean;
  last_scraped_at: string;
  ads?: AdCreative[];
}

// ── Cost Logger (extends existing logUsageEvent) ──────────────────────────────

async function logAdIntelCost(params: {
  provider: 'SCRAPE_CREATORS' | 'OPENAI' | 'YOUTUBE_API';
  endpoint: string;
  unitsUsed: number;
  costUsd: number;
  status?: 'success' | 'error';
}) {
  const supabase = createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;

  // Write to new api_usage_logs table
  await supabase.from('api_usage_logs').insert({
    user_id: userId,
    provider: params.provider,
    endpoint: params.endpoint,
    units_used: params.unitsUsed,
    cost_usd: params.costUsd,
    status: params.status === 'error' ? 'FAILED' : 'SUCCESS',
  });

  // Also fire the existing usage_events logger for the ops dashboard
  await logUsageEvent({
    integration: 'ad_intel',
    use_case: 'ad_sync',
    cost_usd: params.costUsd,
    metadata: { provider: params.provider, endpoint: params.endpoint, units: params.unitsUsed },
    status: params.status ?? 'success',
  });
}

// ── Competitors CRUD ──────────────────────────────────────────────────────────

export async function getTrackedCompetitors(): Promise<{ success: boolean; data: Competitor[]; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('competitors')
      .select('*, ads:ad_creatives(*)')
      .order('created_at', { ascending: false });

    if (error) return { success: false, data: [], error: error.message };

    // Attach computed monthly spend to each competitor
    const enriched = (data ?? []).map((c: Competitor & { ads?: AdCreative[] }) => ({
      ...c,
      est_monthly_spend: calculateBrandMonthlySpend(c.ads ?? []),
    }));

    return { success: true, data: enriched };
  } catch (e) {
    return { success: false, data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function addCompetitor(params: {
  name: string;
  platform: 'META' | 'TIKTOK' | 'YOUTUBE';
  externalUrl?: string;
}): Promise<{ success: boolean; data?: Competitor; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('competitors')
      .insert({
        name: params.name,
        platform: params.platform,
        external_url: params.externalUrl ?? null,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function toggleCompetitorAlerts(
  competitorId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('competitors')
      .update({ alerts_enabled: enabled })
      .eq('id', competitorId);

    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ── Ad Creatives Fetch ────────────────────────────────────────────────────────

export async function getAdCreatives(params?: {
  platform?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  search?: string;
  limit?: number;
}): Promise<{ success: boolean; data: AdCreative[]; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from('ad_creatives')
      .select('*, competitor:competitors(name, platform)')
      .order('days_active', { ascending: false })
      .limit(params?.limit ?? 50);

    if (params?.platform && params.platform !== 'All') {
      query = query.eq('platform', params.platform.toUpperCase());
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.search?.trim()) {
      query = query.or(
        `ad_copy.ilike.%${params.search}%,transcript.ilike.%${params.search}%`
      );
    }

    const { data, error } = await query;
    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: data ?? [] };
  } catch (e) {
    return { success: false, data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ── Live Scrape → DB Upsert ───────────────────────────────────────────────────

const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function scrapeAndSaveAds(params: {
  brandName: string;
  platform: 'META' | 'TIKTOK' | 'YOUTUBE';
  maxResults?: number;
}): Promise<{ success: boolean; source: 'cache' | 'live'; count: number; error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  try {
    // ── 1. Cache check ─────────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('competitors')
      .select('id, last_scraped_at')
      .eq('name', params.brandName)
      .eq('platform', params.platform)
      .single();

    if (existing && Date.now() - new Date(existing.last_scraped_at).getTime() < STALE_MS) {
      return { success: true, source: 'cache', count: 0 };
    }

    // ── 2. Live scrape via ScrapeCreators ──────────────────────────────────
    const maxResults = params.maxResults ?? 25;
    let scrapedAds: Array<{ externalAdId: string; thumbnailUrl?: string; videoUrl?: string; adCopy?: string; cta?: string; landingUrl?: string; isActive: boolean; views?: number; likes?: number; shares?: number; comments?: number; daysActive: number }> = [];

    if (params.platform === 'META') {
      const r = await searchFbAdLibrary(params.brandName, 'US', maxResults);
      if (!r.success) throw new Error(r.error ?? 'FB scrape failed');
      scrapedAds = r.results.map((ad: ScFbAd) => ({
        externalAdId: `fb_${ad.id}`,
        thumbnailUrl: ad.thumbnailUrl,
        videoUrl: ad.videoUrl,
        adCopy: ad.adCreativeBody,
        cta: ad.callToAction,
        landingUrl: undefined,
        isActive: ad.isActive,
        daysActive: ad.startDate
          ? Math.max(1, Math.floor((Date.now() - new Date(ad.startDate).getTime()) / 86400000))
          : 1,
        views: ad.impressionsUpper,
      }));
      // Cost: ScrapeCreators charges ~$0.0017 per result
      await logAdIntelCost({ provider: 'SCRAPE_CREATORS', endpoint: 'fb_ad_library', unitsUsed: scrapedAds.length, costUsd: scrapedAds.length * 0.0017 });
    } else if (params.platform === 'TIKTOK') {
      const r = await searchTikTok(params.brandName, maxResults);
      if (!r.success) throw new Error(r.error ?? 'TikTok scrape failed');
      scrapedAds = r.results.map((v: ScTikTokVideo) => ({
        externalAdId: `tt_${v.id}`,
        thumbnailUrl: v.thumbnail,
        videoUrl: v.url,
        adCopy: v.desc,
        isActive: true,
        daysActive: 1,
        views: v.views,
        likes: v.likes,
        shares: v.shares,
        comments: v.comments,
      }));
      await logAdIntelCost({ provider: 'SCRAPE_CREATORS', endpoint: 'tiktok_search', unitsUsed: scrapedAds.length, costUsd: scrapedAds.length * 0.0017 });
    } else {
      const r = await searchYouTube(params.brandName, maxResults);
      if (!r.success) throw new Error(r.error ?? 'YouTube scrape failed');
      scrapedAds = r.results.map((v: ScYouTubeVideo) => ({
        externalAdId: `yt_${v.id}`,
        thumbnailUrl: v.thumbnail,
        videoUrl: v.url,
        adCopy: v.description,
        isActive: true,
        daysActive: 1,
        views: v.views,
        likes: v.likes,
      }));
      await logAdIntelCost({ provider: 'SCRAPE_CREATORS', endpoint: 'youtube_search', unitsUsed: scrapedAds.length, costUsd: scrapedAds.length * 0.0024 });
    }

    // ── 3. Upsert competitor row ───────────────────────────────────────────
    const { data: competitor, error: compErr } = await supabase
      .from('competitors')
      .upsert(
        {
          ...(existing?.id ? { id: existing.id } : {}),
          name: params.brandName,
          platform: params.platform,
          last_scraped_at: new Date().toISOString(),
          ...(userId ? { user_id: userId } : {}),
        },
        { onConflict: 'user_id,name,platform' }
      )
      .select()
      .single();

    if (compErr || !competitor) throw new Error(compErr?.message ?? 'Competitor upsert failed');

    // ── 4. Upsert ad creatives ─────────────────────────────────────────────
    for (const ad of scrapedAds) {
      await supabase.from('ad_creatives').upsert(
        {
          competitor_id: competitor.id,
          external_ad_id: ad.externalAdId,
          platform: params.platform,
          video_url: ad.videoUrl ?? '',
          thumbnail_url: ad.thumbnailUrl ?? null,
          ad_copy: ad.adCopy ?? null,
          call_to_action: ad.cta ?? null,
          landing_url: ad.landingUrl ?? null,
          status: ad.isActive ? 'ACTIVE' : 'INACTIVE',
          days_active: ad.daysActive,
          engagement_data: {
            views: ad.views ?? 0,
            likes: ad.likes ?? 0,
            shares: ad.shares ?? 0,
            comments: ad.comments ?? 0,
          },
        },
        { onConflict: 'external_ad_id' }
      );
    }

    return { success: true, source: 'live', count: scrapedAds.length };
  } catch (e) {
    await logAdIntelCost({ provider: 'SCRAPE_CREATORS', endpoint: 'unknown', unitsUsed: 0, costUsd: 0, status: 'error' });
    return { success: false, source: 'live', count: 0, error: e instanceof Error ? e.message : 'Scrape failed' };
  }
}

// ── Swipe File ────────────────────────────────────────────────────────────────

export async function saveAdToSwipeFile(params: {
  adId: string;
  folderName?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };

    // Ensure folder exists
    const folderName = params.folderName ?? 'Uncategorized';
    const { data: folder } = await supabase
      .from('swipe_folders')
      .upsert({ user_id: userId, name: folderName }, { onConflict: 'user_id,name' })
      .select('id')
      .single();

    const { error } = await supabase.from('swipe_saves').upsert(
      { user_id: userId, ad_id: params.adId, folder_id: folder?.id ?? null, notes: params.notes ?? null },
      { onConflict: 'user_id,ad_id' }
    );

    return error ? { success: false, error: error.message } : { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getSwipeFile(): Promise<{ success: boolean; data: AdCreative[]; error?: string }> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('swipe_saves')
      .select('ad:ad_creatives(*, competitor:competitors(name, platform)), folder:swipe_folders(name), notes')
      .order('created_at', { ascending: false });

    if (error) return { success: false, data: [], error: error.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { success: true, data: (data ?? []).map((s: any) => s.ad).filter(Boolean) as AdCreative[] };
  } catch (e) {
    return { success: false, data: [], error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
