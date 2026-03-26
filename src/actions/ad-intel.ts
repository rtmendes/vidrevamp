'use server';

import OpenAI from 'openai';
import { addVaultItem } from './vault';
import { logUsageEvent } from './log-usage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Types ──────────────────────────────────────────────────────────────────

export type AdSource = 'youtube' | 'facebook';

export interface ParsedAd {
  hook: string;
  source: AdSource;
  advertiser?: string;
  headline?: string;
  cta?: string;
  platform_tags?: string[];
}

export interface AdImportResult {
  success: boolean;
  parsed: ParsedAd[];
  saved: number;
  error?: string;
}

export interface FacebookAd {
  id: string;
  page_name: string;
  ad_creative_body?: string;
  ad_creative_link_title?: string;
  ad_creative_link_description?: string;
  call_to_action_type?: string;
  spend?: { lower_bound?: string; upper_bound?: string };
  impressions?: { lower_bound?: string; upper_bound?: string };
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string | null;
}

export interface FacebookSearchResult {
  success: boolean;
  ads: FacebookAd[];
  error?: string;
  requiresToken?: boolean;
}

// ── Parser: extract hooks from raw pasted text ────────────────────────────

/**
 * Uses gpt-4o-mini to extract structured ad hooks from a free-form paste.
 * Handles VidTao exports, Facebook Ad Library copy-paste, or any plain text.
 */
export async function parseAdPaste(
  rawText: string,
  source: AdSource,
): Promise<{ success: boolean; ads: ParsedAd[]; error?: string }> {
  if (!rawText.trim()) return { success: false, ads: [], error: 'No content pasted.' };

  const t0 = Date.now();
  try {
    const systemPrompt = source === 'youtube'
      ? `You extract YouTube ad hooks from pasted VidTao data or raw text.
         Each ad hook is the first 5-15 words of an ad — the attention-grabbing opener.
         Return ONLY valid JSON array, no markdown.`
      : `You extract Facebook/Instagram ad hooks from pasted Meta Ads Library data or raw text.
         Each ad hook is the main copy headline or the first sentence of the ad body.
         Return ONLY valid JSON array, no markdown.`;

    const userPrompt = `Extract all ad hooks from this text. Return a JSON array of objects:
[{"hook": "...", "advertiser": "...", "headline": "...", "cta": "..."}]

If a field is missing, use null. Extract as many distinct hooks as you can find.

TEXT:
${rawText.slice(0, 6000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content ?? '[]';
    const json = raw.replace(/```json\n?|\n?```/g, '').trim();
    const extracted = JSON.parse(json) as Array<{
      hook?: string;
      advertiser?: string;
      headline?: string;
      cta?: string;
    }>;

    const ads: ParsedAd[] = extracted
      .filter((a) => a.hook && a.hook.length > 5)
      .map((a) => ({
        hook: a.hook!,
        source,
        advertiser: a.advertiser ?? undefined,
        headline: a.headline ?? undefined,
        cta: a.cta ?? undefined,
        platform_tags: [source === 'youtube' ? 'signal:paid-yt' : 'signal:paid-fb'],
      }));

    await logUsageEvent({
      integration: 'openai',
      use_case: 'ad_sync',
      model: 'gpt-4o-mini',
      input_tokens: response.usage?.prompt_tokens,
      output_tokens: response.usage?.completion_tokens,
      cost_usd: ((response.usage?.prompt_tokens ?? 0) / 1000) * 0.00015
        + ((response.usage?.completion_tokens ?? 0) / 1000) * 0.0006,
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { source, count: ads.length },
    });

    return { success: true, ads };
  } catch (err) {
    return {
      success: false,
      ads: [],
      error: err instanceof Error ? err.message : 'Parse failed',
    };
  }
}

// ── Facebook Meta Ads Library API ─────────────────────────────────────────

/**
 * Queries the Meta Ads Library API for active ads by search term.
 * Requires FACEBOOK_ADS_TOKEN env var (Meta app access token with
 * ads_read permission — requires app review for commercial ads).
 *
 * Fallback: if no token, returns requiresToken=true so the UI
 * can guide the user to paste from the web interface instead.
 */
export async function searchFacebookAds(params: {
  query: string;
  country?: string;
  limit?: number;
}): Promise<FacebookSearchResult> {
  const token = process.env.FACEBOOK_ADS_TOKEN;
  if (!token) {
    return {
      success: false,
      ads: [],
      requiresToken: true,
      error: 'FACEBOOK_ADS_TOKEN not configured. Add it in Settings, or use the paste-import below.',
    };
  }

  const { query, country = 'US', limit = 20 } = params;

  try {
    const url = new URL('https://graph.facebook.com/v21.0/ads_archive');
    url.searchParams.set('access_token', token);
    url.searchParams.set('search_terms', query);
    url.searchParams.set('ad_reached_countries', JSON.stringify([country]));
    url.searchParams.set('ad_active_status', 'ACTIVE');
    url.searchParams.set('ad_type', 'ALL');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('fields', [
      'id',
      'page_name',
      'ad_creative_body',
      'ad_creative_link_title',
      'ad_creative_link_description',
      'call_to_action_type',
      'spend',
      'impressions',
      'ad_delivery_start_time',
      'ad_delivery_stop_time',
    ].join(','));

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      return {
        success: false,
        ads: [],
        error: err.error?.message ?? `Meta API error ${res.status}`,
      };
    }

    const data = await res.json() as { data?: FacebookAd[] };
    return { success: true, ads: data.data ?? [] };
  } catch (err) {
    return {
      success: false,
      ads: [],
      error: err instanceof Error ? err.message : 'Facebook API request failed',
    };
  }
}

// ── Bulk save ads to Vault ─────────────────────────────────────────────────

export async function saveAdsToVault(ads: ParsedAd[]): Promise<AdImportResult> {
  if (!ads.length) return { success: false, parsed: [], saved: 0, error: 'No ads to save' };

  let saved = 0;
  for (const ad of ads) {
    const content = [
      ad.hook,
      ad.headline ? `Headline: ${ad.headline}` : null,
      ad.cta ? `CTA: ${ad.cta}` : null,
      ad.advertiser ? `Advertiser: ${ad.advertiser}` : null,
    ].filter(Boolean).join('\n');

    const tags = [
      ...(ad.platform_tags ?? []),
      ad.source === 'youtube' ? 'source:vidtao' : 'source:meta',
      ad.advertiser ? `advertiser:${ad.advertiser.toLowerCase().replace(/\s+/g, '-')}` : null,
    ].filter((t): t is string => Boolean(t));

    const result = await addVaultItem('AD', content, tags);
    if (result.success) saved++;
  }

  return { success: saved > 0, parsed: ads, saved };
}

// ── Parse + save in one call ───────────────────────────────────────────────

export async function importAndSaveAds(
  rawText: string,
  source: AdSource,
): Promise<AdImportResult> {
  const parseResult = await parseAdPaste(rawText, source);
  if (!parseResult.success || !parseResult.ads.length) {
    return {
      success: false,
      parsed: [],
      saved: 0,
      error: parseResult.error ?? 'No ads found in pasted content.',
    };
  }
  return saveAdsToVault(parseResult.ads);
}
