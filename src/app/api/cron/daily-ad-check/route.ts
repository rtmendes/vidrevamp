import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { scrapeAndSaveAds } from '@/actions/ads';
import { calculateBrandMonthlySpend, formatSpend } from '@/lib/utils/spendEstimator';

/**
 * Vercel CRON Job — Daily Competitor Ad Check
 *
 * Schedule (vercel.json):
 * { "crons": [{ "path": "/api/cron/daily-ad-check", "schedule": "0 9 * * *" }] }
 *
 * Protected by CRON_SECRET env var.
 */
export async function GET(req: Request) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const STALE_MS = 23 * 60 * 60 * 1000; // 23 hours

  // ── Fetch competitors with alerts enabled + stale data ─────────────────────
  const { data: competitors, error } = await supabase
    .from('competitors')
    .select('*, user:users(email), ads:ad_creatives(*)')
    .eq('alerts_enabled', true)
    .lt('last_scraped_at', new Date(Date.now() - STALE_MS).toISOString());

  if (error) {
    console.error('[cron] Failed to fetch competitors:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!competitors || competitors.length === 0) {
    return NextResponse.json({ message: 'No stale competitors to check', checked: 0 });
  }

  const results: Array<{ competitorId: string; name: string; newAds: number; error?: string }> = [];

  for (const competitor of competitors) {
    try {
      const existingAdIds = new Set((competitor.ads ?? []).map((a: { external_ad_id: string }) => a.external_ad_id));
      const prevSpend = calculateBrandMonthlySpend(competitor.ads ?? []);

      // ── Scrape fresh data ────────────────────────────────────────────────
      const scrapeResult = await scrapeAndSaveAds({
        brandName: competitor.name,
        platform: competitor.platform as 'META' | 'TIKTOK' | 'YOUTUBE',
        maxResults: 30,
      });

      if (!scrapeResult.success) {
        results.push({ competitorId: competitor.id, name: competitor.name, newAds: 0, error: scrapeResult.error });
        continue;
      }

      // ── Fetch updated ads to detect delta ────────────────────────────────
      const { data: freshAds } = await supabase
        .from('ad_creatives')
        .select('*')
        .eq('competitor_id', competitor.id);

      const newAds = (freshAds ?? []).filter(
        (a: { external_ad_id: string }) => !existingAdIds.has(a.external_ad_id)
      );
      const newSpend = calculateBrandMonthlySpend(freshAds ?? []);
      const spendJumped = newSpend > prevSpend * 1.25; // >25% spend increase

      // ── Send alert email if delta detected ───────────────────────────────
      if ((newAds.length > 0 || spendJumped) && competitor.user?.email) {
        await sendCompetitorAlert({
          toEmail: competitor.user.email,
          competitorName: competitor.name,
          platform: competitor.platform,
          newAdCount: newAds.length,
          prevSpend,
          newSpend,
          spendJumped,
        });
      }

      // ── Update est_monthly_spend on competitor row ────────────────────────
      await supabase
        .from('competitors')
        .update({ est_monthly_spend: newSpend })
        .eq('id', competitor.id);

      results.push({ competitorId: competitor.id, name: competitor.name, newAds: newAds.length });
    } catch (e) {
      results.push({
        competitorId: competitor.id,
        name: competitor.name,
        newAds: 0,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  console.log('[cron] daily-ad-check complete:', results);
  return NextResponse.json({ message: 'Done', checked: competitors.length, results });
}

// ── Email Alert (Resend) ──────────────────────────────────────────────────────

async function sendCompetitorAlert(params: {
  toEmail: string;
  competitorName: string;
  platform: string;
  newAdCount: number;
  prevSpend: number;
  newSpend: number;
  spendJumped: boolean;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn('[cron] RESEND_API_KEY not set — skipping email alert');
    return;
  }

  const subject = params.newAdCount > 0
    ? `🚨 ${params.competitorName} launched ${params.newAdCount} new ad${params.newAdCount > 1 ? 's' : ''}`
    : `📈 ${params.competitorName} scaled spend to ${formatSpend(params.newSpend)}`;

  const body = `
<h2>VidRevamp Competitor Alert</h2>
<p><strong>${params.competitorName}</strong> on <strong>${params.platform}</strong> has new activity:</p>
<ul>
  ${params.newAdCount > 0 ? `<li>🆕 ${params.newAdCount} new ad creative(s) detected</li>` : ''}
  ${params.spendJumped ? `<li>📈 Estimated monthly spend jumped from ${formatSpend(params.prevSpend)} → ${formatSpend(params.newSpend)}</li>` : ''}
</ul>
<p>Log in to VidRevamp to analyze these ads and clone the winning scripts for your brand.</p>
  `.trim();

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VidRevamp Alerts <alerts@vidrevamp.com>',
        to: [params.toEmail],
        subject,
        html: body,
      }),
    });
  } catch (e) {
    console.warn('[cron] Email send failed:', e instanceof Error ? e.message : e);
  }
}
