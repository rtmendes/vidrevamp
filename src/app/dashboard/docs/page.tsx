'use client';

import { useState } from 'react';
import {
  BookOpen, Database, Brain, CheckCircle2,
  Clock, DollarSign, BarChart3,
  TrendingUp, ChevronRight,
  Circle, ArrowRight, Shield, Server, GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Data ──────────────────────────────────────────────────────────────────────

const TECH_STACK = [
  { category: 'Frontend', items: [
    { name: 'Next.js 14', detail: 'App Router, Server Components, Server Actions', status: 'live' },
    { name: 'React 18', detail: 'Client components, hooks, state management', status: 'live' },
    { name: 'TypeScript', detail: 'Strict mode, full type coverage', status: 'live' },
    { name: 'Tailwind CSS', detail: 'Dark theme design system, custom utilities', status: 'live' },
    { name: 'Zustand', detail: 'Client state (legacy mode, app preferences)', status: 'live' },
    { name: 'Lucide React', detail: 'Icon library — 300+ icons used', status: 'live' },
  ]},
  { category: 'Backend & Database', items: [
    { name: 'Supabase (Self-hosted)', detail: 'supabase.insightprofit.live — PostgreSQL + Auth + Storage', status: 'live' },
    { name: 'Next.js Server Actions', detail: "'use server' — all API calls run server-side", status: 'live' },
    { name: 'Supabase Auth', detail: 'Magic link + JWT session management', status: 'live' },
    { name: 'PostgreSQL', detail: '7 tables: channels, videos, vault, projects, usage_events, brands, scripts', status: 'live' },
    { name: 'Row-Level Security', detail: 'Per-user data isolation via Supabase RLS policies', status: 'live' },
  ]},
  { category: 'AI & Machine Learning', items: [
    { name: 'OpenAI GPT-4o', detail: 'Primary model: scripts, blueprints, storyboards, split tests', status: 'live' },
    { name: 'OpenAI GPT-4o Mini', detail: 'Cost-optimized: hook scoring, daily briefs, translations', status: 'live' },
    { name: 'OpenAI DALL-E 3', detail: 'Storyboard frame images, thumbnail generation', status: 'live' },
    { name: 'OpenRouter', detail: 'Multi-LLM gateway: Claude, Gemini, Llama, Mistral via same API', status: 'live' },
    { name: 'Claude Sonnet 4.5', detail: 'Via OpenRouter — long-form scripts, nuanced writing', status: 'live' },
    { name: 'Gemini Flash 1.5', detail: 'Via OpenRouter — cheapest capable model, bulk processing', status: 'live' },
  ]},
  { category: 'Third-Party APIs', items: [
    { name: 'YouTube Data API v3', detail: 'Channel search, video stats, outlier scoring — 10K units/day', status: 'live' },
    { name: 'HeyGen API v2', detail: 'Avatar listing, voice listing, video generation, status polling', status: 'live' },
    { name: 'Apify', detail: 'Web scraping — TikTok trends, competitor content (configured)', status: 'configured' },
  ]},
  { category: 'Infrastructure', items: [
    { name: 'Vercel', detail: 'Edge deployment — sandcastles-clone.vercel.app', status: 'live' },
    { name: 'Edge Middleware', detail: 'Auth gate — all /dashboard/* routes require session', status: 'live' },
    { name: 'Environment Variables', detail: '9 keys configured on Vercel + .env.local', status: 'live' },
  ]},
];

const LIVE_FEATURES = [
  {
    category: 'RESEARCH',
    color: 'from-emerald-500 to-teal-600',
    features: [
      { name: 'Channel Tracker', href: '/dashboard/channels', status: 'live', desc: 'Track competitor channels, view subscriber stats, add to watchlist' },
      { name: 'Video Library', href: '/dashboard/videos', status: 'live', desc: 'Full video database with outlier scoring, filtering, sort' },
      { name: 'YouTube Live Research', href: '/dashboard/research', status: 'live', desc: 'Real-time YouTube API search by keyword or channel — live outlier scores' },
      { name: 'Ad Intelligence', href: '/dashboard/ads', status: 'live', desc: 'Competitor ad analysis, creative research, UGC ad patterns' },
    ],
  },
  {
    category: 'CREATE',
    color: 'from-violet-500 to-indigo-600',
    features: [
      { name: 'UGC Studio + HeyGen', href: '/dashboard/studio', status: 'live', desc: 'AI UGC personas + HeyGen real video generation with status polling' },
      { name: 'Hook Lab', href: '/dashboard/hook-lab', status: 'live', desc: 'AI hook generation, scoring, vault saving with model selection' },
      { name: 'Script Engine (Multi-Modal)', href: '/dashboard/script', status: 'live', desc: 'Full blueprint generation: hook, script, edit instructions, B-roll, text overlays' },
      { name: 'Script Fixer & Translator', href: '/dashboard/script', status: 'live', desc: 'Iterative AI editing + translate to any language with cultural adaptation' },
      { name: 'Vision Analysis (GPT-4o)', href: '/dashboard/script', status: 'live', desc: 'Analyze viral video screenshots for pacing, B-roll, camera framing, color grade' },
      { name: 'Model Selector', href: '/dashboard/script', status: 'live', desc: '8 models across 5 providers — GPT-4o, Claude, Gemini, Llama, Mistral' },
      { name: 'Storyboard Builder', href: '/dashboard/storyboard', status: 'live', desc: 'Frame-by-frame visual planning with shot types, camera motion, DALL-E image gen' },
      { name: 'Thumbnail Generator', href: '/dashboard/thumbnail', status: 'live', desc: 'AI thumbnail variants — platform formats, brand colors, proven visual formulas' },
      { name: 'Split Testing Engine', href: '/dashboard/split-test', status: 'live', desc: 'A/B/C/D hook variants with 5-dimension scoring and winner prediction' },
    ],
  },
  {
    category: 'MANAGE',
    color: 'from-blue-500 to-cyan-600',
    features: [
      { name: 'Brand OS', href: '/dashboard/brands', status: 'live', desc: 'Multi-brand profiles, voice settings, color systems, persona management' },
      { name: 'Content Vault', href: '/dashboard/vault', status: 'live', desc: 'Save hooks, scripts, frameworks — RAG context for AI generation' },
      { name: 'Projects Kanban', href: '/dashboard/projects', status: 'live', desc: 'Drag-and-drop Kanban (Ideation→Production→Review→Live) + Grid view' },
      { name: 'Automation Engine', href: '/dashboard/automations', status: 'live', desc: 'Visual workflow builder for scheduled agentic content operations' },
    ],
  },
  {
    category: 'INTELLIGENCE',
    color: 'from-pink-500 to-rose-600',
    features: [
      { name: 'CEO/CRO/CTO Dashboard', href: '/dashboard/ceo', status: 'live', desc: 'Executive KPIs, pipeline health, retention analysis, API health, cost ledger' },
      { name: 'Analytics', href: '/dashboard/analytics', status: 'live', desc: 'Content performance, channel trends, outlier tracking over time' },
      { name: 'YouTube Analytics', href: '/dashboard/yt-analytics', status: 'live', desc: 'Own channel: impressions, CTR funnel, retention curves, demographics, geo' },
      { name: 'Outlier Predict (ML)', href: '/dashboard/outlier-ml', status: 'live', desc: 'XGBoost model trained on internal data — predicts outlier probability from early signals' },
      { name: 'Intelligence Reports', href: '/dashboard/reports', status: 'live', desc: 'AI weekly report: insights, winning patterns, next-week briefs, cost analysis, email delivery' },
      { name: 'Operations Center', href: '/dashboard/ops', status: 'live', desc: 'Usage event log, API cost tracking, quota monitoring, system health' },
    ],
  },
];

const API_COSTS = [
  { api: 'OpenAI GPT-4o', cost: '$5.00 / 1M input · $15.00 / 1M output', useCase: 'Scripts, blueprints, storyboards' },
  { api: 'OpenAI GPT-4o Mini', cost: '$0.15 / 1M input · $0.60 / 1M output', useCase: 'Hook scoring, translations, daily briefs' },
  { api: 'DALL-E 3 Standard', cost: '$0.04 / image (1024px) · $0.08 / image (HD)', useCase: 'Storyboard frames, thumbnails' },
  { api: 'Claude Sonnet 4.5 (OpenRouter)', cost: '$3.00 / 1M input · $15.00 / 1M output', useCase: 'Long-form scripts, nuanced writing' },
  { api: 'Gemini Flash 1.5 (OpenRouter)', cost: '$0.075 / 1M input · $0.30 / 1M output', useCase: 'Bulk generation, cheap processing' },
  { api: 'YouTube Data API v3', cost: 'Free: 10,000 units/day (search=100, rest=1)', useCase: 'Channel/video research, outlier scoring' },
  { api: 'HeyGen API v2', cost: 'Credit-based (1 credit ≈ 1 min video)', useCase: 'UGC avatar video generation' },
  { api: 'Apify', cost: 'Pay-per-compute-unit (configurable)', useCase: 'TikTok trends, web scraping' },
];

const DATA_FLOW = [
  { step: '1', label: 'Research', desc: 'YouTube API pulls channel/video data → outlier score calculated → stored in Supabase videos table', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { step: '2', label: 'Brief', desc: 'Outlier pattern detected → AI generates content brief → saved to projects table as "Ideation" card', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { step: '3', label: 'Script', desc: 'Brief → Script Engine → GPT-4o generates multi-modal blueprint → Vault item saved for RAG context', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { step: '4', label: 'Split Test', desc: 'Script hook → 4 variants generated → AI scored on 5 dimensions → winner selected', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { step: '5', label: 'Storyboard', desc: 'Script → frame-by-frame storyboard → DALL-E generates reference images → PDF production brief', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  { step: '6', label: 'Video', desc: 'HeyGen API → avatar + voice selected → script sent → video generated → status polled → URL returned', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { step: '7', label: 'Track', desc: 'All AI usage logged to usage_events table → cost tracked → Operations dashboard shows real-time spend', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
];

const DB_TABLES = [
  { name: 'channels', cols: 'id, channel_id, title, subscriber_count, avg_views, platform, user_id, created_at', purpose: 'Tracked competitor channels' },
  { name: 'videos', cols: 'id, video_id, channel_id, title, view_count, like_count, outlier_score, duration, published_at, thumbnail', purpose: 'Video library with outlier scores' },
  { name: 'vault', cols: 'id, type, content, title, tags, brand_id, user_id, created_at', purpose: 'Saved hooks, scripts, frameworks for RAG' },
  { name: 'projects', cols: 'id, title, status, priority, niche, platform, performance, user_id, created_at', purpose: 'Kanban project management' },
  { name: 'usage_events', cols: 'id, integration, use_case, model, input_tokens, output_tokens, cost_usd, duration_ms, status, user_id, created_at', purpose: 'Full AI usage & cost tracking' },
  { name: 'brands', cols: 'id, name, niche, tone, colors, logo_url, user_id, created_at', purpose: 'Multi-brand profile management' },
  { name: 'scripts', cols: 'id, title, hook, script, edit_instructions, brand_id, user_id, created_at', purpose: 'Saved script blueprints' },
];

const ENV_VARS = [
  { key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'https://supabase.insightprofit.live', scope: 'Public' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: 'eyJ... (anon JWT)', scope: 'Public' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', value: 'eyJ... (service role JWT)', scope: 'Server' },
  { key: 'SUPABASE_JWT_SECRET', value: 'kmuZ... (signing secret)', scope: 'Server' },
  { key: 'OPENAI_API_KEY', value: 'sk-proj-wbdBt...', scope: 'Server' },
  { key: 'OPENROUTER_API_KEY', value: 'sk-or-v1-6ea...', scope: 'Server' },
  { key: 'HEYGEN_API_KEY', value: 'sk_V2_hgu_kE8...', scope: 'Server' },
  { key: 'YOUTUBE_API_KEY', value: 'AIzaSyCu8re...', scope: 'Server' },
  { key: 'APIFY_API_TOKEN', value: 'MotpMsZwMC...', scope: 'Server' },
];

type TabId = 'overview' | 'features' | 'tech' | 'data' | 'apis' | 'env' | 'roadmap';

const TABS: { id: TabId; label: string; icon: React.FC<{className?: string}> }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'features', label: 'Live Features', icon: CheckCircle2 },
  { id: 'tech', label: 'Tech Stack', icon: Server },
  { id: 'data', label: 'Data Flow & DB', icon: Database },
  { id: 'apis', label: 'API Costs', icon: DollarSign },
  { id: 'env', label: 'Environment', icon: Shield },
  { id: 'roadmap', label: 'Roadmap', icon: GitBranch },
];

const ROADMAP = [
  { phase: 'Phase 1 — Foundation', status: 'complete', items: [
    'Next.js 14 App Router + Supabase Auth',
    'YouTube API integration with outlier scoring',
    'Script Engine (multi-modal blueprint generation)',
    'HeyGen UGC video generation with polling',
    'OpenRouter multi-LLM model selection',
    'Kanban projects board (HTML5 DnD)',
    'Operations dashboard with usage tracking',
    'Vercel deployment + custom domain',
  ]},
  { phase: 'Phase 2 — Intelligence Layer', status: 'complete', items: [
    'Split Testing Engine (A/B/C/D hook variants)',
    'Storyboard Builder with DALL-E frame images',
    'Thumbnail Generator (brand-aware)',
    'CEO/CRO/CTO Executive Dashboard',
    'Weekly AI Intelligence Reports',
    'Automation Engine (visual workflow builder)',
    'Research page live YouTube search',
    'Sectioned sidebar navigation',
  ]},
  { phase: 'Phase 3 — Agentic Workflows', status: 'complete', items: [
    'Real cron-based automation execution (Supabase pg_cron) ✓',
    'YouTube Analytics API integration (retention, CTR, impressions, demographics) ✓',
    'Email delivery for weekly reports (Resend/SendGrid UI + auto-send schedule) ✓',
    'Statistical significance tracking for live A/B tests (two-proportion z-test) ✓',
    'TikTok trend monitoring via Apify actors (sounds, hashtags, viral videos) ✓',
    'Stripe billing integration (Pro Plan) — deferred to Phase 4',
    'Supabase SMTP for magic link auth — infrastructure config',
    'Cloudflare DNS + SSL — infrastructure config',
  ]},
  { phase: 'Phase 4 — Scale', status: 'next', items: [
    'Predictive outlier modeling — ML model trained on internal data ✓ (live)',
    'Multi-user team collaboration (RLS per org)',
    'API marketplace (sell hooks/scripts to other creators)',
    'White-label mode for agencies',
    'Mobile app (React Native)',
    'Direct platform publishing (TikTok API, YouTube API upload)',
    'Stripe Pro Plan billing integration',
    'Zapier / Make.com integration',
  ]},
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const totalFeatures = LIVE_FEATURES.reduce((s, c) => s + c.features.length, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-500 to-zinc-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">PRD & Live Documentation</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">
            Product Requirements Document · Tech Stack · Data Architecture · API Reference · Roadmap
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
          <span>Last updated: March 2026</span>
          <span className="text-zinc-700">·</span>
          <span className="text-emerald-400 font-semibold">{totalFeatures} features live</span>
        </div>
      </div>

      {/* Quick stat bar */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Live Features', value: totalFeatures.toString(), color: 'text-emerald-400' },
          { label: 'API Integrations', value: '8', color: 'text-blue-400' },
          { label: 'AI Models', value: '8', color: 'text-violet-400' },
          { label: 'DB Tables', value: '7', color: 'text-yellow-400' },
          { label: 'Pages', value: '20+', color: 'text-pink-400' },
          { label: 'Deployment', value: 'Vercel', color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 text-center">
            <p className={cn('text-[20px] font-bold', s.color)}>{s.value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all',
              activeTab === tab.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-6">
            <h2 className="text-[16px] font-bold text-zinc-100 mb-3">Product Overview</h2>
            <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">
              <strong className="text-zinc-200">VidRevamp</strong> is a full-stack AI-powered viral content intelligence platform for short-form video creators, agencies, and brands. It combines YouTube outlier research, AI script generation, split testing, storyboarding, UGC video production, and executive analytics into one unified workflow.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, title: 'Research & Intelligence', desc: 'Find what\'s working before you create. YouTube outlier scoring, competitor tracking, trend monitoring, ad intelligence.' },
                { icon: Brain, title: 'AI Content Creation', desc: 'Full pipeline from hook to storyboard. 8 AI models, split testing, vision analysis, HeyGen UGC video generation.' },
                { icon: BarChart3, title: 'Tracking & Optimization', desc: 'CEO/CRO/CTO dashboards. API cost ledger, pipeline velocity, retention analysis, weekly AI reports.' },
              ].map(item => (
                <div key={item.title} className="bg-zinc-800/40 rounded-xl p-4">
                  <item.icon className="w-5 h-5 text-violet-400 mb-2" />
                  <h3 className="text-[13px] font-semibold text-zinc-200 mb-1">{item.title}</h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Core user flow */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-6">
            <h2 className="text-[13px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Core Workflow</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {['Find Outlier', 'Generate Brief', 'Write Script', 'Split Test Hooks', 'Build Storyboard', 'Generate Video', 'Track Performance'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                    <span className="w-4 h-4 rounded-full bg-violet-600 text-[9px] font-black text-white flex items-center justify-center">{i + 1}</span>
                    <span className="text-[11px] font-medium text-zinc-300">{step}</span>
                  </div>
                  {i < 6 && <ArrowRight className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE FEATURES TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {LIVE_FEATURES.map(section => (
            <div key={section.category}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('w-2 h-2 rounded-full bg-gradient-to-r', section.color)} />
                <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{section.category}</h2>
                <span className="text-[10px] text-zinc-700">{section.features.length} features</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {section.features.map(f => (
                  <div key={f.name} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-[13px] font-semibold text-zinc-200">{f.name}</h3>
                      <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border flex-shrink-0',
                        f.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      )}>
                        {f.status === 'live' ? 'LIVE' : 'BETA'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{f.desc}</p>
                    <a href={f.href} className="text-[10px] text-violet-400 hover:text-violet-300 mt-2 flex items-center gap-1 transition-colors">
                      <ChevronRight className="w-2.5 h-2.5" />{f.href}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TECH STACK TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'tech' && (
        <div className="space-y-5">
          {TECH_STACK.map(section => (
            <div key={section.category} className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-800/60 bg-zinc-950/40">
                <h2 className="text-[12px] font-semibold text-zinc-300">{section.category}</h2>
              </div>
              <div className="divide-y divide-zinc-800/40">
                {section.items.map(item => (
                  <div key={item.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/20 transition-colors">
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-200">{item.name}</p>
                      <p className="text-[11px] text-zinc-500">{item.detail}</p>
                    </div>
                    <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border',
                      item.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      item.status === 'configured' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    )}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DATA FLOW & DB TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Pipeline */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
            <h2 className="text-[13px] font-semibold text-zinc-500 uppercase tracking-wider mb-4">Content Production Pipeline</h2>
            <div className="space-y-3">
              {DATA_FLOW.map((step, i) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-black flex-shrink-0', step.bg, step.color)}>
                      {step.step}
                    </div>
                    {i < DATA_FLOW.length - 1 && <div className="w-0.5 h-4 bg-zinc-800 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className={cn('text-[13px] font-semibold mb-0.5', step.color)}>{step.label}</p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DB Tables */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800/60 bg-zinc-950/40 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              <h2 className="text-[12px] font-semibold text-zinc-300">Supabase PostgreSQL Schema</h2>
              <span className="text-[10px] text-zinc-600 ml-auto">supabase.insightprofit.live</span>
            </div>
            <div className="divide-y divide-zinc-800/40">
              {DB_TABLES.map(table => (
                <div key={table.name} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-bold text-violet-400 font-mono">{table.name}</span>
                    <span className="text-[10px] text-zinc-600">{table.purpose}</span>
                  </div>
                  <p className="text-[10px] text-zinc-700 font-mono leading-relaxed">{table.cols}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── API COSTS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'apis' && (
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800/60 bg-zinc-950/40">
            <h2 className="text-[12px] font-semibold text-zinc-300">API Cost Reference</h2>
            <p className="text-[10px] text-zinc-600">As of March 2026 — prices may change. Monitor actual spend in Operations.</p>
          </div>
          <div className="divide-y divide-zinc-800/40">
            <div className="grid grid-cols-3 gap-4 px-5 py-2.5 bg-zinc-950/40">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase">API / Model</span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase">Pricing</span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase">Use Case in VidRevamp</span>
            </div>
            {API_COSTS.map(row => (
              <div key={row.api} className="grid grid-cols-3 gap-4 px-5 py-3.5 hover:bg-zinc-800/20 transition-colors">
                <span className="text-[12px] font-semibold text-zinc-200">{row.api}</span>
                <span className="text-[11px] text-emerald-400 font-mono">{row.cost}</span>
                <span className="text-[11px] text-zinc-500">{row.useCase}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ENV VARS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'env' && (
        <div className="space-y-4">
          <div className="bg-yellow-950/30 border border-yellow-800/30 rounded-xl p-4 flex gap-3">
            <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-yellow-300 leading-relaxed">
              All server-side keys are stored as Vercel environment variables and never exposed to the client. Public keys (NEXT_PUBLIC_*) are safe to expose. Rotate keys immediately if compromised.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_80px] gap-4 px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/60">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase">Variable</span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase">Value (redacted)</span>
              <span className="text-[10px] font-semibold text-zinc-500 uppercase">Scope</span>
            </div>
            <div className="divide-y divide-zinc-800/40">
              {ENV_VARS.map(v => (
                <div key={v.key} className="grid grid-cols-[1fr_1fr_80px] gap-4 px-5 py-3.5 hover:bg-zinc-800/20 transition-colors">
                  <span className="text-[11px] font-mono text-violet-400">{v.key}</span>
                  <span className="text-[11px] font-mono text-zinc-500 truncate">{v.value}</span>
                  <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border self-center w-fit',
                    v.scope === 'Public' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30'
                  )}>
                    {v.scope.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
            <h3 className="text-[12px] font-semibold text-zinc-300 mb-2">Deployment Locations</h3>
            <div className="space-y-1.5 text-[11px] text-zinc-500">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> All 9 keys set in Vercel project environment variables</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> All 9 keys set in local .env.local for development</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Production: sandcastles-clone.vercel.app</div>
              <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-yellow-400" /> Cloudflare DNS records pending (manual step — see Roadmap)</div>
            </div>
          </div>
        </div>
      )}

      {/* ── ROADMAP TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          {ROADMAP.map(phase => (
            <div key={phase.phase} className={cn('bg-zinc-900 border rounded-xl overflow-hidden',
              phase.status === 'complete' ? 'border-emerald-800/40' :
              phase.status === 'next' ? 'border-violet-800/40' : 'border-zinc-800/60'
            )}>
              <div className={cn('flex items-center gap-3 px-5 py-3.5 border-b',
                phase.status === 'complete' ? 'bg-emerald-950/30 border-emerald-800/30' :
                phase.status === 'next' ? 'bg-violet-950/30 border-violet-800/30' : 'border-zinc-800/60 bg-zinc-950/30'
              )}>
                <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border',
                  phase.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  phase.status === 'next' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' :
                  'bg-zinc-700/50 text-zinc-500 border-zinc-600/30'
                )}>
                  {phase.status === 'complete' ? 'COMPLETE' : phase.status === 'next' ? 'IN PROGRESS' : 'FUTURE'}
                </span>
                <h2 className="text-[13px] font-bold text-zinc-200">{phase.phase}</h2>
                <span className="text-[10px] text-zinc-600 ml-auto">{phase.items.length} items</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                {phase.items.map(item => (
                  <div key={item} className="flex items-center gap-2">
                    {phase.status === 'complete'
                      ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      : phase.status === 'next'
                      ? <Clock className="w-3 h-3 text-violet-400 flex-shrink-0" />
                      : <Circle className="w-3 h-3 text-zinc-700 flex-shrink-0" />
                    }
                    <span className="text-[11px] text-zinc-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
