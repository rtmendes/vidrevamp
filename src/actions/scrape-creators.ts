'use server';

import { logUsageEvent } from './log-usage';
import { createClient } from '@supabase/supabase-js';

const SC_BASE = 'https://api.scrapecreators.com';
const SC_KEY = process.env.SCRAPE_CREATORS_API_KEY ?? '';

function scHeaders() {
  return { 'x-api-key': SC_KEY, 'Content-Type': 'application/json' };
}

// ── Shared result types ───────────────────────────────────────────────────────

export interface ScYouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  channelHandle: string;
  views: number;
  likes: number;
  publishedAt: string;
  duration: string;
  url: string;
  isShort: boolean;
}

export interface ScFbAd {
  id: string;
  pageName: string;
  pageId: string;
  adCreativeBody: string;
  adCreativeLinkTitle: string;
  adCreativeLinkDescription: string;
  callToAction: string;
  startDate: string;
  platforms: string[];
  currency: string;
  spendLower?: number;
  spendUpper?: number;
  impressionsLower?: number;
  impressionsUpper?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  isActive: boolean;
}

export interface ScTikTokVideo {
  id: string;
  desc: string;
  author: string;
  authorNickname: string;
  authorAvatar: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  thumbnail: string;
  url: string;
  createTime: number;
  duration: number;
}

export type ScSearchSource = 'youtube' | 'facebook-ads' | 'tiktok';

export interface ScSearchResult<T> {
  success: boolean;
  source: ScSearchSource;
  results: T[];
  error?: string;
  noApiKey?: boolean;
}

// ── YouTube Search ────────────────────────────────────────────────────────────

export async function searchYouTube(
  query: string,
  limit = 20,
): Promise<ScSearchResult<ScYouTubeVideo>> {
  if (!SC_KEY) return { success: false, source: 'youtube', results: [], noApiKey: true };
  const t0 = Date.now();
  try {
    const url = `${SC_BASE}/v1/youtube/search?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: scHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();

    // ScrapeCreators returns { videos: [...] } or an array directly
    const raw: unknown[] = Array.isArray(data) ? data : (data.videos ?? data.items ?? data.results ?? []);

    const results: ScYouTubeVideo[] = raw.slice(0, limit).map((v: unknown) => {
      const item = v as Record<string, unknown>;
      const snippet = (item.snippet ?? {}) as Record<string, unknown>;
      const stats = (item.statistics ?? {}) as Record<string, unknown>;
      const id = (item.id as Record<string, unknown>)?.videoId ?? item.videoId ?? item.id ?? '';
      return {
        id: String(id),
        title: String(item.title ?? snippet.title ?? ''),
        description: String(item.description ?? snippet.description ?? ''),
        thumbnail: String(
          item.thumbnail ??
          (snippet.thumbnails as Record<string, Record<string, unknown>> | undefined)?.high?.url ??
          (snippet.thumbnails as Record<string, Record<string, unknown>> | undefined)?.medium?.url ??
          `https://img.youtube.com/vi/${id}/hqdefault.jpg`
        ),
        channelName: String(item.channelName ?? item.channel ?? snippet.channelTitle ?? ''),
        channelHandle: String(item.channelHandle ?? item.channelId ?? ''),
        views: Number(item.views ?? stats.viewCount ?? 0),
        likes: Number(item.likes ?? stats.likeCount ?? 0),
        publishedAt: String(item.publishedAt ?? item.publishDate ?? snippet.publishedAt ?? ''),
        duration: String(item.duration ?? (item.contentDetails as Record<string, unknown> | undefined)?.duration ?? ''),
        url: `https://youtube.com/watch?v=${id}`,
        isShort: Boolean(item.isShort ?? false),
      };
    });

    await logUsageEvent({
      integration: 'scrape_creators',
      use_case: 'youtube_search',
      model: 'n/a',
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { query, count: results.length },
    });

    return { success: true, source: 'youtube', results };
  } catch (err) {
    await logUsageEvent({
      integration: 'scrape_creators',
      use_case: 'youtube_search',
      model: 'n/a',
      duration_ms: Date.now() - t0,
      status: 'error',
    });
    return {
      success: false,
      source: 'youtube',
      results: [],
      error: err instanceof Error ? err.message : 'Search failed',
    };
  }
}

// ── Facebook Ad Library Search ────────────────────────────────────────────────

export async function searchFbAdLibrary(
  query: string,
  country = 'US',
  limit = 20,
): Promise<ScSearchResult<ScFbAd>> {
  if (!SC_KEY) return { success: false, source: 'facebook-ads', results: [], noApiKey: true };
  const t0 = Date.now();
  try {
    const url = `${SC_BASE}/v1/facebook/adLibrary/search/ads?query=${encodeURIComponent(query)}&country=${country}`;
    const res = await fetch(url, { headers: scHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();

    const raw: unknown[] = Array.isArray(data) ? data : (data.ads ?? data.results ?? data.data ?? []);

    const results: ScFbAd[] = raw.slice(0, limit).map((v: unknown) => {
      const item = v as Record<string, unknown>;
      const creative = (item.adCreatives ?? item.ad_creative_bodies ?? []) as unknown[];
      const spend = (item.spend ?? {}) as Record<string, unknown>;
      const impressions = (item.impressions ?? {}) as Record<string, unknown>;
      const body = Array.isArray(creative) && creative.length > 0
        ? String(creative[0])
        : String(item.ad_creative_body ?? item.body ?? item.description ?? '');
      return {
        id: String(item.id ?? item.adArchiveID ?? Math.random()),
        pageName: String(item.pageName ?? item.page_name ?? ''),
        pageId: String(item.pageID ?? item.page_id ?? ''),
        adCreativeBody: body,
        adCreativeLinkTitle: String(item.ad_creative_link_title ?? item.linkTitle ?? ''),
        adCreativeLinkDescription: String(item.ad_creative_link_description ?? ''),
        callToAction: String(item.call_to_action_type ?? item.callToAction ?? ''),
        startDate: String(item.startDate ?? item.start_date ?? ''),
        platforms: Array.isArray(item.publisherPlatform) ? item.publisherPlatform.map(String) : [],
        currency: String(item.currency ?? 'USD'),
        spendLower: Number(spend.lower_bound ?? 0),
        spendUpper: Number(spend.upper_bound ?? 0),
        impressionsLower: Number(impressions.lower_bound ?? 0),
        impressionsUpper: Number(impressions.upper_bound ?? 0),
        thumbnailUrl: String((item.snapshot as Record<string, unknown[]> | undefined)?.images?.[0] ?? item.thumbnailUrl ?? ''),
        videoUrl: String((item.snapshot as Record<string, unknown[]> | undefined)?.videos?.[0] ?? ''),
        isActive: Boolean(item.isActive ?? item.active ?? true),
      };
    });

    await logUsageEvent({
      integration: 'scrape_creators',
      use_case: 'fb_ad_search',
      model: 'n/a',
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { query, country, count: results.length },
    });

    return { success: true, source: 'facebook-ads', results };
  } catch (err) {
    await logUsageEvent({
      integration: 'scrape_creators',
      use_case: 'fb_ad_search',
      model: 'n/a',
      duration_ms: Date.now() - t0,
      status: 'error',
    });
    return {
      success: false,
      source: 'facebook-ads',
      results: [],
      error: err instanceof Error ? err.message : 'Search failed',
    };
  }
}

// ── TikTok Search ─────────────────────────────────────────────────────────────

export async function searchTikTok(
  query: string,
  limit = 20,
): Promise<ScSearchResult<ScTikTokVideo>> {
  if (!SC_KEY) return { success: false, source: 'tiktok', results: [], noApiKey: true };
  const t0 = Date.now();
  try {
    const url = `${SC_BASE}/v1/tiktok/search?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: scHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();

    const raw: unknown[] = Array.isArray(data) ? data : (data.videos ?? data.items ?? data.data ?? []);

    const results: ScTikTokVideo[] = raw.slice(0, limit).map((v: unknown) => {
      const item = v as Record<string, unknown>;
      const author = (item.author ?? {}) as Record<string, unknown>;
      const stats = (item.stats ?? item.statistics ?? {}) as Record<string, unknown>;
      const video = (item.video ?? {}) as Record<string, unknown>;
      const id = String(item.id ?? '');
      return {
        id,
        desc: String(item.desc ?? item.description ?? ''),
        author: String(author.uniqueId ?? item.authorUniqueId ?? ''),
        authorNickname: String(author.nickname ?? item.authorNickname ?? ''),
        authorAvatar: String(author.avatarThumb ?? ''),
        views: Number(stats.playCount ?? stats.viewCount ?? item.views ?? 0),
        likes: Number(stats.diggCount ?? stats.likeCount ?? item.likes ?? 0),
        shares: Number(stats.shareCount ?? item.shares ?? 0),
        comments: Number(stats.commentCount ?? item.comments ?? 0),
        thumbnail: String(video.cover ?? item.thumbnail ?? `https://picsum.photos/seed/${id}/320/180`),
        url: `https://tiktok.com/@${author.uniqueId ?? 'user'}/video/${id}`,
        createTime: Number(item.createTime ?? 0),
        duration: Number(video.duration ?? item.duration ?? 0),
      };
    });

    await logUsageEvent({
      integration: 'scrape_creators',
      use_case: 'tiktok_search',
      model: 'n/a',
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { query, count: results.length },
    });

    return { success: true, source: 'tiktok', results };
  } catch (err) {
    await logUsageEvent({
      integration: 'scrape_creators',
      use_case: 'tiktok_search',
      model: 'n/a',
      duration_ms: Date.now() - t0,
      status: 'error',
    });
    return {
      success: false,
      source: 'tiktok',
      results: [],
      error: err instanceof Error ? err.message : 'Search failed',
    };
  }
}

// ── Save to Vault ─────────────────────────────────────────────────────────────

export interface SaveToVaultResult {
  success: boolean;
  saved: number;
  error?: string;
}

export async function saveYouTubeToVault(videos: ScYouTubeVideo[]): Promise<SaveToVaultResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const rows = videos.map(v => ({
      type: 'HOOK',
      content: v.title,
      tags: ['signal:organic', 'source:youtube', 'source:scrapecreators'],
      metadata: {
        views: v.views,
        likes: v.likes,
        channel: v.channelName,
        thumbnail: v.thumbnail,
        url: v.url,
        publishedAt: v.publishedAt,
        duration: v.duration,
        isShort: v.isShort,
        description: v.description,
      },
    }));
    const { error } = await supabase.from('vault_items').insert(rows);
    if (error) throw error;
    return { success: true, saved: rows.length };
  } catch (err) {
    return { success: false, saved: 0, error: err instanceof Error ? err.message : 'Save failed' };
  }
}

export async function saveFbAdsToVault(ads: ScFbAd[]): Promise<SaveToVaultResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const rows = ads.map(ad => ({
      type: 'AD',
      content: ad.adCreativeBody || ad.adCreativeLinkTitle || `Ad by ${ad.pageName}`,
      tags: ['signal:paid-fb', 'source:meta', 'source:scrapecreators'],
      metadata: {
        pageName: ad.pageName,
        pageId: ad.pageId,
        callToAction: ad.callToAction,
        platforms: ad.platforms,
        spendLower: ad.spendLower,
        spendUpper: ad.spendUpper,
        impressionsLower: ad.impressionsLower,
        impressionsUpper: ad.impressionsUpper,
        startDate: ad.startDate,
        thumbnailUrl: ad.thumbnailUrl,
        isActive: ad.isActive,
        linkTitle: ad.adCreativeLinkTitle,
        linkDescription: ad.adCreativeLinkDescription,
      },
    }));
    const { error } = await supabase.from('vault_items').insert(rows);
    if (error) throw error;
    return { success: true, saved: rows.length };
  } catch (err) {
    return { success: false, saved: 0, error: err instanceof Error ? err.message : 'Save failed' };
  }
}

export async function saveTikTokToVault(videos: ScTikTokVideo[]): Promise<SaveToVaultResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const rows = videos.map(v => ({
      type: 'HOOK',
      content: v.desc || `@${v.author} TikTok`,
      tags: ['signal:organic', 'source:tiktok', 'source:scrapecreators'],
      metadata: {
        views: v.views,
        likes: v.likes,
        shares: v.shares,
        author: v.author,
        authorNickname: v.authorNickname,
        thumbnail: v.thumbnail,
        url: v.url,
        createTime: v.createTime,
        duration: v.duration,
      },
    }));
    const { error } = await supabase.from('vault_items').insert(rows);
    if (error) throw error;
    return { success: true, saved: rows.length };
  } catch (err) {
    return { success: false, saved: 0, error: err instanceof Error ? err.message : 'Save failed' };
  }
}
