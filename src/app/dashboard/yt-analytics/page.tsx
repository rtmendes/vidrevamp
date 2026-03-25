'use client';

import { useState } from 'react';
import {
  Play, TrendingUp, Eye, MousePointerClick, Users, Clock,
  BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, ChevronDown,
  Zap, ThumbsUp, Share2, Bell, Radio,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

// ── Mock YouTube Analytics Data ───────────────────────────────────────────────
// In production: YouTube Analytics API v2 — reports.query()
// Scopes: youtube.readonly + yt-analytics.readonly

const DATE_RANGES = ['Last 7 days', 'Last 28 days', 'Last 90 days', 'Last 365 days'] as const;
type DateRange = typeof DATE_RANGES[number];

interface ChannelOverview {
  subscribers: number; subscriberDelta: number;
  views: number; viewsDelta: number;
  watchTimeHours: number; watchTimeDelta: number;
  revenue: number; revenueDelta: number;
}

const OVERVIEW: Record<DateRange, ChannelOverview> = {
  'Last 7 days':    { subscribers: 247,   subscriberDelta: 12.4,  views: 84_320,  viewsDelta: 18.2, watchTimeHours: 4_218,  watchTimeDelta: 22.1, revenue: 312,   revenueDelta: 15.8 },
  'Last 28 days':   { subscribers: 1_042, subscriberDelta: 8.1,   views: 312_480, viewsDelta: 11.4, watchTimeHours: 15_820, watchTimeDelta: 9.4,  revenue: 1_284, revenueDelta: 6.7  },
  'Last 90 days':   { subscribers: 3_218, subscriberDelta: 6.3,   views: 924_100, viewsDelta: 7.8,  watchTimeHours: 46_200, watchTimeDelta: 5.2,  revenue: 4_104, revenueDelta: 4.1  },
  'Last 365 days':  { subscribers: 12_441,subscriberDelta: 3.2,   views: 3_840_000,viewsDelta:2.9,  watchTimeHours:192_000, watchTimeDelta: 1.8,  revenue: 18_920,revenueDelta: 2.4  },
};

interface VideoStat {
  id: string; title: string; thumbnail: string;
  views: number; impressions: number; ctr: number;
  avgViewDuration: string; avgViewPct: number;
  likes: number; comments: number; shares: number;
  publishedDaysAgo: number;
}

const TOP_VIDEOS: VideoStat[] = [
  { id: 'v1', title: 'How I Built a $50K/Month Business With No Employees', thumbnail: 'gradient-orange',
    views: 284_000, impressions: 1_840_000, ctr: 15.4, avgViewDuration: '4:22', avgViewPct: 62,
    likes: 8_400, comments: 1_240, shares: 3_100, publishedDaysAgo: 14 },
  { id: 'v2', title: 'The ONE Framework That 10x\'d My Productivity', thumbnail: 'gradient-blue',
    views: 142_800, impressions: 1_120_000, ctr: 12.8, avgViewDuration: '3:48', avgViewPct: 54,
    likes: 4_200, comments: 680, shares: 1_820, publishedDaysAgo: 28 },
  { id: 'v3', title: 'Why Most Creators Fail (And Exactly How to Fix It)', thumbnail: 'gradient-violet',
    views: 98_400, impressions: 880_000, ctr: 11.2, avgViewDuration: '5:01', avgViewPct: 71,
    likes: 3_100, comments: 940, shares: 2_200, publishedDaysAgo: 45 },
  { id: 'v4', title: 'I Tried Every Viral Hook Formula for 30 Days', thumbnail: 'gradient-emerald',
    views: 76_200, impressions: 724_000, ctr: 10.5, avgViewDuration: '3:12', avgViewPct: 45,
    likes: 2_840, comments: 420, shares: 980, publishedDaysAgo: 62 },
  { id: 'v5', title: 'Content Strategy That Got Me 100K Subs in 90 Days', thumbnail: 'gradient-pink',
    views: 64_100, impressions: 680_000, ctr: 9.4, avgViewDuration: '6:18', avgViewPct: 89,
    likes: 2_100, comments: 380, shares: 1_400, publishedDaysAgo: 78 },
];

// Retention curve data points (0-100% of video, viewerPct at each point)
const RETENTION_CURVES: Record<string, number[]> = {
  v1: [100,91,87,83,79,74,68,63,59,56,52,49,46,43,41,39,37,36,35,34,33,32,31,31,30,30,29,28,27,26,25,24,23,22,21],
  v2: [100,88,83,78,72,66,60,54,49,45,41,38,35,32,30,28,26,25,24,23,22,21,21,20,20,19,19,18,17,16,15,14,13,12,11],
  v3: [100,93,90,87,85,82,79,76,73,71,69,67,66,64,63,62,61,60,59,58,57,56,55,54,53,52,51,50,49,48,47,46,45,44,43],
  v4: [100,86,80,73,66,59,52,46,41,37,33,30,27,25,23,21,20,19,18,17,17,16,15,15,14,14,13,13,12,12,11,11,10,10,9],
  v5: [100,94,92,91,89,88,87,86,85,84,83,82,81,80,80,79,78,78,77,77,76,75,75,74,74,73,72,72,71,70,69,68,67,66,65],
};

const TRAFFIC_SOURCES = [
  { source: 'YouTube Search', pct: 34.2, views: 28_800, color: 'bg-red-500' },
  { source: 'Browse Features', pct: 28.1, views: 23_680, color: 'bg-blue-500' },
  { source: 'External', pct: 14.8, views: 12_480, color: 'bg-violet-500' },
  { source: 'Suggested Videos', pct: 13.4, views: 11_300, color: 'bg-orange-500' },
  { source: 'Direct / Unknown', pct: 6.2,  views: 5_224, color: 'bg-zinc-500' },
  { source: 'Notifications', pct: 3.3,  views: 2_782, color: 'bg-emerald-500' },
];

const DEMOGRAPHICS = [
  { label: '18–24', male: 18, female: 12 },
  { label: '25–34', male: 28, female: 19 },
  { label: '35–44', male: 22, female: 14 },
  { label: '45–54', male: 12, female: 8  },
  { label: '55–64', male: 5,  female: 3  },
  { label: '65+',   male: 2,  female: 1  },
];

// Build SVG path from retention data
function retentionPath(data: number[], w = 320, h = 80): string {
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / 100) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${pts.join(' L ')}`;
}

function ThumbnailGradient({ type, className }: { type: string; className?: string }) {
  const map: Record<string, string> = {
    'gradient-orange': 'from-orange-600 to-red-700',
    'gradient-blue': 'from-blue-600 to-cyan-700',
    'gradient-violet': 'from-violet-600 to-indigo-700',
    'gradient-emerald': 'from-emerald-600 to-teal-700',
    'gradient-pink': 'from-pink-600 to-rose-700',
  };
  return <div className={cn('bg-gradient-to-br rounded-lg', map[type] ?? 'from-zinc-600 to-zinc-700', className)} />;
}

export default function YTAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('Last 28 days');
  const [selectedVideo, setSelectedVideo] = useState<string>('v1');
  const [tab, setTab] = useState<'overview' | 'videos' | 'audience' | 'retention'>('overview');

  const overview = OVERVIEW[dateRange];
  const selVideo = TOP_VIDEOS.find(v => v.id === selectedVideo) ?? TOP_VIDEOS[0];
  const retData = RETENTION_CURVES[selectedVideo] ?? RETENTION_CURVES.v1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center">
              <Play className="w-4 h-4 text-white" strokeWidth={2.5} fill="white" />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">YouTube Analytics</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">Own channel performance — impressions, CTR, retention, audience, revenue.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as DateRange)}
              className="appearance-none bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 pl-3 pr-8 text-[12px] text-zinc-300 focus:outline-none focus:border-red-500/60"
            >
              {DATE_RANGES.map(r => <option key={r}>{r}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 bg-zinc-800/60 border border-zinc-700/40 px-3 py-2 rounded-lg transition-colors">
            <RefreshCw className="w-3 h-3" /> Sync
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Connected · @yourchannel
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1">
        {(['overview', 'videos', 'audience', 'retention'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-2 rounded-lg text-[12px] font-medium capitalize transition-all', tab === t ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
          >{t}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'New Subscribers', value: formatNumber(overview.subscribers), delta: overview.subscriberDelta, icon: Users, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Views', value: formatNumber(overview.views), delta: overview.viewsDelta, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Watch Time (hrs)', value: formatNumber(overview.watchTimeHours), delta: overview.watchTimeDelta, icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { label: 'Estimated Revenue', value: `$${overview.revenue.toLocaleString()}`, delta: overview.revenueDelta, icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', kpi.bg)}>
                    <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                  </div>
                  <span className={cn('flex items-center gap-0.5 text-[11px] font-bold', kpi.delta >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {kpi.delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(kpi.delta)}%
                  </span>
                </div>
                <p className={cn('text-[24px] font-bold', kpi.color)}>{kpi.value}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Impression funnel */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-red-400" />
              Impression → View Funnel
            </h3>
            <div className="grid grid-cols-3 gap-0 relative">
              {[
                { label: 'Impressions', value: '6.24M', sub: 'Thumbnail shown to viewer', w: '100%', color: 'bg-zinc-700' },
                { label: 'Click-Through Rate', value: '13.5%', sub: 'vs 4–8% YouTube avg', w: '13.5%', color: 'bg-red-600' },
                { label: 'Views from Impressions', value: '840K', sub: 'Completed view events', w: '13.5%', color: 'bg-orange-500' },
              ].map((step, i) => (
                <div key={i} className="text-center px-4">
                  <div className="h-12 bg-zinc-800 rounded-xl overflow-hidden flex items-end mb-2">
                    <div className={cn('w-full rounded-b-xl transition-all', step.color)} style={{ height: step.w }} />
                  </div>
                  <p className="text-[18px] font-bold text-zinc-100">{step.value}</p>
                  <p className="text-[11px] font-semibold text-zinc-400">{step.label}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{step.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic sources + demographics side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" />
                Traffic Sources
              </h3>
              <div className="space-y-3">
                {TRAFFIC_SOURCES.map(ts => (
                  <div key={ts.source}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">{ts.source}</span>
                      <span className="text-zinc-300 font-semibold">{ts.pct}% <span className="text-zinc-600">({formatNumber(ts.views)})</span></span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', ts.color)} style={{ width: `${ts.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Viewer Demographics (Age &amp; Gender)
              </h3>
              <div className="space-y-2">
                {DEMOGRAPHICS.map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-10">{d.label}</span>
                    <div className="flex-1 flex gap-0.5 h-5">
                      {/* Male bar (right-anchored, reversed direction visually) */}
                      <div className="flex-1 flex justify-end items-center">
                        <div className="h-3 rounded-l bg-blue-500/70" style={{ width: `${d.male * 2.5}%` }} />
                      </div>
                      <div className="w-px bg-zinc-700" />
                      <div className="flex-1 flex items-center">
                        <div className="h-3 rounded-r bg-pink-400/70" style={{ width: `${d.female * 2.5}%` }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-600 w-12 text-right">{d.male}% / {d.female}%</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-2 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/70 inline-block" /> Male</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-pink-400/70 inline-block" /> Female</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEOS TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'videos' && (
        <div className="space-y-3">
          {TOP_VIDEOS.map((vid, i) => (
            <div key={vid.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4">
              <span className="text-[13px] font-black text-zinc-700 w-5 text-center">{i + 1}</span>
              <ThumbnailGradient type={vid.thumbnail} className="w-20 h-11 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-200 leading-snug truncate">{vid.title}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{vid.publishedDaysAgo}d ago</p>
              </div>
              <div className="grid grid-cols-5 gap-4 text-center">
                {[
                  { label: 'Views', value: formatNumber(vid.views), color: 'text-blue-400' },
                  { label: 'CTR', value: `${vid.ctr}%`, color: vid.ctr >= 12 ? 'text-emerald-400' : vid.ctr >= 8 ? 'text-yellow-400' : 'text-red-400' },
                  { label: 'Avg View', value: vid.avgViewDuration, color: 'text-violet-400' },
                  { label: 'Completion', value: `${vid.avgViewPct}%`, color: vid.avgViewPct >= 60 ? 'text-emerald-400' : 'text-zinc-400' },
                  { label: 'Likes', value: formatNumber(vid.likes), color: 'text-pink-400' },
                ].map(m => (
                  <div key={m.label}>
                    <p className={cn('text-[14px] font-bold', m.color)}>{m.value}</p>
                    <p className="text-[9px] text-zinc-600">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AUDIENCE TAB ───────────────────────────────────────────────────────── */}
      {tab === 'audience' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Subscribers', value: '48,240', sub: '+3.2% vs prior period', color: 'text-red-400' },
              { label: 'Returning Viewers', value: '72.4%', sub: 'Loyal audience ratio', color: 'text-violet-400' },
              { label: 'Avg Watch Session', value: '14m 32s', sub: 'Across all content', color: 'text-blue-400' },
            ].map(c => (
              <div key={c.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5 text-center">
                <p className={cn('text-[32px] font-black', c.color)}>{c.label === 'Total Subscribers' ? c.value : c.value}</p>
                <p className="text-[12px] text-zinc-400 font-semibold mt-1">{c.label}</p>
                <p className="text-[10px] text-zinc-600">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Subscriber growth chart (SVG sparkline) */}
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" />
                Subscriber Growth (last 30 days)
              </h3>
              <svg viewBox="0 0 320 80" className="w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const pts = [28,34,22,45,38,52,41,60,48,58,62,44,71,68,74,55,82,78,88,70,94,87,98,84,102,91,112,108,118,124].map((v, i) => ({
                    x: (i / 29) * 320, y: 80 - (v / 130) * 75,
                  }));
                  const path = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                  const area = `${path} L 320,80 L 0,80 Z`;
                  return (
                    <>
                      <path d={area} fill="url(#subGrad)" />
                      <path d={path} stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  );
                })()}
              </svg>
              <p className="text-[10px] text-zinc-600 text-center mt-2">Daily new subscribers</p>
            </div>

            {/* Top geographies */}
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <h3 className="text-[13px] font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Top Geographies by Views
              </h3>
              <div className="space-y-2.5">
                {[
                  { country: '🇺🇸 United States', pct: 42.1, views: 35_500 },
                  { country: '🇬🇧 United Kingdom', pct: 12.4, views: 10_456 },
                  { country: '🇨🇦 Canada', pct: 9.8,  views: 8_264 },
                  { country: '🇦🇺 Australia', pct: 7.2,  views: 6_069 },
                  { country: '🇮🇳 India', pct: 6.1,  views: 5_143 },
                  { country: '🇩🇪 Germany', pct: 4.8,  views: 4_047 },
                ].map(g => (
                  <div key={g.country}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">{g.country}</span>
                      <span className="text-zinc-300 font-semibold">{g.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${g.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RETENTION TAB ──────────────────────────────────────────────────────── */}
      {tab === 'retention' && (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {TOP_VIDEOS.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVideo(v.id)}
                className={cn('flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-left', selectedVideo === v.id ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700')}
              >
                <ThumbnailGradient type={v.thumbnail} className="w-full h-8" />
                <p className="text-[10px] text-zinc-400 leading-tight line-clamp-2">{v.title}</p>
                <span className={cn('text-[10px] font-bold', v.ctr >= 12 ? 'text-emerald-400' : 'text-zinc-500')}>CTR {v.ctr}%</span>
              </button>
            ))}
          </div>

          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[14px] font-bold text-zinc-200">{selVideo.title}</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Avg view duration: <span className="text-zinc-300 font-semibold">{selVideo.avgViewDuration}</span>
                  &ensp;·&ensp; Completion rate: <span className="text-zinc-300 font-semibold">{selVideo.avgViewPct}%</span>
                  &ensp;·&ensp; Views: <span className="text-zinc-300 font-semibold">{formatNumber(selVideo.views)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-blue-400"><span className="w-3 h-0.5 rounded bg-blue-400 inline-block" /> This video</span>
                <span className="flex items-center gap-1.5 text-zinc-600"><span className="w-3 h-0.5 rounded bg-zinc-600 inline-block border-dashed" /> YouTube avg</span>
              </div>
            </div>

            {/* Retention SVG chart */}
            <div className="relative">
              <svg viewBox="0 0 640 120" className="w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* YouTube average line (simulated 50% at 50% of video) */}
                <path d="M 0,30 Q 320,60 640,85" stroke="#52525b" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
                {/* Retention area */}
                {(() => {
                  const scaled = retData.map((v, i) => ({
                    x: (i / (retData.length - 1)) * 640,
                    y: 110 - (v / 100) * 100,
                  }));
                  const path = `M ${scaled.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                  const area = `${path} L 640,110 L 0,110 Z`;
                  return (
                    <>
                      <path d={area} fill="url(#retGrad)" />
                      <path d={path} stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                  );
                })()}
                {/* Axis labels */}
                {[0, 25, 50, 75, 100].map(pct => (
                  <text key={pct} x={(pct / 100) * 640} y="118" textAnchor="middle" fontSize="8" fill="#52525b">{pct}%</text>
                ))}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>Video start</span>
              <span>← Position in video →</span>
              <span>Video end</span>
            </div>

            {/* Key retention moments */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <p className="text-[20px] font-bold text-blue-400">{retData[Math.floor(retData.length * 0.3)]}%</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Retention @ 30%</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <p className="text-[20px] font-bold text-violet-400">{retData[Math.floor(retData.length * 0.5)]}%</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Retention @ midpoint</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <p className="text-[20px] font-bold text-emerald-400">{retData[retData.length - 1]}%</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Completion rate</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
