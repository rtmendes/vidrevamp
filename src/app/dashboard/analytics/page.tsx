'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Zap,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  DollarSign,
  Coins,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

// ── Mock Performance Data ─────────────────────────────────────────────────────

interface ScriptPerf {
  id: string;
  title: string;
  type: string;
  platform: string;
  views: number;
  ctr: number;
  completionRate: number;
  conversions: number;
  score: number;
  trend: 'up' | 'down' | 'flat';
  delta: number;
  brand: string;
}

interface HookPerf {
  id: string;
  hook: string;
  type: string;
  avgRetention: number;
  usedCount: number;
  avgScore: number;
  trend: 'up' | 'down' | 'flat';
}

interface AvatarPerf {
  id: string;
  name: string;
  avatar: string;
  videosRun: number;
  avgScore: number;
  topPlatform: string;
  convRate: number;
  trend: 'up' | 'down' | 'flat';
}

interface Suggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  insight: string;
  action: string;
  impact: string;
}

interface TokenUsage {
  date: string;
  tokens: number;
  cost: number;
  model: string;
  action: string;
}

const SCRIPT_PERF: ScriptPerf[] = [
  { id: 's1', title: 'Founder Story — EduLaunch', type: 'Founder Story', platform: 'YouTube', views: 2400000, ctr: 8.4, completionRate: 71, conversions: 1840, score: 18.3, trend: 'up', delta: 3.2, brand: 'EduLaunch' },
  { id: 's2', title: 'Objection Handler: "Too expensive"', type: 'Objection Handling', platform: 'TikTok', views: 1800000, ctr: 6.1, completionRate: 58, conversions: 920, score: 14.2, trend: 'up', delta: 1.8, brand: 'WealthPath' },
  { id: 's3', title: 'Behind the Scenes — Product Build', type: 'Behind the Scenes', platform: 'YouTube', views: 980000, ctr: 4.2, completionRate: 84, conversions: 310, score: 9.4, trend: 'flat', delta: 0.1, brand: 'EduLaunch' },
  { id: 's4', title: 'Educational: 5 Money Mistakes', type: 'Educational', platform: 'TikTok', views: 3200000, ctr: 9.8, completionRate: 64, conversions: 2100, score: 22.1, trend: 'up', delta: 5.4, brand: 'WealthPath' },
  { id: 's5', title: 'Relatable: "I used to be broke"', type: 'Relatable', platform: 'Instagram', views: 740000, ctr: 3.1, completionRate: 45, conversions: 180, score: 6.2, trend: 'down', delta: -2.1, brand: 'FitPulse' },
  { id: 's6', title: 'Entertainment: Gym Fails Mashup', type: 'Entertainment', platform: 'TikTok', views: 5600000, ctr: 2.4, completionRate: 92, conversions: 420, score: 11.7, trend: 'up', delta: 2.9, brand: 'FitPulse' },
];

const HOOK_PERF: HookPerf[] = [
  { id: 'h1', hook: 'I made this mistake for 5 years before I finally figured it out.', type: 'Confession', avgRetention: 73, usedCount: 12, avgScore: 18.3, trend: 'up' },
  { id: 'h2', hook: 'What nobody tells you about [topic] — until now.', type: 'Curiosity Gap', avgRetention: 68, usedCount: 24, avgScore: 14.7, trend: 'up' },
  { id: 'h3', hook: 'POV: [relatable scenario]', type: 'POV / Relatable', avgRetention: 81, usedCount: 31, avgScore: 11.2, trend: 'flat' },
  { id: 'h4', hook: 'This is my [dashboard/result]. I\'m showing you everything.', type: 'Transparency', avgRetention: 79, usedCount: 8, avgScore: 16.4, trend: 'up' },
  { id: 'h5', hook: 'Most [people/experts] are wrong about [topic]. Here\'s the truth.', type: 'Contradiction', avgRetention: 65, usedCount: 18, avgScore: 9.8, trend: 'down' },
];

const AVATAR_PERF: AvatarPerf[] = [
  { id: 'av1', name: 'Jake Torres', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jake&backgroundColor=059669', videosRun: 89, avgScore: 14.2, topPlatform: 'TikTok', convRate: 3.8, trend: 'up' },
  { id: 'av2', name: 'Marcus Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus&backgroundColor=7c3aed', videosRun: 47, avgScore: 12.4, topPlatform: 'YouTube', convRate: 4.1, trend: 'up' },
  { id: 'av3', name: 'Sofia Reyes', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia&backgroundColor=0891b2', videosRun: 63, avgScore: 9.8, topPlatform: 'TikTok', convRate: 2.9, trend: 'flat' },
  { id: 'av4', name: 'Dr. Priya Sharma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=d97706', videosRun: 34, avgScore: 8.7, topPlatform: 'YouTube', convRate: 5.2, trend: 'up' },
];

const AI_SUGGESTIONS: Suggestion[] = [
  { id: 'sg1', priority: 'high', category: 'Hook', title: 'Double down on Transparency hooks', insight: 'Transparency-type hooks ("I\'m showing you everything") have 79% avg retention — 15% above your account average.', action: 'Generate 5 transparency-format hooks for your top 3 scripts', impact: 'Est. +3-5x uplift on next campaign' },
  { id: 'sg2', priority: 'high', category: 'Avatar', title: 'Deploy Jake Torres on Instagram Reels', insight: 'Jake performs 2.3x above average on TikTok but hasn\'t been tested on Instagram where FitPulse has 28% of its audience.', action: 'Clone Jake\'s top 3 TikTok scripts → reformat for Instagram Reels', impact: 'Est. 40K–80K incremental views/month' },
  { id: 'sg3', priority: 'medium', category: 'Script Type', title: 'Increase Educational content ratio', insight: 'Educational scripts average 22.1x outlier score — your highest across all categories. You\'re only using them 16% of the time.', action: 'Replace 2 Relatable scripts in next sprint with Educational format', impact: 'Projected +8.4x avg score improvement' },
  { id: 'sg4', priority: 'medium', category: 'Hook', title: 'Test POV hooks on YouTube long-form', insight: 'POV hooks have 81% retention on short-form. This format hasn\'t been tested on YouTube — high potential.', action: 'A/B test POV vs Curiosity Gap hook on next YouTube upload', impact: 'Data point to optimize hook selection' },
  { id: 'sg5', priority: 'low', category: 'Platform', title: 'WealthPath underperforming on Instagram', insight: 'WealthPath\'s Instagram content averages 6.2x vs 14.7x on TikTok. Creative format mismatch likely.', action: 'Audit visual style on Instagram posts — test vertical talking head vs text overlay', impact: 'Potential +40% engagement recovery' },
];

const TOKEN_LOG: TokenUsage[] = [
  { date: '2025-03-25', tokens: 4820, cost: 0.072, model: 'Claude Sonnet 4.6', action: 'Script Generation' },
  { date: '2025-03-25', tokens: 1240, cost: 0.018, model: 'Claude Sonnet 4.6', action: 'Hook Lab (3 hooks)' },
  { date: '2025-03-24', tokens: 6100, cost: 0.091, model: 'Claude Sonnet 4.6', action: 'Script Fix + Translate' },
  { date: '2025-03-24', tokens: 2380, cost: 0.036, model: 'Claude Sonnet 4.6', action: 'Script Generation' },
  { date: '2025-03-23', tokens: 3940, cost: 0.059, model: 'Claude Sonnet 4.6', action: 'Script Generation' },
  { date: '2025-03-22', tokens: 5200, cost: 0.078, model: 'Claude Sonnet 4.6', action: 'Script Generation x2' },
  { date: '2025-03-21', tokens: 1800, cost: 0.027, model: 'Claude Sonnet 4.6', action: 'Hook Lab (5 hooks)' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function miniBar(value: number, max: number, color: string) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden w-24">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function priorityColor(p: Suggestion['priority']) {
  if (p === 'high') return 'text-red-400 bg-red-950/60 border-red-700/30';
  if (p === 'medium') return 'text-orange-400 bg-orange-950/60 border-orange-700/30';
  return 'text-zinc-400 bg-zinc-800 border-zinc-700/30';
}

type AnalyticsTab = 'overview' | 'scripts' | 'hooks' | 'avatars' | 'ai' | 'tokens';

export default function AnalyticsPage() {
  const [tab, setTab] = useState<AnalyticsTab>('overview');

  const totalViews = SCRIPT_PERF.reduce((s, p) => s + p.views, 0);
  const avgScore = (SCRIPT_PERF.reduce((s, p) => s + p.score, 0) / SCRIPT_PERF.length).toFixed(1);
  const totalConversions = SCRIPT_PERF.reduce((s, p) => s + p.conversions, 0);
  const totalTokenCost = TOKEN_LOG.reduce((s, t) => s + t.cost, 0);
  const totalTokens = TOKEN_LOG.reduce((s, t) => s + t.tokens, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Analytics</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">
            Performance tracking, AI optimization signals, and token cost monitoring.
          </p>
        </div>
        <button className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 rounded-lg text-[12px] text-zinc-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Views', value: formatNumber(totalViews), delta: '+18%', up: true, icon: Eye, color: 'text-blue-400' },
          { label: 'Avg Outlier Score', value: avgScore + 'x', delta: '+2.1x', up: true, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Total Conversions', value: formatNumber(totalConversions), delta: '+34%', up: true, icon: Target, color: 'text-violet-400' },
          { label: 'AI Spend (7 days)', value: `$${totalTokenCost.toFixed(2)}`, delta: `${(totalTokens / 1000).toFixed(0)}K tokens`, up: true, icon: Coins, color: 'text-orange-400' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={cn('w-3.5 h-3.5', kpi.color)} />
              <span className="text-[11px] text-zinc-500">{kpi.label}</span>
            </div>
            <p className="text-[22px] font-bold text-zinc-100">{kpi.value}</p>
            <div className={cn('flex items-center gap-1 mt-1 text-[11px]', kpi.up ? 'text-emerald-400' : 'text-red-400')}>
              {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-zinc-900 border border-zinc-800/60 rounded-xl p-1 w-fit">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'scripts', label: 'Scripts' },
          { id: 'hooks', label: 'Hooks' },
          { id: 'avatars', label: 'Avatars' },
          { id: 'ai', label: '🤖 AI Optimize' },
          { id: 'tokens', label: '🪙 Token Cost' },
        ] as { id: AnalyticsTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all',
              tab === t.id ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Performance by script type */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
            <h3 className="text-[13px] font-semibold text-zinc-300 mb-4">Performance by Script Type</h3>
            <div className="space-y-3">
              {[
                { type: 'Educational', avg: 22.1, count: 8, color: 'bg-emerald-500' },
                { type: 'Founder Story', avg: 18.3, count: 12, color: 'bg-violet-500' },
                { type: 'Objection Handling', avg: 14.2, count: 15, color: 'bg-blue-500' },
                { type: 'Entertainment', avg: 11.7, count: 9, color: 'bg-yellow-500' },
                { type: 'Behind the Scenes', avg: 9.4, count: 7, color: 'bg-orange-500' },
                { type: 'Relatable', avg: 6.2, count: 11, color: 'bg-zinc-500' },
              ].map(row => (
                <div key={row.type} className="flex items-center gap-4">
                  <span className="text-[12px] text-zinc-400 w-40 flex-shrink-0">{row.type}</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', row.color)} style={{ width: `${(row.avg / 25) * 100}%` }} />
                  </div>
                  <span className="text-[12px] font-bold text-zinc-300 w-12 text-right">{row.avg}x</span>
                  <span className="text-[10px] text-zinc-600 w-12 text-right">{row.count} used</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform comparison */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { platform: 'TikTok', avgScore: 14.8, views: '18.6M', ctr: '7.2%', topType: 'Educational' },
              { platform: 'YouTube', avgScore: 12.1, views: '8.2M', ctr: '5.8%', topType: 'Founder Story' },
              { platform: 'Instagram', avgScore: 8.4, views: '4.1M', ctr: '3.4%', topType: 'Entertainment' },
            ].map(p => (
              <div key={p.platform} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    p.platform === 'YouTube' ? 'bg-red-600 text-white' :
                    p.platform === 'TikTok' ? 'bg-zinc-100 text-zinc-900' :
                    'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  )}>
                    {p.platform.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">{p.avgScore}x avg</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Views</span>
                    <span className="text-zinc-300">{p.views}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Avg CTR</span>
                    <span className="text-zinc-300">{p.ctr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Top Format</span>
                    <span className="text-violet-400">{p.topType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SCRIPTS TAB ── */}
      {tab === 'scripts' && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px_100px] gap-3 px-4 py-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            <span>Script</span><span className="text-right">Views</span><span className="text-right">CTR</span>
            <span className="text-right">Completion</span><span className="text-right">Conv.</span>
            <span className="text-right">Score</span><span className="text-right">vs last period</span>
          </div>
          {SCRIPT_PERF.map(s => (
            <div key={s.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 grid grid-cols-[1fr_80px_80px_80px_80px_80px_100px] gap-3 items-center hover:border-zinc-700 transition-colors">
              <div>
                <p className="text-[12px] font-semibold text-zinc-200 truncate">{s.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{s.type}</span>
                  <span className="text-[9px] text-zinc-700">{s.platform}</span>
                  <span className="text-[9px] text-zinc-700">{s.brand}</span>
                </div>
              </div>
              <span className="text-[12px] text-zinc-300 text-right">{formatNumber(s.views)}</span>
              <span className="text-[12px] text-zinc-300 text-right">{s.ctr}%</span>
              <div className="text-right">
                <span className="text-[12px] text-zinc-300">{s.completionRate}%</span>
                {miniBar(s.completionRate, 100, s.completionRate > 70 ? 'bg-emerald-500' : s.completionRate > 50 ? 'bg-yellow-500' : 'bg-red-500')}
              </div>
              <span className="text-[12px] text-zinc-300 text-right">{formatNumber(s.conversions)}</span>
              <span className={cn('text-[13px] font-bold text-right', s.score >= 15 ? 'text-emerald-400' : s.score >= 8 ? 'text-yellow-400' : 'text-zinc-400')}>
                {s.score.toFixed(1)}x
              </span>
              <div className={cn('flex items-center justify-end gap-1 text-[11px] font-medium', s.trend === 'up' ? 'text-emerald-400' : s.trend === 'down' ? 'text-red-400' : 'text-zinc-500')}>
                {s.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : s.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
                {s.delta > 0 ? '+' : ''}{s.delta.toFixed(1)}x
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── HOOKS TAB ── */}
      {tab === 'hooks' && (
        <div className="space-y-3">
          {HOOK_PERF.map(h => (
            <div key={h.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{h.type}</span>
                    <span className={cn('text-[10px] font-bold', h.trend === 'up' ? 'text-emerald-400' : 'text-red-400')}>
                      {h.trend === 'up' ? '↑' : '↓'} trending
                    </span>
                  </div>
                  <p className="text-[13px] text-zinc-200 font-medium italic">&ldquo;{h.hook}&rdquo;</p>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-violet-400">{h.avgRetention}%</p>
                    <p className="text-[9px] text-zinc-600">Avg Retention</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-emerald-400">{h.avgScore.toFixed(1)}x</p>
                    <p className="text-[9px] text-zinc-600">Avg Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-zinc-300">{h.usedCount}</p>
                    <p className="text-[9px] text-zinc-600">Times Used</p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                {miniBar(h.avgRetention, 100, h.avgRetention >= 75 ? 'bg-emerald-500' : h.avgRetention >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AVATARS TAB ── */}
      {tab === 'avatars' && (
        <div className="grid grid-cols-2 gap-4">
          {AVATAR_PERF.map(a => (
            <div key={a.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.avatar} alt="" className="w-12 h-12 rounded-xl" />
                <div>
                  <p className="text-[14px] font-semibold text-zinc-200">{a.name}</p>
                  <div className={cn('flex items-center gap-1 text-[11px] mt-0.5', a.trend === 'up' ? 'text-emerald-400' : a.trend === 'down' ? 'text-red-400' : 'text-zinc-500')}>
                    {a.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {a.trend === 'up' ? 'Improving' : a.trend === 'down' ? 'Declining' : 'Stable'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                  <p className="text-[18px] font-bold text-emerald-400">{a.avgScore.toFixed(1)}x</p>
                  <p className="text-[9px] text-zinc-600">Avg Score</p>
                </div>
                <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                  <p className="text-[18px] font-bold text-violet-400">{a.videosRun}</p>
                  <p className="text-[9px] text-zinc-600">Videos Run</p>
                </div>
                <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                  <p className="text-[18px] font-bold text-blue-400">{a.convRate}%</p>
                  <p className="text-[9px] text-zinc-600">Conv. Rate</p>
                </div>
                <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                  <p className="text-[14px] font-bold text-zinc-300">{a.topPlatform}</p>
                  <p className="text-[9px] text-zinc-600">Top Platform</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AI OPTIMIZE TAB ── */}
      {tab === 'ai' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-4 bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-800/30 rounded-xl p-4">
            <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-zinc-200">{AI_SUGGESTIONS.length} Optimization Opportunities Found</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Based on your last 30 days of performance data across all brands.</p>
            </div>
          </div>
          {AI_SUGGESTIONS.map(sg => (
            <div key={sg.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 text-[9px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider flex-shrink-0', priorityColor(sg.priority))}>
                  {sg.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{sg.category}</span>
                    <p className="text-[13px] font-semibold text-zinc-200">{sg.title}</p>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed mb-2">{sg.insight}</p>
                  <div className="flex items-start gap-2 bg-zinc-800/40 rounded-lg p-2.5 mb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400"><span className="text-violet-400 font-medium">Action: </span>{sg.action}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Zap className="w-3 h-3" />
                    {sg.impact}
                  </div>
                </div>
                <button className="flex-shrink-0 flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 rounded-lg">
                  Apply
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TOKEN COST TAB ── */}
      {tab === 'tokens' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-[11px] text-zinc-500">7-Day Token Usage</span>
              </div>
              <p className="text-[24px] font-bold text-zinc-100">{(totalTokens / 1000).toFixed(1)}K</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">tokens consumed</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-zinc-500">7-Day AI Cost</span>
              </div>
              <p className="text-[24px] font-bold text-zinc-100">${totalTokenCost.toFixed(3)}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">${(totalTokenCost / 7 * 30).toFixed(2)} projected/month</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] text-zinc-500">Cost Per Script</span>
              </div>
              <p className="text-[24px] font-bold text-zinc-100">${(totalTokenCost / TOKEN_LOG.filter(t => t.action.includes('Script')).length).toFixed(4)}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">avg per generation</p>
            </div>
          </div>

          {/* Usage log */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/60">
              <h3 className="text-[13px] font-semibold text-zinc-300">Recent Usage Log</h3>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {TOKEN_LOG.map((entry, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-[11px] text-zinc-600 w-24 flex-shrink-0">{entry.date}</span>
                  <span className="flex-1 text-[12px] text-zinc-300">{entry.action}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">{entry.model}</span>
                  <span className="text-[12px] text-zinc-400 w-20 text-right font-mono">{(entry.tokens / 1000).toFixed(1)}K tok</span>
                  <span className="text-[12px] font-semibold text-orange-400 w-16 text-right font-mono">${entry.cost.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-zinc-800/60 flex items-center justify-between bg-zinc-900/50">
              <span className="text-[11px] text-zinc-600">7-day total</span>
              <div className="flex items-center gap-6">
                <span className="text-[12px] text-zinc-400 font-mono">{(totalTokens / 1000).toFixed(1)}K tokens</span>
                <span className="text-[13px] font-bold text-orange-400 font-mono">${totalTokenCost.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-zinc-300 mb-3">Cost Breakdown by Action</h3>
            {[
              { action: 'Script Generation', count: 5, tokens: 18440, cost: 0.277 },
              { action: 'Hook Lab', count: 8, tokens: 3040, cost: 0.046 },
              { action: 'Script Fix / Fixer', count: 2, tokens: 3200, cost: 0.048 },
              { action: 'Translation', count: 1, tokens: 900, cost: 0.013 },
            ].map(row => (
              <div key={row.action} className="flex items-center gap-4 py-2">
                <span className="text-[12px] text-zinc-400 flex-1">{row.action}</span>
                <span className="text-[11px] text-zinc-600 w-12 text-right">{row.count}x</span>
                <span className="text-[11px] text-zinc-500 w-20 text-right font-mono">{(row.tokens / 1000).toFixed(1)}K tok</span>
                <div className="w-24">{miniBar(row.cost, 0.3, 'bg-orange-500')}</div>
                <span className="text-[12px] font-semibold text-orange-400 w-16 text-right font-mono">${row.cost.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
