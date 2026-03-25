'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Zap,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Brain,
  Bot,
  Globe,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'ceo' | 'cro' | 'cto' | 'cmo' | 'sales'

// ─── Static Data ──────────────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { label: 'Research', count: 42, color: 'bg-cyan-500' },
  { label: 'Brief', count: 31, color: 'bg-blue-500' },
  { label: 'Script', count: 24, color: 'bg-violet-500' },
  { label: 'Storyboard', count: 18, color: 'bg-purple-500' },
  { label: 'Video', count: 11, color: 'bg-pink-500' },
  { label: 'Published', count: 8, color: 'bg-emerald-500' },
]

const WATERFALL_DATA = [
  { label: 'Views', value: 2400000, display: '2.4M', pct: 100, color: 'bg-cyan-500' },
  { label: 'Profile Visits', value: 48000, display: '48K', pct: 2, color: 'bg-blue-500' },
  { label: 'Link Clicks', value: 9200, display: '9.2K', pct: 0.38, color: 'bg-violet-500' },
  { label: 'Conversions', value: 384, display: '384', pct: 0.016, color: 'bg-emerald-500' },
]

const ROI_CONTENT = [
  { type: 'Hook Lab + Script', roi: '$6.10', views: '890K', cost: '$1.20', trend: 'up' },
  { type: 'UGC Avatar Video', roi: '$4.80', views: '1.1M', cost: '$3.40', trend: 'up' },
  { type: 'Repurposed Long-Form', roi: '$3.90', views: '620K', cost: '$0.80', trend: 'down' },
  { type: 'Original Short-Form', roi: '$2.30', views: '340K', cost: '$2.10', trend: 'down' },
]

const HOOK_MATRIX = [
  { formula: 'Pattern Interrupt', ctr: '9.4%', views: '340K', winRate: '72%' },
  { formula: 'Curiosity Gap', ctr: '8.1%', views: '290K', winRate: '65%' },
  { formula: 'Social Proof', ctr: '7.8%', views: '270K', winRate: '61%' },
  { formula: 'Fear of Missing Out', ctr: '7.2%', views: '240K', winRate: '58%' },
  { formula: 'How-To Promise', ctr: '6.9%', views: '220K', winRate: '54%' },
  { formula: 'Contrarian Claim', ctr: '6.4%', views: '190K', winRate: '49%' },
]

const RETENTION_MAP = [
  { time: '0s', pct: 100 },
  { time: '5s', pct: 74 },
  { time: '15s', pct: 58 },
  { time: '30s', pct: 41 },
  { time: '45s', pct: 29 },
  { time: '60s', pct: 18 },
]

const SPLIT_TESTS = [
  {
    id: 1,
    name: 'Hook Style A vs B',
    winner: 'Version B',
    lift: '+22%',
    confidence: '97%',
    metric: 'CTR',
    status: 'complete',
  },
  {
    id: 2,
    name: 'Thumbnail Color Test',
    winner: 'Red Variant',
    lift: '+14%',
    confidence: '94%',
    metric: 'Impressions',
    status: 'complete',
  },
  {
    id: 3,
    name: 'CTA Placement (End vs Mid)',
    winner: 'Mid-Roll',
    lift: '+31%',
    confidence: '99%',
    metric: 'Click Rate',
    status: 'complete',
  },
]

const TOP_CTAS = [
  { cta: '"Link in bio for full guide"', clickRate: '4.8%' },
  { cta: '"Comment your niche below"', clickRate: '3.9%' },
  { cta: '"Subscribe for weekly drops"', clickRate: '3.2%' },
  { cta: '"Check pinned comment"', clickRate: '2.7%' },
  { cta: '"DM me the word SCRIPT"', clickRate: '2.1%' },
]

const WEEKLY_PATTERNS = [
  'Videos opening with a bold contrarian statement outperformed curiosity hooks by 22% in average watch time this week.',
  'Shorts under 38 seconds are converting 3x better on profile visits than content between 45–60s.',
  'UGC-style avatars with a direct-to-camera opener achieved 71% average retention at the 30-second mark.',
]

const API_HEALTH = [
  { name: 'OpenAI', status: 'healthy', latency: '182ms', quota: '84% remaining', icon: Brain },
  { name: 'OpenRouter', status: 'healthy', latency: '210ms', quota: '91% remaining', icon: Globe },
  { name: 'HeyGen', status: 'warning', latency: '540ms', quota: '38% remaining', icon: Play },
  { name: 'YouTube API', status: 'healthy', latency: '94ms', quota: '76% remaining', icon: BarChart3 },
  { name: 'Apify', status: 'healthy', latency: '330ms', quota: '62% remaining', icon: Bot },
]

const COST_LEDGER = [
  { feature: 'Script Gen', monthCost: '$142.80', perUse: '$0.34', totalUses: 420 },
  { feature: 'Vision Analysis', monthCost: '$89.20', perUse: '$0.18', totalUses: 496 },
  { feature: 'Split Tests', monthCost: '$31.50', perUse: '$0.09', totalUses: 350 },
  { feature: 'Storyboard Gen', monthCost: '$67.40', perUse: '$0.52', totalUses: 130 },
  { feature: 'HeyGen Videos', monthCost: '$218.00', perUse: '$4.36', totalUses: 50 },
]

const AGENT_LOG = [
  { agent: 'ResearchBot', status: 'success', duration: '1m 42s', cost: '$0.12', output: '14 viral clips scraped' },
  { agent: 'ScriptWriter', status: 'success', duration: '0m 58s', cost: '$0.34', output: 'Script v3 drafted' },
  { agent: 'SplitTester', status: 'success', duration: '3m 10s', cost: '$0.09', output: 'Test #47 concluded' },
  { agent: 'HeyGenRunner', status: 'error', duration: '2m 04s', cost: '$0.00', output: 'Timeout — retrying' },
  { agent: 'ThumbnailAI', status: 'success', duration: '0m 34s', cost: '$0.21', output: '3 concepts generated' },
]

const SUPABASE_HEALTH = [
  { table: 'usage_events', rows: '148,204', size: '22.4 MB', status: 'healthy' },
  { table: 'videos', rows: '9,841', size: '4.1 MB', status: 'healthy' },
  { table: 'channels', rows: '312', size: '0.3 MB', status: 'healthy' },
  { table: 'projects', rows: '1,890', size: '1.7 MB', status: 'healthy' },
]

const ERROR_RATES = [
  { integration: 'OpenAI', rate: 0.4, display: '0.4%' },
  { integration: 'HeyGen', rate: 6.2, display: '6.2%' },
  { integration: 'Apify', rate: 1.8, display: '1.8%' },
  { integration: 'YouTube', rate: 0.1, display: '0.1%' },
  { integration: 'OpenRouter', rate: 0.9, display: '0.9%' },
]

// ─── CMO Static Data ──────────────────────────────────────────────────────────

const PLATFORM_PERFORMANCE = [
  { platform: 'YouTube', subscribers: '48.2K', reach: '2.4M', avgCTR: '13.5%', postFreq: '4/wk', growth: '+12%', color: 'text-red-400' },
  { platform: 'TikTok', subscribers: '127K', reach: '1.8M', avgCTR: '8.2%', postFreq: '7/wk', growth: '+34%', color: 'text-zinc-100' },
  { platform: 'Instagram', subscribers: '31.4K', reach: '620K', avgCTR: '4.1%', postFreq: '5/wk', growth: '+8%', color: 'text-pink-400' },
]

const CONTENT_FORMAT_PERF = [
  { format: 'Short-Form (<60s)', views: '1.2M', ctr: '11.4%', retention: '68%', convRate: '1.8%', trend: 'up' as const },
  { format: 'Medium-Form (1–5 min)', views: '820K', ctr: '9.2%', retention: '54%', convRate: '2.4%', trend: 'up' as const },
  { format: 'Long-Form (>10 min)', views: '380K', ctr: '7.8%', retention: '41%', convRate: '3.1%', trend: 'down' as const },
  { format: 'UGC Avatar', views: '1.1M', ctr: '10.1%', retention: '72%', convRate: '2.9%', trend: 'up' as const },
]

const PUBLISH_CADENCE = [
  { day: 'Mon', count: 2 },
  { day: 'Tue', count: 3 },
  { day: 'Wed', count: 1 },
  { day: 'Thu', count: 3 },
  { day: 'Fri', count: 2 },
  { day: 'Sat', count: 1 },
  { day: 'Sun', count: 0 },
]

const TOP_THUMBNAIL_STYLES = [
  { style: 'Pattern Interrupt', ctr: '18.4%', impressions: '890K', lift: '+62%' },
  { style: 'Direct-to-Camera Face', ctr: '14.2%', impressions: '740K', lift: '+40%' },
  { style: 'Result-Before-Process', ctr: '13.1%', impressions: '620K', lift: '+29%' },
  { style: 'Split-Screen Comparison', ctr: '11.8%', impressions: '510K', lift: '+16%' },
]

const AUDIENCE_GROWTH = [
  { month: 'Oct', subs: 28400 },
  { month: 'Nov', subs: 31200 },
  { month: 'Dec', subs: 35800 },
  { month: 'Jan', subs: 38100 },
  { month: 'Feb', subs: 43900 },
  { month: 'Mar', subs: 48200 },
]

// ─── SALES Static Data ────────────────────────────────────────────────────────

const REVENUE_ATTRIBUTION = [
  { source: 'YouTube Organic', leads: 184, deals: 24, arr: '$86,400', avgDeal: '$3,600', trend: 'up' as const },
  { source: 'TikTok Organic', leads: 97, deals: 11, arr: '$28,600', avgDeal: '$2,600', trend: 'up' as const },
  { source: 'Instagram Reels', leads: 43, deals: 4, arr: '$9,200', avgDeal: '$2,300', trend: 'neutral' as const },
  { source: 'Email (content-driven)', leads: 218, deals: 32, arr: '$112,000', avgDeal: '$3,500', trend: 'up' as const },
]

const TOP_CONVERTING_VIDEOS = [
  { title: 'The Framework That Gets 10x Results', platform: 'YouTube', views: '840K', leads: 48, convRate: '5.7%', revenue: '$24K' },
  { title: 'I Replaced My Entire Agency With This', platform: 'YouTube', views: '1.1M', leads: 41, convRate: '3.7%', revenue: '$18.4K' },
  { title: 'The 5-Step System Nobody Talks About', platform: 'TikTok', views: '2.4M', leads: 37, convRate: '1.5%', revenue: '$14.8K' },
  { title: 'Why Your Business Is Not Growing', platform: 'YouTube', views: '620K', leads: 31, convRate: '5.0%', revenue: '$12.4K' },
]

const LEAD_FUNNEL = [
  { stage: 'Video Views', display: '4.2M', dropPct: 2 },
  { stage: 'Profile Visits', display: '84K', dropPct: 20 },
  { stage: 'Link Clicks', display: '16.8K', dropPct: 15 },
  { stage: 'Opt-ins', display: '2.5K', dropPct: 15 },
  { stage: 'Discovery Calls', display: '378', dropPct: 19 },
  { stage: 'Closed Deals', display: '71', dropPct: 100 },
]

const MONTHLY_REVENUE = [
  { month: 'Oct', value: 38000 },
  { month: 'Nov', value: 52000 },
  { month: 'Dec', value: 47000 },
  { month: 'Jan', value: 68000 },
  { month: 'Feb', value: 79000 },
  { month: 'Mar', value: 91000 },
]

const HOOK_CONVERSIONS = [
  { hook: '"Stop doing what everyone else is doing…"', bookings: 24, rate: '6.2%' },
  { hook: '"I made $X in Y days using this one method"', bookings: 19, rate: '4.9%' },
  { hook: '"The truth about [topic] nobody tells you"', bookings: 17, rate: '4.4%' },
  { hook: '"Here\'s why you\'re not getting results…"', bookings: 14, rate: '3.6%' },
  { hook: '"I fired my team and replaced them with this"', bookings: 11, rate: '2.9%' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
      {children}
    </p>
  )
}

function KpiCard({
  label,
  value,
  trend,
  trendLabel,
  color,
  icon: Icon,
}: {
  label: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  trendLabel: string
  color: 'emerald' | 'violet' | 'blue' | 'yellow'
  icon: React.ElementType
}) {
  const colorMap = {
    emerald: { value: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: 'text-emerald-400' },
    violet: { value: 'text-violet-400', bg: 'bg-violet-500/10', icon: 'text-violet-400' },
    blue: { value: 'text-blue-400', bg: 'bg-blue-500/10', icon: 'text-blue-400' },
    yellow: { value: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: 'text-yellow-400' },
  }
  const c = colorMap[color]
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={cn('p-1.5 rounded-lg', c.bg)}>
          <Icon className={cn('w-4 h-4', c.icon)} />
        </div>
      </div>
      <div className={cn('text-2xl font-bold tracking-tight', c.value)}>{value}</div>
      <div className="flex items-center gap-1">
        {trend === 'up' ? (
          <ArrowUp className="w-3 h-3 text-emerald-400" />
        ) : trend === 'down' ? (
          <ArrowDown className="w-3 h-3 text-red-400" />
        ) : null}
        <span
          className={cn(
            'text-[11px] font-medium',
            trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500'
          )}
        >
          {trendLabel}
        </span>
      </div>
    </div>
  )
}

// ─── CEO View ─────────────────────────────────────────────────────────────────

function CeoView() {
  // Compute conversion rates between pipeline stages
  const conversionRates = PIPELINE_STAGES.slice(0, -1).map((stage, i) => {
    const next = PIPELINE_STAGES[i + 1]
    return Math.round((next.count / stage.count) * 100)
  })

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Content ROI"
          value="$4.20 / piece"
          trend="up"
          trendLabel="+12% vs last month"
          color="emerald"
          icon={DollarSign}
        />
        <KpiCard
          label="Revenue Attribution"
          value="$28,400"
          trend="up"
          trendLabel="+8% this month"
          color="violet"
          icon={TrendingUp}
        />
        <KpiCard
          label="Pipeline Velocity"
          value="3.2 days"
          trend="up"
          trendLabel="idea → publish"
          color="blue"
          icon={Zap}
        />
        <KpiCard
          label="Burn Rate"
          value="14 days left"
          trend="down"
          trendLabel="of quota remaining"
          color="yellow"
          icon={Clock}
        />
      </div>

      {/* Pipeline Health */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Pipeline Health</SectionHeader>
        <div className="flex items-end gap-0 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-0 min-w-0">
              <div className="flex flex-col items-center gap-2 min-w-[90px]">
                <div className="flex items-end justify-center h-20 w-full px-2">
                  <div
                    className={cn('w-full rounded-t-md transition-all', stage.color)}
                    style={{ height: `${Math.max(12, (stage.count / 42) * 80)}px` }}
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-zinc-100">{stage.count}</div>
                  <div className="text-[11px] text-zinc-500">{stage.label}</div>
                </div>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="flex flex-col items-center gap-1 px-1 mb-8">
                  <ArrowRight className="w-4 h-4 text-zinc-600" />
                  <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                    {conversionRates[i]}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Performance Waterfall */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Content Performance Waterfall</SectionHeader>
        <div className="space-y-3">
          {WATERFALL_DATA.map((item) => {
            const barPct = Math.max(1, Math.log10(item.value + 1) / Math.log10(2400001) * 100)
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-28 text-[12px] text-zinc-400 text-right shrink-0">{item.label}</div>
                <div className="flex-1 h-7 bg-zinc-800 rounded-md overflow-hidden">
                  <div
                    className={cn('h-full rounded-md flex items-center pl-2 transition-all', item.color)}
                    style={{ width: `${barPct}%` }}
                  >
                    <span className="text-[11px] font-semibold text-white/90 whitespace-nowrap">
                      {item.display}
                    </span>
                  </div>
                </div>
                <div className="w-12 text-[11px] text-zinc-500 text-right shrink-0">
                  {item.pct < 1 ? item.pct.toFixed(3) + '%' : item.pct + '%'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Best ROI Content Type */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Best ROI by Content Type</SectionHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Content Type
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                ROI / Piece
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Avg Views
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Cost / Piece
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {ROI_CONTENT.map((row, i) => (
              <tr key={row.type} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className="py-2.5 text-zinc-200 font-medium">{row.type}</td>
                <td className="py-2.5 text-right text-emerald-400 font-semibold">{row.roi}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.views}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.cost}</td>
                <td className="py-2.5 text-right">
                  {row.trend === 'up' ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-400">
                      <ArrowUp className="w-3 h-3" /> Up
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-red-400">
                      <ArrowDown className="w-3 h-3" /> Down
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── CRO View ─────────────────────────────────────────────────────────────────

function CroView() {
  return (
    <div className="space-y-8">
      {/* Hook Performance Matrix */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Hook Performance Matrix</SectionHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Hook Formula
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Avg CTR
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Avg Views
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Win Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {HOOK_MATRIX.map((row, i) => (
              <tr key={row.formula} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className="py-2.5 text-zinc-200 font-medium">{row.formula}</td>
                <td className="py-2.5 text-right text-blue-400 font-semibold">{row.ctr}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.views}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold',
                      parseInt(row.winRate) >= 65
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : parseInt(row.winRate) >= 55
                        ? 'bg-yellow-500/15 text-yellow-400'
                        : 'bg-zinc-700 text-zinc-400'
                    )}
                  >
                    {row.winRate}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Retention Cliff Map */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Retention Cliff Map</SectionHeader>
        <div className="flex items-end gap-4 h-32">
          {RETENTION_MAP.map((point) => {
            const barColor =
              point.pct >= 70
                ? 'bg-emerald-500'
                : point.pct >= 40
                ? 'bg-yellow-500'
                : 'bg-red-500'
            return (
              <div key={point.time} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-zinc-300">{point.pct}%</span>
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className={cn('w-full rounded-t-md', barColor)}
                    style={{ height: `${point.pct * 0.8}px` }}
                  />
                </div>
                <span className="text-[11px] text-zinc-500">{point.time}</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> &ge;70%
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> 40–69%
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> &lt;40%
          </span>
        </div>
      </div>

      {/* Split Test Results */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Split Test Results</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SPLIT_TESTS.map((test) => (
            <div
              key={test.id}
              className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-semibold text-zinc-200">{test.name}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold uppercase shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Done
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">Winner</span>
                  <span className="text-[12px] font-semibold text-zinc-200">{test.winner}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">{test.metric} Lift</span>
                  <span className="text-[12px] font-semibold text-emerald-400">{test.lift}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">Confidence</span>
                  <span
                    className={cn(
                      'text-[12px] font-semibold',
                      parseInt(test.confidence) >= 97 ? 'text-emerald-400' : 'text-yellow-400'
                    )}
                  >
                    {test.confidence}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing CTAs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Top Performing CTAs</SectionHeader>
        <div className="space-y-2">
          {TOP_CTAS.map((item, i) => (
            <div key={item.cta} className="flex items-center gap-3">
              <span className="w-5 text-[12px] font-bold text-zinc-600 text-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 text-[13px] text-zinc-300 font-medium">{item.cta}</div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${(parseFloat(item.clickRate) / 5) * 100}%` }}
                  />
                </div>
                <span className="text-[12px] font-semibold text-violet-400 w-10 text-right">
                  {item.clickRate}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Winning Patterns */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <SectionHeader>Weekly Winning Patterns — AI Insights</SectionHeader>
        </div>
        <ul className="space-y-3">
          {WEEKLY_PATTERNS.map((pattern, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
              <span className="text-[13px] text-zinc-300 leading-relaxed">{pattern}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── CTO View ─────────────────────────────────────────────────────────────────

function CtoView() {
  return (
    <div className="space-y-8">
      {/* API Health Grid */}
      <div>
        <SectionHeader>API Health Grid</SectionHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {API_HEALTH.map((api) => {
            const StatusIcon = api.status === 'healthy' ? CheckCircle2 : AlertCircle
            return (
              <div
                key={api.name}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-zinc-800">
                    <api.icon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <StatusIcon
                    className={cn(
                      'w-4 h-4',
                      api.status === 'healthy' ? 'text-emerald-400' : 'text-yellow-400'
                    )}
                  />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-zinc-200">{api.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        api.status === 'healthy' ? 'bg-emerald-400' : 'bg-yellow-400'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        api.status === 'healthy' ? 'text-emerald-400' : 'text-yellow-400'
                      )}
                    >
                      {api.status === 'healthy' ? 'Healthy' : 'Degraded'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Latency</span>
                    <span className="text-zinc-300 font-medium">{api.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Quota</span>
                    <span
                      className={cn(
                        'font-medium',
                        parseInt(api.quota) < 40 ? 'text-yellow-400' : 'text-zinc-300'
                      )}
                    >
                      {api.quota}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cost Ledger by Feature */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Cost Ledger by Feature</SectionHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Feature
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                This Month
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Per Use
              </th>
              <th className="text-right text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider">
                Total Uses
              </th>
            </tr>
          </thead>
          <tbody>
            {COST_LEDGER.map((row, i) => (
              <tr key={row.feature} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className="py-2.5 text-zinc-200 font-medium">{row.feature}</td>
                <td className="py-2.5 text-right text-violet-400 font-semibold">{row.monthCost}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.perUse}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.totalUses.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="bg-zinc-800/40">
              <td className="py-2.5 text-zinc-300 font-bold">Total</td>
              <td className="py-2.5 text-right text-violet-300 font-bold">$548.90</td>
              <td className="py-2.5 text-right text-zinc-500">—</td>
              <td className="py-2.5 text-right text-zinc-400 font-semibold">1,446</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Agent Run Log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Agent Run Log</SectionHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Agent', 'Status', 'Duration', 'Cost', 'Output'].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider',
                    h === 'Agent' ? 'text-left' : 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENT_LOG.map((run, i) => (
              <tr key={i} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className="py-2.5">
                  <span className="flex items-center gap-2 text-zinc-200 font-medium">
                    <Bot className="w-3.5 h-3.5 text-zinc-500" />
                    {run.agent}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  {run.status === 'success' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[11px] font-semibold">
                      <AlertCircle className="w-3 h-3" /> Error
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-right text-zinc-400">{run.duration}</td>
                <td className="py-2.5 text-right text-zinc-400">{run.cost}</td>
                <td className="py-2.5 text-right text-zinc-500 text-[12px]">{run.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Supabase Health */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-zinc-500" />
          <SectionHeader>Supabase Table Health</SectionHeader>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Table', 'Row Count', 'Size', 'Status'].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider',
                    h === 'Table' ? 'text-left' : 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUPABASE_HEALTH.map((row, i) => (
              <tr key={row.table} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className="py-2.5 font-mono text-[12px] text-zinc-300">{row.table}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.rows}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.size}</td>
                <td className="py-2.5 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Healthy
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error Rate by Integration */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Error Rate by Integration</SectionHeader>
        <div className="space-y-3">
          {ERROR_RATES.map((item) => {
            const barColor =
              item.rate < 1
                ? 'bg-emerald-500'
                : item.rate < 3
                ? 'bg-yellow-500'
                : 'bg-red-500'
            const textColor =
              item.rate < 1
                ? 'text-emerald-400'
                : item.rate < 3
                ? 'text-yellow-400'
                : 'text-red-400'
            return (
              <div key={item.integration} className="flex items-center gap-3">
                <div className="w-24 text-[12px] text-zinc-400 shrink-0">{item.integration}</div>
                <div className="flex-1 h-5 bg-zinc-800 rounded-md overflow-hidden">
                  <div
                    className={cn('h-full rounded-md', barColor)}
                    style={{ width: `${Math.min(100, item.rate * 10)}%` }}
                  />
                </div>
                <div className={cn('w-10 text-right text-[12px] font-semibold shrink-0', textColor)}>
                  {item.display}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> &lt;1% Normal
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> 1–3% Warning
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> &gt;3% Critical
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── CMO View ─────────────────────────────────────────────────────────────────

function CmoView() {
  const maxSubs = Math.max(...AUDIENCE_GROWTH.map((d) => d.subs))

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Reach"
          value="4.82M"
          trend="up"
          trendLabel="+18% vs last month"
          color="violet"
          icon={Globe}
        />
        <KpiCard
          label="Avg CTR"
          value="11.4%"
          trend="up"
          trendLabel="+2.1pts this month"
          color="blue"
          icon={TrendingUp}
        />
        <KpiCard
          label="Content Published"
          value="96 pieces"
          trend="up"
          trendLabel="across 3 platforms"
          color="emerald"
          icon={BarChart3}
        />
        <KpiCard
          label="Platform Coverage"
          value="3 platforms"
          trend="neutral"
          trendLabel="YT · TikTok · IG"
          color="yellow"
          icon={Zap}
        />
      </div>

      {/* Platform Performance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Platform Performance</SectionHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Platform', 'Subscribers', 'Monthly Reach', 'Avg CTR', 'Post Freq', 'Growth'].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider',
                    h === 'Platform' ? 'text-left' : 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLATFORM_PERFORMANCE.map((row, i) => (
              <tr key={row.platform} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className={cn('py-2.5 font-semibold', row.color)}>{row.platform}</td>
                <td className="py-2.5 text-right text-zinc-300">{row.subscribers}</td>
                <td className="py-2.5 text-right text-zinc-300">{row.reach}</td>
                <td className="py-2.5 text-right text-blue-400 font-semibold">{row.avgCTR}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.postFreq}</td>
                <td className="py-2.5 text-right">
                  <span className="text-emerald-400 font-semibold">{row.growth}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Content Format Performance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Content Format Performance</SectionHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Format', 'Total Views', 'Avg CTR', 'Avg Retention', 'Conv. Rate', 'Trend'].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider',
                    h === 'Format' ? 'text-left' : 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONTENT_FORMAT_PERF.map((row, i) => (
              <tr key={row.format} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className="py-2.5 text-zinc-200 font-medium">{row.format}</td>
                <td className="py-2.5 text-right text-zinc-300">{row.views}</td>
                <td className="py-2.5 text-right text-blue-400 font-semibold">{row.ctr}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.retention}</td>
                <td className="py-2.5 text-right text-violet-400 font-semibold">{row.convRate}</td>
                <td className="py-2.5 text-right">
                  {row.trend === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-emerald-400 inline-block" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-400 inline-block" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audience Growth + Publishing Cadence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audience Growth Bar Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <SectionHeader>Subscriber Growth (6 Months)</SectionHeader>
          <div className="flex items-end gap-3 h-32 mt-2">
            {AUDIENCE_GROWTH.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                  <div
                    className="w-full rounded-t-md bg-violet-500 transition-all"
                    style={{ height: `${Math.round((d.subs / maxSubs) * 96)}px` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500">{d.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
            <span>Start: 28.4K</span>
            <span className="text-emerald-400 font-semibold">Now: 48.2K (+70%)</span>
          </div>
        </div>

        {/* Publishing Cadence */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <SectionHeader>Weekly Publishing Cadence</SectionHeader>
          <div className="space-y-3 mt-2">
            {PUBLISH_CADENCE.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <div className="w-8 text-[12px] text-zinc-500 shrink-0">{d.day}</div>
                <div className="flex-1 h-5 bg-zinc-800 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md bg-cyan-500"
                    style={{ width: `${(d.count / 3) * 100}%` }}
                  />
                </div>
                <div className="w-4 text-[12px] text-zinc-400 text-right shrink-0">{d.count}</div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-zinc-600 mt-3">Total: 12 posts/wk avg across all platforms</div>
        </div>
      </div>

      {/* Top Thumbnail Styles */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Top Thumbnail Styles by CTR</SectionHeader>
        <div className="space-y-4">
          {TOP_THUMBNAIL_STYLES.map((item) => {
            const ctrNum = parseFloat(item.ctr)
            return (
              <div key={item.style} className="flex items-center gap-4">
                <div className="w-44 text-[12px] text-zinc-300 font-medium shrink-0">{item.style}</div>
                <div className="flex-1 h-6 bg-zinc-800 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-violet-600 to-blue-500 flex items-center pl-2"
                    style={{ width: `${(ctrNum / 18.4) * 100}%` }}
                  >
                    <span className="text-[11px] font-semibold text-white/90 whitespace-nowrap">{item.ctr}</span>
                  </div>
                </div>
                <div className="w-16 text-right shrink-0">
                  <span className="text-[11px] font-semibold text-emerald-400">{item.lift}</span>
                </div>
                <div className="w-14 text-[11px] text-zinc-500 text-right shrink-0">{item.impressions}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── SALES View ───────────────────────────────────────────────────────────────

function SalesView() {
  const maxRevenue = Math.max(...MONTHLY_REVENUE.map((d) => d.value))

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue Attributed"
          value="$236,200"
          trend="up"
          trendLabel="+19% vs last month"
          color="emerald"
          icon={DollarSign}
        />
        <KpiCard
          label="Leads Generated"
          value="542"
          trend="up"
          trendLabel="from content this month"
          color="blue"
          icon={TrendingUp}
        />
        <KpiCard
          label="Close Rate"
          value="13.1%"
          trend="up"
          trendLabel="+2.4pts vs prior month"
          color="violet"
          icon={Zap}
        />
        <KpiCard
          label="Revenue / Video"
          value="$2,460"
          trend="up"
          trendLabel="avg across published"
          color="yellow"
          icon={BarChart3}
        />
      </div>

      {/* Revenue Attribution by Source */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Revenue Attribution by Content Source</SectionHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Source', 'Leads', 'Deals Closed', 'ARR', 'Avg Deal Size', 'Trend'].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider',
                    h === 'Source' ? 'text-left' : 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REVENUE_ATTRIBUTION.map((row, i) => (
              <tr key={row.source} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className="py-2.5 text-zinc-200 font-medium">{row.source}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.leads}</td>
                <td className="py-2.5 text-right text-zinc-300 font-semibold">{row.deals}</td>
                <td className="py-2.5 text-right text-emerald-400 font-semibold">{row.arr}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.avgDeal}</td>
                <td className="py-2.5 text-right">
                  {row.trend === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-emerald-400 inline-block" />
                  ) : (
                    <span className="text-zinc-600 text-[12px]">—</span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-zinc-800/40">
              <td className="py-2.5 text-zinc-300 font-bold">Total</td>
              <td className="py-2.5 text-right text-zinc-300 font-bold">542</td>
              <td className="py-2.5 text-right text-zinc-100 font-bold">71</td>
              <td className="py-2.5 text-right text-emerald-300 font-bold">$236,200</td>
              <td className="py-2.5 text-right text-zinc-400 font-semibold">$3,327</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Monthly Revenue Trend + Lead Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <SectionHeader>Monthly Revenue from Content (6mo)</SectionHeader>
          <div className="flex items-end gap-3 mt-2" style={{ height: '120px' }}>
            {MONTHLY_REVENUE.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                  <div
                    className="w-full rounded-t-md bg-emerald-500 transition-all"
                    style={{ height: `${Math.round((d.value / maxRevenue) * 96)}px` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500">{d.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
            <span>Oct: $38K</span>
            <span className="text-emerald-400 font-semibold">Mar: $91K (+139%)</span>
          </div>
        </div>

        {/* Lead Funnel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <SectionHeader>Content-to-Close Lead Funnel</SectionHeader>
          <div className="space-y-2 mt-2">
            {LEAD_FUNNEL.map((stage, i) => {
              const widthPct = Math.max(8, 100 - i * 14)
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-28 text-[11px] text-zinc-400 shrink-0 text-right">{stage.stage}</div>
                  <div className="flex-1 h-6 bg-zinc-800 rounded-md overflow-hidden flex items-center">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center pl-2 transition-all"
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-[11px] font-semibold text-white/90 whitespace-nowrap">
                        {stage.display}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Converting Videos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <SectionHeader>Top Converting Videos</SectionHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Title', 'Platform', 'Views', 'Leads', 'Conv. Rate', 'Revenue'].map((h) => (
                <th
                  key={h}
                  className={cn(
                    'text-[11px] font-semibold text-zinc-500 pb-2 uppercase tracking-wider',
                    h === 'Title' ? 'text-left' : 'text-right'
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOP_CONVERTING_VIDEOS.map((row, i) => (
              <tr key={i} className={cn('border-b border-zinc-800/50', i % 2 === 0 ? '' : 'bg-zinc-800/20')}>
                <td className="py-2.5 text-zinc-200 font-medium max-w-xs truncate">{row.title}</td>
                <td className="py-2.5 text-right text-zinc-500 text-[12px]">{row.platform}</td>
                <td className="py-2.5 text-right text-zinc-400">{row.views}</td>
                <td className="py-2.5 text-right text-blue-400 font-semibold">{row.leads}</td>
                <td className="py-2.5 text-right text-violet-400 font-semibold">{row.convRate}</td>
                <td className="py-2.5 text-right text-emerald-400 font-bold">{row.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hook-to-Conversion Leaderboard */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <SectionHeader>Hook-to-Conversion Leaderboard</SectionHeader>
        </div>
        <div className="space-y-3">
          {HOOK_CONVERSIONS.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 text-[12px] font-bold text-zinc-600 shrink-0">#{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-zinc-300 font-medium italic truncate">{item.hook}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-zinc-500">{item.bookings} bookings</span>
                <span className="text-[12px] font-bold text-emerald-400 w-10 text-right">{item.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CeoDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ceo')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'ceo', label: 'CEO View' },
    { id: 'cro', label: 'CRO View' },
    { id: 'cto', label: 'CTO View' },
    { id: 'cmo', label: 'CMO View' },
    { id: 'sales', label: 'Sales View' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shrink-0">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Executive Dashboard</h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">CEO · CRO · CTO · CMO · Sales intelligence in one view.</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'ceo' && <CeoView />}
          {activeTab === 'cro' && <CroView />}
          {activeTab === 'cto' && <CtoView />}
          {activeTab === 'cmo' && <CmoView />}
          {activeTab === 'sales' && <SalesView />}
        </div>
      </div>
    </div>
  )
}
