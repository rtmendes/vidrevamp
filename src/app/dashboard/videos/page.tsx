'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import {
  TrendingUp,
  Eye,
  ThumbsUp,
  Zap,
  Play,
  Search,
  MessageSquare,
  Globe,
  MapPin,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import { getVideoInsights } from '@/actions/videos';
import { useAppStore } from '@/store/useAppStore';
import type { VideoInsight } from '@/types';
import { VideoDetailModal } from '@/components/modals/VideoDetailModal';
import { cn, formatNumber } from '@/lib/utils';

// ── KOPI Sort Options ────────────────────────────────────────────────────────
// K = Keep Rate   — comment depth (comments/views per 1K) — signals deep engagement
// O = Outlier     — views vs channel average
// P = Performance — views per day since publish (velocity)
// I = Impact      — engagement rate: (likes+comments)/views %

const SORT_GROUPS = [
  {
    group: 'KOPI Metrics',
    options: [
      { value: 'outlier',  label: 'Outlier Score (O)' },
      { value: 'impact',   label: 'Impact Rate (I) %' },
      { value: 'velocity', label: 'Views Velocity (P)' },
      { value: 'keep',     label: 'Keep / Comment Rate (K)' },
    ],
  },
  {
    group: 'Raw Numbers',
    options: [
      { value: 'views',    label: 'Total Views' },
      { value: 'likes',    label: 'Likes' },
      { value: 'comments', label: 'Comments' },
    ],
  },
  {
    group: 'Date',
    options: [
      { value: 'recent', label: 'Most Recent' },
      { value: 'oldest', label: 'Oldest First' },
    ],
  },
  {
    group: 'Alphabetical',
    options: [
      { value: 'az', label: 'Title A → Z' },
      { value: 'za', label: 'Title Z → A' },
    ],
  },
];

type SortValue = 'outlier' | 'impact' | 'velocity' | 'keep' | 'views' | 'likes' | 'comments' | 'recent' | 'oldest' | 'az' | 'za';

const PLATFORM_FILTERS = ['All', 'YOUTUBE', 'TIKTOK', 'INSTAGRAM'] as const;
type PlatformFilter = typeof PLATFORM_FILTERS[number];

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All Languages' },
  { value: 'en',  label: '🇺🇸 English' },
  { value: 'es',  label: '🇪🇸 Spanish' },
  { value: 'fr',  label: '🇫🇷 French' },
  { value: 'de',  label: '🇩🇪 German' },
  { value: 'pt',  label: '🇧🇷 Portuguese' },
  { value: 'ja',  label: '🇯🇵 Japanese' },
  { value: 'ko',  label: '🇰🇷 Korean' },
  { value: 'hi',  label: '🇮🇳 Hindi' },
  { value: 'ar',  label: '🇸🇦 Arabic' },
];

const COUNTRY_OPTIONS = [
  { value: 'all', label: 'All Countries' },
  { value: 'US',  label: '🇺🇸 United States' },
  { value: 'GB',  label: '🇬🇧 United Kingdom' },
  { value: 'AU',  label: '🇦🇺 Australia' },
  { value: 'CA',  label: '🇨🇦 Canada' },
  { value: 'IN',  label: '🇮🇳 India' },
  { value: 'BR',  label: '🇧🇷 Brazil' },
  { value: 'DE',  label: '🇩🇪 Germany' },
  { value: 'FR',  label: '🇫🇷 France' },
  { value: 'JP',  label: '🇯🇵 Japan' },
];

// ── KOPI metric helpers ──────────────────────────────────────────────────────
function engagementRate(v: { likes?: number; comments?: number; views: number }) {
  return ((v.likes ?? 0) + (v.comments ?? 0)) / Math.max(v.views, 1) * 100;
}
function viewsVelocity(v: { views: number; published_at?: string }) {
  const days = Math.max(1, (Date.now() - new Date(v.published_at ?? Date.now()).getTime()) / 86400000);
  return v.views / days;
}
function commentRate(v: { comments?: number; views: number }) {
  return (v.comments ?? 0) / Math.max(v.views, 1) * 1000;
}

export default function VideosPage() {
  const { openVideoModal } = useAppStore();
  const [videos, setVideos] = useState<VideoInsight[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sort, setSort] = useState<SortValue>('outlier');
  const [platform, setPlatform] = useState<PlatformFilter>('All');
  const [language, setLanguage] = useState('all');
  const [country, setCountry] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      const data = await getVideoInsights();
      setVideos(data);
      setLoaded(true);
    });
  }, []);

  const activeFilterCount = [platform !== 'All', language !== 'all', country !== 'all'].filter(Boolean).length;

  function clearFilters() { setPlatform('All'); setLanguage('all'); setCountry('all'); }

  const currentSortLabel = SORT_GROUPS.flatMap(g => g.options).find(o => o.value === sort)?.label ?? sort;

  const filtered = useMemo(() => {
    let vids = [...videos];
    if (platform !== 'All') vids = vids.filter(v => v.channel?.platform === platform);
    if (language !== 'all') vids = vids.filter(v => (v.language ?? 'en') === language);
    if (country !== 'all')  vids = vids.filter(v => (v.country ?? 'US') === country);
    if (search.trim()) {
      const q = search.toLowerCase();
      vids = vids.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.channel?.handle?.toLowerCase().includes(q) ||
        (v.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case 'outlier':  vids.sort((a, b) => b.outlier_score - a.outlier_score); break;
      case 'impact':   vids.sort((a, b) => engagementRate(b) - engagementRate(a)); break;
      case 'velocity': vids.sort((a, b) => viewsVelocity(b) - viewsVelocity(a)); break;
      case 'keep':     vids.sort((a, b) => commentRate(b) - commentRate(a)); break;
      case 'views':    vids.sort((a, b) => b.views - a.views); break;
      case 'likes':    vids.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)); break;
      case 'comments': vids.sort((a, b) => (b.comments ?? 0) - (a.comments ?? 0)); break;
      case 'recent':   vids.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime()); break;
      case 'oldest':   vids.sort((a, b) => new Date(a.published_at ?? 0).getTime() - new Date(b.published_at ?? 0).getTime()); break;
      case 'az':       vids.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')); break;
      case 'za':       vids.sort((a, b) => (b.title ?? '').localeCompare(a.title ?? '')); break;
    }
    return vids;
  }, [sort, platform, language, country, search]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Videos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Outlier videos ranked by KOPI performance metrics.</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-2">
          {isPending ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Loading…</>
          ) : (
            <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {videos.length} videos loaded</>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Videos',   value: videos.length.toString(),                                                                                                      icon: Play,       color: 'text-violet-400' },
          { label: 'Avg Outlier (O)', value: videos.length > 0 ? (videos.reduce((s, v) => s + v.outlier_score, 0) / videos.length).toFixed(1) + 'x' : '—',               icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Avg Impact (I)',  value: videos.length > 0 ? (videos.reduce((s, v) => s + engagementRate(v), 0) / videos.length).toFixed(2) + '%' : '—',              icon: ThumbsUp,   color: 'text-blue-400' },
          { label: 'Mega Outliers',   value: videos.filter(v => v.outlier_score >= 8).length.toString(),                                                                    icon: Zap,        color: 'text-yellow-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
              <span className="text-[11px] text-zinc-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-[22px] font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search title, channel, tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/60"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 px-3 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/60"
          >
            {SORT_GROUPS.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all',
            showFilters || activeFilterCount > 0
              ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
              : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{activeFilterCount}</span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4 grid grid-cols-3 gap-4">
          {/* Platform */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Platform</label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_FILTERS.map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  className={cn('px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
                    platform === p ? 'bg-violet-600 border-violet-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  )}>
                  {p === 'All' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> Language
            </label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[12px] text-zinc-200 focus:outline-none focus:border-violet-500/60">
              {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Country
            </label>
            <select value={country} onChange={e => setCountry(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-[12px] text-zinc-200 focus:outline-none focus:border-violet-500/60">
              {COUNTRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Results count + active sort label */}
      <div className="flex items-center gap-2 mb-4 text-[11px] text-zinc-500">
        <span>{filtered.length} video{filtered.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>sorted by <span className="text-violet-400 font-medium">{currentSortLabel}</span></span>
        {activeFilterCount > 0 && (
          <>
            <span>·</span>
            <span className="text-yellow-400">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
          </>
        )}
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isPending && !loaded ? (
          <div className="col-span-2 text-center py-16 text-zinc-500">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-zinc-700 animate-spin" />
            <p className="text-sm">Loading your videos…</p>
          </div>
        ) : loaded && videos.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-zinc-500">
            <Play className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-400">No videos analyzed yet</p>
            <p className="text-xs mt-1 text-zinc-600">Track channels and search YouTube in <a href="/dashboard/research" className="text-violet-400 hover:text-violet-300">Research</a> to populate this feed.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-zinc-500">
            <Search className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm font-medium">No videos match your filters</p>
            <button onClick={() => { setSearch(''); clearFilters(); }} className="text-violet-400 text-xs mt-2 hover:text-violet-300">Clear all filters</button>
          </div>
        ) : filtered.map((video) => (
          <button
            key={video.id}
            onClick={() => openVideoModal(video)}
            className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all text-left group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={video.thumbnail_url || ''} alt={video.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

              {/* Outlier badge */}
              <div className={cn('absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm',
                video.outlier_score >= 8 ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                : video.outlier_score >= 5 ? 'bg-yellow-950/80 text-yellow-400 border-yellow-500/30'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-600/30'
              )}>
                <TrendingUp className="w-3 h-3" />
                {video.outlier_score.toFixed(1)}x
              </div>

              {/* Platform badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md',
                  video.channel?.platform === 'YOUTUBE' ? 'bg-red-600 text-white' :
                  video.channel?.platform === 'TIKTOK' ? 'bg-zinc-100 text-zinc-900' :
                  'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                )}>{video.channel?.platform}</span>
                {video.country && <span className="text-[10px] bg-zinc-900/80 text-zinc-300 px-1.5 py-0.5 rounded backdrop-blur-sm">{video.country}</span>}
              </div>

              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="p-4">
              <h3 className="text-[13px] font-semibold text-zinc-200 line-clamp-2 leading-snug mb-3 group-hover:text-white transition-colors">
                {video.title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-zinc-700 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={video.channel?.avatar_url || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] text-zinc-500">{video.channel?.display_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-zinc-500" />
                    <span className="text-[11px] text-zinc-400">{formatNumber(video.views)}</span>
                  </div>
                  {video.likes && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-zinc-500" />
                      <span className="text-[11px] text-zinc-400">{formatNumber(video.likes)}</span>
                    </div>
                  )}
                  {video.comments && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-zinc-500" />
                      <span className="text-[11px] text-zinc-400">{formatNumber(video.comments)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KOPI mini-bar */}
              <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-4 gap-2">
                {[
                  { label: 'O Score', value: video.outlier_score.toFixed(1) + 'x', color: 'text-emerald-400' },
                  { label: 'I Rate',  value: engagementRate(video).toFixed(2) + '%', color: 'text-blue-400' },
                  { label: 'P/Day',   value: formatNumber(Math.round(viewsVelocity(video))), color: 'text-violet-400' },
                  { label: 'K/1K',    value: commentRate(video).toFixed(1), color: 'text-yellow-400' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className={cn('text-[11px] font-bold', m.color)}>{m.value}</p>
                    <p className="text-[9px] text-zinc-600 mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      <VideoDetailModal />
    </div>
  );
}
