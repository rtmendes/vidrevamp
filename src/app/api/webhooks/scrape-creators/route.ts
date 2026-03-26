import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { estimateMetaAdSpend, calculateBrandMonthlySpend } from '@/lib/utils/spendEstimator';

/**
 * Webhook receiver for ScrapeCreators async job completions.
 *
 * Set in ScrapeCreators dashboard:
 *   URL: https://yourdomain.com/api/webhooks/scrape-creators
 *   Secret header: x-webhook-secret = SC_WEBHOOK_SECRET env var
 *
 * Expected payload:
 * {
 *   jobId: string,
 *   status: 'completed' | 'failed',
 *   competitorId: string,   // passed as metadata when triggering job
 *   platform: string,
 *   results: ScFbAd[] | ScTikTokVideo[] | ScYouTubeVideo[]
 * }
 */
export async function POST(req: Request) {
  // ── Verify webhook secret ──────────────────────────────────────────────────
  const incomingSecret = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.SC_WEBHOOK_SECRET;

  if (expectedSecret && incomingSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  let payload: {
    jobId?: string;
    status?: string;
    competitorId?: string;
    platform?: string;
    results?: Array<Record<string, unknown>>;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (payload.status === 'failed') {
    console.warn('[webhook] ScrapeCreators job failed:', payload.jobId);
    return NextResponse.json({ received: true, processed: false });
  }

  const { competitorId, platform, results = [] } = payload;

  if (!competitorId || !platform) {
    return NextResponse.json({ error: 'Missing competitorId or platform' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  // ── Upsert each ad creative ────────────────────────────────────────────────
  let processedCount = 0;

  for (const rawItem of results) {
    // Use any-cast for flexible cross-platform field access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = rawItem as any;
    const externalAdId = String(item.id ?? item.adId ?? '');
    if (!externalAdId) continue;

    const isActive = Boolean(item.isActive ?? true);
    const startDate = item.startDate as string | undefined;
    const daysActive = startDate
      ? Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000))
      : Number(item.daysActive ?? 1);

    const engagementData = {
      views: Number(item.impressionsUpper ?? item.views ?? item.playCount ?? 0),
      likes: Number(item.likes ?? item.diggCount ?? 0),
      shares: Number(item.shares ?? item.shareCount ?? 0),
      comments: Number(item.comments ?? item.commentCount ?? 0),
    };

    const { error } = await supabase.from('ad_creatives').upsert(
      {
        competitor_id: competitorId,
        external_ad_id: `${platform.toLowerCase()}_${externalAdId}`,
        platform: platform.toUpperCase(),
        video_url: String(item.videoUrl ?? item.video?.playAddr ?? ''),
        thumbnail_url: String(item.thumbnailUrl ?? item.video?.cover ?? item.thumbnail ?? '') || null,
        ad_copy: String(item.adCreativeBody ?? item.desc ?? item.description ?? '') || null,
        call_to_action: String(item.callToAction ?? '') || null,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        days_active: daysActive,
        engagement_data: engagementData,
      },
      { onConflict: 'external_ad_id' }
    );

    if (!error) processedCount++;
  }

  // ── Recalculate and update competitor's monthly spend ──────────────────────
  const { data: freshAds } = await supabase
    .from('ad_creatives')
    .select('platform, status, days_active, engagement_data')
    .eq('competitor_id', competitorId);

  if (freshAds) {
    const newSpend = calculateBrandMonthlySpend(freshAds);
    await supabase
      .from('competitors')
      .update({ est_monthly_spend: newSpend, last_scraped_at: new Date().toISOString() })
      .eq('id', competitorId);
  }

  // ── Log cost ───────────────────────────────────────────────────────────────
  await supabase.from('api_usage_logs').insert({
    provider: 'SCRAPE_CREATORS',
    endpoint: `webhook_${platform.toLowerCase()}`,
    units_used: processedCount,
    cost_usd: processedCount * 0.0017,
    status: 'SUCCESS',
    metadata: { jobId: payload.jobId, competitorId },
  });

  return NextResponse.json({ received: true, processed: processedCount });
}
