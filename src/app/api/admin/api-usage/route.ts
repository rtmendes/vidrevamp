import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();

  // Admin-only: check user role
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const range = url.searchParams.get('range') ?? '30d';
  const days = range === '7d' ? 7 : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // ── Fetch logs ─────────────────────────────────────────────────────────────
  const { data: logs, error: logsErr } = await supabase
    .from('api_usage_logs')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(500);

  if (logsErr) {
    return NextResponse.json({ error: logsErr.message }, { status: 500 });
  }

  // ── Build per-provider stats ───────────────────────────────────────────────
  const providerMap = new Map<string, { totalCost: number; totalCalls: number; failed: number; byDate: Map<string, { cost: number; calls: number }> }>();

  for (const log of logs ?? []) {
    if (!providerMap.has(log.provider)) {
      providerMap.set(log.provider, { totalCost: 0, totalCalls: 0, failed: 0, byDate: new Map() });
    }
    const p = providerMap.get(log.provider)!;
    p.totalCost += log.cost_usd;
    p.totalCalls += 1;
    if (log.status !== 'SUCCESS') p.failed += 1;

    const dateKey = log.created_at.slice(0, 10);
    if (!p.byDate.has(dateKey)) p.byDate.set(dateKey, { cost: 0, calls: 0 });
    const d = p.byDate.get(dateKey)!;
    d.cost += log.cost_usd;
    d.calls += 1;
  }

  const stats = Array.from(providerMap.entries()).map(([provider, data]) => {
    // Build last 7 days array (always 7 entries for chart consistency)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const d = data.byDate.get(date);
      last7Days.push({ date, cost: d?.cost ?? 0, calls: d?.calls ?? 0 });
    }
    return {
      provider,
      totalCost: data.totalCost,
      totalCalls: data.totalCalls,
      failureRate: data.totalCalls > 0 ? data.failed / data.totalCalls : 0,
      last7Days,
    };
  });

  return NextResponse.json({ logs: logs ?? [], stats });
}
