'use client';

/**
 * Operations Dashboard — VidRevamp
 *
 * DATA SOURCES (current status):
 * ─────────────────────────────────────────────────────────────────
 * ✅ Vault / Auth          → Real · Supabase (once URL is configured)
 * ✅ Script Engine         → Real · OpenAI API (costs money per call)
 * ✅ Hook Lab              → Real · OpenAI API
 * 🟡 Research / Outlier    → Mock · needs YouTube Data API v3 (free, 10K units/day)
 * 🟡 Ad Intelligence       → Mock · needs ad intel API (BigSpy, SpyFu, or Meta/Google Ads API)
 * 🟡 Analytics data        → Mock · needs usage_events table (schema below)
 * 🔴 Usage tracking        → Not wired · Supabase migration pending
 *
 * TO ACTIVATE REAL COST TRACKING: run this SQL in your Supabase project:
 *   → See SUPABASE_SCHEMA constant below
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';
import {
  Activity,
  DollarSign,
  Zap,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Cpu,
  Globe,
  BookOpen,
  AlertCircle,
  Check,
  Copy,
  Clock,
  BarChart3,
  Briefcase,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Supabase schema (run in your project SQL editor) ──────────────────────────
const SUPABASE_SCHEMA = `
-- Usage events table for VidRevamp ops tracking
create table if not exists usage_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  ts          timestamptz not null default now(),
  integration text not null,   -- 'openai' | 'supabase' | 'youtube_api' | 'ad_intel'
  use_case    text not null,   -- 'script_gen' | 'hook_lab' | 'translate' | 'script_fix' | 'vault_read' | 'research'
  brand_id    text,            -- optional brand association
  project_id  text,            -- optional project association
  model       text,            -- 'gpt-4o' | 'claude-sonnet-4-6' etc
  input_tokens  int default 0,
  output_tokens int default 0,
  total_tokens  int default 0,
  cost_usd    numeric(10,6) default 0,
  duration_ms int,
  status      text default 'success',  -- 'success' | 'error' | 'timeout'
  metadata    jsonb default '{}'
);

-- Enable RLS
alter table usage_events enable row level security;
create policy "Users see own events" on usage_events
  for select using (auth.uid() = user_id);
create policy "Users insert own events" on usage_events
  for insert with check (auth.uid() = user_id);

-- Indexes for fast filtering
create index on usage_events (user_id, ts desc);
create index on usage_events (integration);
create index on usage_events (use_case);
create index on usage_events (brand_id);
`;

// ── Types ─────────────────────────────────────────────────────────────────────

type Integration = 'OpenAI' | 'Supabase' | 'YouTube API' | 'Ad Intel API' | 'Internal';
type UseCase = 'Script Gen' | 'Hook Lab' | 'Translate' | 'Script Fix' | 'Vault' | 'Research' | 'Ad Sync' | 'Auth';
type Status = 'success' | 'error' | 'timeout';
type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';
type SortField = 'ts' | 'cost_usd' | 'total_tokens' | 'duration_ms';
type SortDir = 'asc' | 'desc';

interface UsageEvent {
  id: string;
  ts: string;
  integration: Integration;
  use_case: UseCase;
  brand: string;
  project: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  duration_ms: number;
  status: Status;
}

// ── Mock events (replace with real Supabase query) ────────────────────────────

function makeEvent(
  id: string, ts: string, integration: Integration, use_case: UseCase,
  brand: string, project: string, model: string,
  input_tokens: number, output_tokens: number, cost_usd: number,
  duration_ms: number, status: Status = 'success'
): UsageEvent {
  return { id, ts, integration, use_case, brand, project, model, input_tokens, output_tokens, total_tokens: input_tokens + output_tokens, cost_usd, duration_ms, status };
}

const MOCK_EVENTS: UsageEvent[] = [
  makeEvent('e01','2025-03-25T14:32:00Z','OpenAI','Script Gen','EduLaunch','Course Launch Q2','gpt-4o',3240,1580,0.0724,4820),
  makeEvent('e02','2025-03-25T13:18:00Z','OpenAI','Hook Lab','FitPulse','March Campaign','gpt-4o',820,420,0.0183,1240),
  makeEvent('e03','2025-03-25T11:45:00Z','Supabase','Vault','EduLaunch','Course Launch Q2','—',0,0,0.0001,42),
  makeEvent('e04','2025-03-25T10:22:00Z','OpenAI','Script Gen','WealthPath','Debt Free Campaign','gpt-4o',3100,1640,0.0696,5100),
  makeEvent('e05','2025-03-25T09:55:00Z','OpenAI','Translate','FitPulse','March Campaign','gpt-4o',2100,900,0.0450,3200),
  makeEvent('e06','2025-03-24T18:40:00Z','OpenAI','Script Fix','EduLaunch','Course Launch Q2','gpt-4o',1840,760,0.0400,2890),
  makeEvent('e07','2025-03-24T16:12:00Z','OpenAI','Script Gen','FitPulse','March Campaign','gpt-4o',3400,1600,0.0760,4950),
  makeEvent('e08','2025-03-24T14:30:00Z','Supabase','Auth','—','—','—',0,0,0.0000,18),
  makeEvent('e09','2025-03-24T12:05:00Z','OpenAI','Hook Lab','WealthPath','Debt Free Campaign','gpt-4o',920,380,0.0195,1480),
  makeEvent('e10','2025-03-24T10:44:00Z','OpenAI','Script Gen','EduLaunch','Affiliate Program','gpt-4o',3560,1420,0.0748,5200),
  makeEvent('e11','2025-03-23T19:30:00Z','YouTube API','Research','FitPulse','March Campaign','—',0,0,0.0008,320),
  makeEvent('e12','2025-03-23T17:55:00Z','OpenAI','Translate','EduLaunch','Course Launch Q2','gpt-4o',2400,1100,0.0525,3600),
  makeEvent('e13','2025-03-23T15:20:00Z','OpenAI','Script Gen','WealthPath','Social Media Push','gpt-4o',3200,1500,0.0700,4800,'error'),
  makeEvent('e14','2025-03-23T13:44:00Z','OpenAI','Hook Lab','EduLaunch','Course Launch Q2','gpt-4o',780,340,0.0168,1100),
  makeEvent('e15','2025-03-23T11:10:00Z','Supabase','Vault','WealthPath','Debt Free Campaign','—',0,0,0.0001,38),
  makeEvent('e16','2025-03-22T20:15:00Z','OpenAI','Script Gen','FitPulse','TikTok Q1 Blitz','gpt-4o',3800,1700,0.0835,5400),
  makeEvent('e17','2025-03-22T18:30:00Z','Ad Intel API','Ad Sync','FitPulse','TikTok Q1 Blitz','—',0,0,0.0250,890),
  makeEvent('e18','2025-03-22T16:00:00Z','OpenAI','Script Gen','EduLaunch','Affiliate Program','gpt-4o',3100,1400,0.0675,4600),
  makeEvent('e19','2025-03-22T14:20:00Z','YouTube API','Research','EduLaunch','Course Launch Q2','—',0,0,0.0008,295),
  makeEvent('e20','2025-03-22T12:45:00Z','OpenAI','Script Fix','FitPulse','TikTok Q1 Blitz','gpt-4o',1600,640,0.0336,2400),
  makeEvent('e21','2025-03-21T19:00:00Z','OpenAI','Hook Lab','WealthPath','Social Media Push','gpt-4o',900,360,0.0189,1320),
  makeEvent('e22','2025-03-21T17:30:00Z','OpenAI','Script Gen','FitPulse','March Campaign','gpt-4o',3300,1550,0.0723,4900),
  makeEvent('e23','2025-03-21T15:00:00Z','Supabase','Vault','EduLaunch','Affiliate Program','—',0,0,0.0001,41),
  makeEvent('e24','2025-03-21T13:20:00Z','OpenAI','Translate','WealthPath','Debt Free Campaign','gpt-4o',2200,980,0.0476,3300),
  makeEvent('e25','2025-03-20T18:45:00Z','OpenAI','Script Gen','EduLaunch','Course Launch Q2','gpt-4o',3600,1650,0.0788,5300,'timeout'),
  makeEvent('e26','2025-03-20T16:10:00Z','Ad Intel API','Ad Sync','WealthPath','Social Media Push','—',0,0,0.0250,920),
  makeEvent('e27','2025-03-20T14:30:00Z','OpenAI','Hook Lab','FitPulse','TikTok Q1 Blitz','gpt-4o',840,380,0.0179,1290),
  makeEvent('e28','2025-03-20T12:00:00Z','YouTube API','Research','WealthPath','Debt Free Campaign','—',0,0,0.0008,310),
  makeEvent('e29','2025-03-19T17:30:00Z','OpenAI','Script Gen','FitPulse','TikTok Q1 Blitz','gpt-4o',3450,1580,0.0752,5050),
  makeEvent('e30','2025-03-19T15:00:00Z','OpenAI','Script Fix','EduLaunch','Affiliate Program','gpt-4o',1720,720,0.0372,2650),
];

// ── Config ────────────────────────────────────────────────────────────────────

const INTEGRATION_META: Record<Integration, { color: string; icon: React.FC<{ className?: string }>; status: 'live' | 'mock' | 'inactive' }> = {
  'OpenAI':       { color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/30', icon: Cpu, status: 'live' },
  'Supabase':     { color: 'text-green-400 bg-green-950/60 border-green-700/30', icon: Database, status: 'live' },
  'YouTube API':  { color: 'text-red-400 bg-red-950/60 border-red-700/30', icon: Globe, status: 'mock' },
  'Ad Intel API': { color: 'text-orange-400 bg-orange-950/60 border-orange-700/30', icon: BarChart3, status: 'mock' },
  'Internal':     { color: 'text-zinc-400 bg-zinc-800 border-zinc-700/30', icon: Activity, status: 'live' },
};

const USE_CASE_COLOR: Record<UseCase, string> = {
  'Script Gen': 'text-violet-400',
  'Hook Lab': 'text-yellow-400',
  'Translate': 'text-blue-400',
  'Script Fix': 'text-orange-400',
  'Vault': 'text-emerald-400',
  'Research': 'text-pink-400',
  'Ad Sync': 'text-red-400',
  'Auth': 'text-zinc-500',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function filterByTime(events: UsageEvent[], range: TimeRange): UsageEvent[] {
  if (range === 'all') return events;
  const now = new Date('2025-03-25T23:59:00Z').getTime();
  const cutoffs: Record<TimeRange, number> = {
    '24h': 86400000,
    '7d': 7 * 86400000,
    '30d': 30 * 86400000,
    '90d': 90 * 86400000,
    'all': 0,
  };
  const cutoff = now - cutoffs[range];
  return events.filter(e => new Date(e.ts).getTime() >= cutoff);
}

function exportCSV(events: UsageEvent[]) {
  const header = 'ID,Timestamp,Integration,Use Case,Brand,Project,Model,Input Tokens,Output Tokens,Total Tokens,Cost USD,Duration ms,Status\n';
  const rows = events.map(e =>
    `${e.id},${e.ts},${e.integration},${e.use_case},"${e.brand}","${e.project}",${e.model},${e.input_tokens},${e.output_tokens},${e.total_tokens},${e.cost_usd},${e.duration_ms},${e.status}`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vidrevamp-ops.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(n: number): string {
  if (n === 0) return '$0.00';
  if (n < 0.001) return `$${n.toFixed(6)}`;
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(4)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'events' | 'by-integration' | 'by-brand' | 'schema';

export default function OpsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [search, setSearch] = useState('');
  const [filterIntegration, setFilterIntegration] = useState<Integration | 'All'>('All');
  const [filterUseCase, setFilterUseCase] = useState<UseCase | 'All'>('All');
  const [filterBrand, setFilterBrand] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
  const [sortField, setSortField] = useState<SortField>('ts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [copiedSchema, setCopiedSchema] = useState(false);

  const timeFiltered = useMemo(() => filterByTime(MOCK_EVENTS, timeRange), [timeRange]);

  const filtered = useMemo(() => {
    let ev = [...timeFiltered];
    if (filterIntegration !== 'All') ev = ev.filter(e => e.integration === filterIntegration);
    if (filterUseCase !== 'All') ev = ev.filter(e => e.use_case === filterUseCase);
    if (filterBrand !== 'All') ev = ev.filter(e => e.brand === filterBrand);
    if (filterStatus !== 'All') ev = ev.filter(e => e.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      ev = ev.filter(e =>
        e.integration.toLowerCase().includes(q) ||
        e.use_case.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.project.toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q)
      );
    }
    ev.sort((a, b) => {
      const av = a[sortField] as string | number;
      const bv = b[sortField] as string | number;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return ev;
  }, [timeFiltered, filterIntegration, filterUseCase, filterBrand, filterStatus, search, sortField, sortDir]);

  // Aggregates
  const totalCost = filtered.reduce((s, e) => s + e.cost_usd, 0);
  const totalTokens = filtered.reduce((s, e) => s + e.total_tokens, 0);
  const totalRequests = filtered.length;
  const errorRate = filtered.length > 0 ? (filtered.filter(e => e.status !== 'success').length / filtered.length * 100).toFixed(1) : '0';
  const avgDuration = filtered.length > 0 ? Math.round(filtered.reduce((s, e) => s + e.duration_ms, 0) / filtered.length) : 0;

  const brands = Array.from(new Set(MOCK_EVENTS.map(e => e.brand).filter(b => b !== '—')));
  const integrations = Array.from(new Set(MOCK_EVENTS.map(e => e.integration))) as Integration[];
  const useCases = Array.from(new Set(MOCK_EVENTS.map(e => e.use_case))) as UseCase[];

  // Daily chart data (last 7 days)
  const dailyData = useMemo(() => {
    const days: { date: string; cost: number; requests: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date('2025-03-25');
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayEvents = MOCK_EVENTS.filter(e => e.ts.startsWith(dateStr));
      days.push({
        date: dateStr.slice(5),
        cost: dayEvents.reduce((s, e) => s + e.cost_usd, 0),
        requests: dayEvents.length,
      });
    }
    return days;
  }, []);
  const maxDailyCost = Math.max(...dailyData.map(d => d.cost));

  // By brand aggregates
  const byBrand = useMemo(() => {
    const grouped = groupBy(filtered.filter(e => e.brand !== '—'), e => e.brand);
    return Object.entries(grouped).map(([brand, events]) => ({
      brand,
      cost: events.reduce((s, e) => s + e.cost_usd, 0),
      tokens: events.reduce((s, e) => s + e.total_tokens, 0),
      requests: events.length,
      topUseCase: Object.entries(groupBy(events, e => e.use_case)).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || '—',
    })).sort((a, b) => b.cost - a.cost);
  }, [filtered]);

  // By integration aggregates
  const byIntegration = useMemo(() => {
    const grouped = groupBy(filtered, e => e.integration);
    return Object.entries(grouped).map(([integration, events]) => ({
      integration: integration as Integration,
      cost: events.reduce((s, e) => s + e.cost_usd, 0),
      tokens: events.reduce((s, e) => s + e.total_tokens, 0),
      requests: events.length,
      errors: events.filter(e => e.status !== 'success').length,
      avgDuration: Math.round(events.reduce((s, e) => s + e.duration_ms, 0) / events.length),
    })).sort((a, b) => b.cost - a.cost);
  }, [filtered]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-zinc-700" />;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-violet-400" /> : <ChevronUp className="w-3 h-3 text-violet-400" />;
  }

  const activeFilters = [filterIntegration !== 'All', filterUseCase !== 'All', filterBrand !== 'All', filterStatus !== 'All'].filter(Boolean).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-500 to-zinc-700 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Operations</h1>
            <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">MOCK DATA</span>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">
            Full visibility into API usage, costs, integrations, and performance across all brands and projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range */}
          <div className="flex bg-zinc-900 border border-zinc-800/60 rounded-lg overflow-hidden">
            {(['24h', '7d', '30d', '90d', 'all'] as TimeRange[]).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={cn('px-3 py-1.5 text-[11px] font-medium transition-all', timeRange === r ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 rounded-lg text-[12px] text-zinc-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Cost', value: `$${totalCost.toFixed(4)}`, sub: `${timeRange} window`, icon: DollarSign, color: 'text-orange-400', trend: '+12%', up: true },
          { label: 'API Requests', value: totalRequests.toString(), sub: `${filtered.filter(e => e.status === 'success').length} success`, icon: Zap, color: 'text-violet-400', trend: '+8%', up: true },
          { label: 'Tokens Used', value: `${(totalTokens / 1000).toFixed(1)}K`, sub: 'input + output', icon: Cpu, color: 'text-blue-400', trend: '+15%', up: true },
          { label: 'Error Rate', value: `${errorRate}%`, sub: `${filtered.filter(e => e.status !== 'success').length} failed`, icon: AlertCircle, color: parseFloat(errorRate) > 5 ? 'text-red-400' : 'text-emerald-400', trend: '-2%', up: false },
          { label: 'Avg Latency', value: formatMs(avgDuration), sub: 'per API call', icon: Clock, color: 'text-zinc-300', trend: '+40ms', up: false },
        ].map(kpi => (
          <div key={kpi.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <kpi.icon className={cn('w-3.5 h-3.5', kpi.color)} />
              <span className="text-[10px] text-zinc-500">{kpi.label}</span>
            </div>
            <p className="text-[20px] font-bold text-zinc-100 leading-none mb-1">{kpi.value}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">{kpi.sub}</span>
              <span className={cn('text-[10px] font-medium flex items-center gap-0.5', kpi.up ? 'text-emerald-400' : 'text-red-400')}>
                {kpi.up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-zinc-900 border border-zinc-800/60 rounded-xl p-1 w-fit">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'events', label: `Event Log (${filtered.length})` },
          { id: 'by-integration', label: 'By Integration' },
          { id: 'by-brand', label: 'By Brand' },
          { id: 'schema', label: '🔧 Activate Real Data' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all', tab === t.id ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Daily cost chart */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-zinc-300">Daily Cost (Last 7 Days)</h3>
              <span className="text-[11px] text-zinc-600">Total: ${dailyData.reduce((s, d) => s + d.cost, 0).toFixed(4)}</span>
            </div>
            <div className="flex items-end gap-2 h-32">
              {dailyData.map(day => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] text-zinc-600 font-mono">${day.cost.toFixed(3)}</span>
                  <div className="w-full rounded-t-sm bg-violet-600/80 hover:bg-violet-500 transition-colors relative group" style={{ height: `${Math.max((day.cost / maxDailyCost) * 100, 4)}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {day.requests} requests
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-600">{day.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Use case breakdown */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-zinc-300 mb-4">Cost by Use Case</h3>
              <div className="space-y-2.5">
                {Object.entries(groupBy(filtered, e => e.use_case))
                  .map(([uc, events]) => ({ uc, cost: events.reduce((s, e) => s + e.cost_usd, 0), count: events.length }))
                  .sort((a, b) => b.cost - a.cost)
                  .map(row => (
                    <div key={row.uc} className="flex items-center gap-3">
                      <span className={cn('text-[11px] font-medium w-24 flex-shrink-0', USE_CASE_COLOR[row.uc as UseCase])}>{row.uc}</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-600 rounded-full" style={{ width: `${(row.cost / totalCost) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-zinc-400 w-16 text-right font-mono">${row.cost.toFixed(3)}</span>
                      <span className="text-[10px] text-zinc-600 w-8 text-right">{row.count}x</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-zinc-300 mb-4">Data Source Status</h3>
              <div className="space-y-2.5">
                {(Object.entries(INTEGRATION_META) as [Integration, typeof INTEGRATION_META[Integration]][]).map(([name, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium w-32 flex-shrink-0', meta.color)}>
                        <Icon className="w-3 h-3" />
                        {name}
                      </div>
                      <div className="flex-1">
                        <div className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                          meta.status === 'live' ? 'bg-emerald-500/15 text-emerald-400' :
                          meta.status === 'mock' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-zinc-700 text-zinc-500'
                        )}>
                          {meta.status === 'live' ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                          {meta.status === 'live' ? 'Live' : meta.status === 'mock' ? 'Mock Data' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EVENT LOG TAB ── */}
      {tab === 'events' && (
        <div className="space-y-4">
          {/* Search + filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search integration, use case, brand, project…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/60"
              />
            </div>

            <select value={filterIntegration} onChange={e => setFilterIntegration(e.target.value as Integration | 'All')}
              className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 px-3 text-[12px] text-zinc-300 focus:outline-none">
              <option value="All">All Integrations</option>
              {integrations.map(i => <option key={i}>{i}</option>)}
            </select>

            <select value={filterUseCase} onChange={e => setFilterUseCase(e.target.value as UseCase | 'All')}
              className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 px-3 text-[12px] text-zinc-300 focus:outline-none">
              <option value="All">All Use Cases</option>
              {useCases.map(u => <option key={u}>{u}</option>)}
            </select>

            <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
              className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 px-3 text-[12px] text-zinc-300 focus:outline-none">
              <option value="All">All Brands</option>
              {brands.map(b => <option key={b}>{b}</option>)}
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Status | 'All')}
              className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 px-3 text-[12px] text-zinc-300 focus:outline-none">
              <option value="All">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="timeout">Timeout</option>
            </select>

            {activeFilters > 0 && (
              <button
                onClick={() => { setFilterIntegration('All'); setFilterUseCase('All'); setFilterBrand('All'); setFilterStatus('All'); setSearch(''); }}
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Filter className="w-3 h-3" />
                Clear ({activeFilters})
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[130px_100px_90px_100px_100px_90px_70px_80px_60px] gap-2 px-4 py-2.5 border-b border-zinc-800/60 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
              <button className="flex items-center gap-1 text-left hover:text-zinc-400 transition-colors" onClick={() => toggleSort('ts')}>
                Timestamp <SortIcon field="ts" />
              </button>
              <span>Integration</span>
              <span>Use Case</span>
              <span>Brand</span>
              <span>Project</span>
              <span>Model</span>
              <button className="flex items-center gap-1 hover:text-zinc-400 transition-colors" onClick={() => toggleSort('total_tokens')}>
                Tokens <SortIcon field="total_tokens" />
              </button>
              <button className="flex items-center gap-1 hover:text-zinc-400 transition-colors text-right" onClick={() => toggleSort('cost_usd')}>
                Cost <SortIcon field="cost_usd" />
              </button>
              <button className="flex items-center gap-1 hover:text-zinc-400 transition-colors" onClick={() => toggleSort('duration_ms')}>
                Lat. <SortIcon field="duration_ms" />
              </button>
            </div>

            <div className="divide-y divide-zinc-800/60 max-h-[480px] overflow-y-auto">
              {filtered.map(event => {
                const meta = INTEGRATION_META[event.integration];
                const Icon = meta.icon;
                return (
                  <div key={event.id} className={cn(
                    'grid grid-cols-[130px_100px_90px_100px_100px_90px_70px_80px_60px] gap-2 px-4 py-2.5 items-center hover:bg-zinc-800/20 transition-colors',
                    event.status === 'error' && 'border-l-2 border-red-500/50',
                    event.status === 'timeout' && 'border-l-2 border-amber-500/50',
                  )}>
                    <span className="text-[10px] font-mono text-zinc-500">{event.ts.replace('T', ' ').slice(0, 16)}</span>
                    <div className={cn('flex items-center gap-1 text-[10px] font-medium', meta.color.split(' ')[0])}>
                      <Icon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{event.integration}</span>
                    </div>
                    <span className={cn('text-[11px] font-medium truncate', USE_CASE_COLOR[event.use_case])}>{event.use_case}</span>
                    <span className="text-[11px] text-zinc-400 truncate">{event.brand}</span>
                    <span className="text-[10px] text-zinc-600 truncate">{event.project}</span>
                    <span className="text-[10px] text-zinc-600 truncate">{event.model}</span>
                    <span className="text-[11px] text-zinc-400 font-mono">{event.total_tokens > 0 ? `${(event.total_tokens/1000).toFixed(1)}K` : '—'}</span>
                    <span className="text-[11px] font-semibold text-orange-400 font-mono text-right">{formatCost(event.cost_usd)}</span>
                    <span className={cn('text-[10px] font-mono', event.status === 'error' ? 'text-red-400' : event.status === 'timeout' ? 'text-amber-400' : 'text-zinc-500')}>
                      {event.status !== 'success' ? event.status.toUpperCase() : formatMs(event.duration_ms)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-2.5 border-t border-zinc-800/60 flex items-center justify-between bg-zinc-900/50 text-[11px] text-zinc-600">
              <span>{filtered.length} events</span>
              <div className="flex items-center gap-6">
                <span className="font-mono">{(totalTokens/1000).toFixed(1)}K tokens total</span>
                <span className="font-semibold text-orange-400 font-mono">${totalCost.toFixed(4)} total</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BY INTEGRATION TAB ── */}
      {tab === 'by-integration' && (
        <div className="space-y-3">
          {byIntegration.map(row => {
            const meta = INTEGRATION_META[row.integration];
            const Icon = meta.icon;
            const costShare = totalCost > 0 ? (row.cost / totalCost * 100) : 0;
            return (
              <div key={row.integration} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', meta.color)}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-zinc-200">{row.integration}</p>
                      <div className={cn(
                        'inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full mt-0.5',
                        meta.status === 'live' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      )}>
                        {meta.status === 'live' ? <Check className="w-2 h-2" /> : <AlertCircle className="w-2 h-2" />}
                        {meta.status === 'live' ? 'Live' : 'Mock Data'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[20px] font-bold text-orange-400 font-mono">${row.cost.toFixed(4)}</p>
                    <p className="text-[10px] text-zinc-600">{costShare.toFixed(1)}% of total</p>
                  </div>
                </div>
                <div className="mb-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${costShare}%` }} />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Requests', value: row.requests.toString() },
                    { label: 'Tokens', value: row.tokens > 0 ? `${(row.tokens/1000).toFixed(1)}K` : '—' },
                    { label: 'Errors', value: row.errors.toString(), highlight: row.errors > 0 },
                    { label: 'Avg Latency', value: formatMs(row.avgDuration) },
                  ].map(stat => (
                    <div key={stat.label} className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                      <p className={cn('text-[15px] font-bold', stat.highlight ? 'text-red-400' : 'text-zinc-200')}>{stat.value}</p>
                      <p className="text-[9px] text-zinc-600">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BY BRAND TAB ── */}
      {tab === 'by-brand' && (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_100px_100px_70px_100px] gap-3 px-4 py-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            <span>Brand / Project</span>
            <span className="text-right">Total Cost</span>
            <span className="text-right">Tokens</span>
            <span className="text-right">Req.</span>
            <span className="text-right">Top Use Case</span>
          </div>
          {byBrand.map(row => {
            const costShare = totalCost > 0 ? (row.cost / totalCost) : 0;
            return (
              <div key={row.brand} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                <div className="grid grid-cols-[1fr_100px_100px_70px_100px] gap-3 items-center mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <span className="text-[13px] font-semibold text-zinc-200">{row.brand}</span>
                  </div>
                  <span className="text-[13px] font-bold text-orange-400 font-mono text-right">${row.cost.toFixed(4)}</span>
                  <span className="text-[12px] text-zinc-400 font-mono text-right">{row.tokens > 0 ? `${(row.tokens/1000).toFixed(1)}K` : '—'}</span>
                  <span className="text-[12px] text-zinc-400 text-right">{row.requests}</span>
                  <span className={cn('text-[11px] font-medium text-right', USE_CASE_COLOR[row.topUseCase as UseCase])}>{row.topUseCase}</span>
                </div>
                {/* Cost share bar */}
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full" style={{ width: `${costShare * 100}%` }} />
                </div>
                {/* Projects for this brand */}
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {Array.from(new Set(filtered.filter(e => e.brand === row.brand).map(e => e.project))).map(proj => (
                    <span key={proj} className="flex items-center gap-1 text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                      <Tag className="w-2 h-2" />
                      {proj}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SCHEMA / ACTIVATE TAB ── */}
      {tab === 'schema' && (
        <div className="space-y-5">
          {/* Data sources status */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Script Engine & Hook Lab', status: 'live' as const, api: 'OpenAI API', note: 'Costs money per call. Set OPENAI_API_KEY in Vercel env vars.', action: 'Add env var in Vercel dashboard' },
              { name: 'Vault & Auth', status: 'live' as const, api: 'Supabase', note: 'Working. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.', action: 'Update .env.local with real project URL' },
              { name: 'Outlier Research', status: 'mock' as const, api: 'YouTube Data API v3', note: 'Free · 10,000 units/day. Get key at console.cloud.google.com. Add YOUTUBE_API_KEY env var.', action: 'Enable YouTube Data API v3 in Google Cloud Console' },
              { name: 'Ad Intelligence', status: 'mock' as const, api: 'BigSpy / Meta Ads Lib', note: 'BigSpy ~$9/mo for basic. Meta Ad Library is free but rate-limited. Add AD_INTEL_API_KEY env var.', action: 'Sign up for BigSpy or use Meta Ad Library API' },
              { name: 'Usage Tracking', status: 'pending' as const, api: 'Supabase (usage_events)', note: 'Run the SQL schema below in your Supabase project to activate real cost tracking.', action: 'Run SQL migration below' },
              { name: 'Claude AI (upgrade)', status: 'pending' as const, api: 'Anthropic Claude API', note: 'Replace OpenAI with Claude Sonnet 4.6. Add ANTHROPIC_API_KEY. Update actions/ai-scripts.ts.', action: 'Add ANTHROPIC_API_KEY in Vercel env vars' },
            ].map(src => (
              <div key={src.name} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[13px] font-semibold text-zinc-200">{src.name}</p>
                  <span className={cn(
                    'text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0',
                    src.status === 'live' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700/30' :
                    src.status === 'mock' ? 'text-amber-400 bg-amber-950/60 border-amber-700/30' :
                    'text-zinc-400 bg-zinc-800 border-zinc-700/30'
                  )}>
                    {src.status === 'live' ? '✓ LIVE' : src.status === 'mock' ? '⚠ MOCK' : '○ PENDING'}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-violet-400 mb-1">{src.api}</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed mb-2">{src.note}</p>
                <div className="flex items-center gap-1.5 bg-zinc-800/60 rounded-lg px-2.5 py-1.5">
                  <BookOpen className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                  <span className="text-[10px] text-zinc-600">{src.action}</span>
                </div>
              </div>
            ))}
          </div>

          {/* SQL Schema */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[13px] font-semibold text-zinc-200">Supabase Migration — usage_events</h3>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(SUPABASE_SCHEMA).catch(() => {}); setCopiedSchema(true); setTimeout(() => setCopiedSchema(false), 2000); }}
                className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copiedSchema ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy SQL</>}
              </button>
            </div>
            <pre className="p-4 text-[11px] text-emerald-300/80 font-mono leading-relaxed overflow-x-auto bg-zinc-950/60">
              {SUPABASE_SCHEMA.trim()}
            </pre>
          </div>

          <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-blue-300 mb-1">To wire up real cost tracking:</p>
                <ol className="text-[11px] text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>Run the SQL above in your Supabase project SQL editor</li>
                  <li>Update <code className="text-blue-300 bg-blue-950/60 px-1 rounded">src/actions/ai-scripts.ts</code> to call <code className="text-blue-300 bg-blue-950/60 px-1 rounded">logUsageEvent()</code> after each AI call</li>
                  <li>Replace <code className="text-blue-300 bg-blue-950/60 px-1 rounded">MOCK_EVENTS</code> in this page with a real <code className="text-blue-300 bg-blue-950/60 px-1 rounded">getUsageEvents()</code> server action</li>
                  <li>Set <code className="text-blue-300 bg-blue-950/60 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> in Vercel env vars to your real project</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
