'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Filter,
  Eye,
  ThumbsUp,
  Zap,
  Play,
  Search,
} from 'lucide-react';
import { MOCK_VIDEOS } from '@/lib/mock-data';
import { useAppStore } from '@/store/useAppStore';
import { VideoDetailModal } from '@/components/modals/VideoDetailModal';
import { cn, formatNumber } from '@/lib/utils';

const SORT_OPTIONS = ['Outlier Score', 'Views', 'Recent'] as const;
type SortOption = typeof SORT_OPTIONS[number];

const PLATFORM_FILTERS = ['All', 'YOUTUBE', 'TIKTOK', 'INSTAGRAM'] as const;
type PlatformFilter = typeof PLATFORM_FILTERS[number];

export default function VideosPage() {
  const { openVideoModal } = useAppStore();
  const [sort, setSort] = useState<SortOption>('Outlier Score');
  const [platform, setPlatform] = useState<PlatformFilter>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let vids = [...MOCK_VIDEOS];

    if (platform !== 'All') {
      vids = vids.filter((v) => v.channel?.platform === platform);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      vids = vids.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.channel?.handle?.toLowerCase().includes(q)
      );
    }

    if (sort === 'Outlier Score') vids.sort((a, b) => b.outlier_score - a.outlier_score);
    else if (sort === 'Views') vids.sort((a, b) => b.views - a.views);
    else vids.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());

    return vids;
  }, [sort, platform, search]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Videos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Outlier videos from your watchlists, ranked by performance ratio.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Last synced 2 min ago
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Videos', value: MOCK_VIDEOS.length.toString(), icon: Play, color: 'text-violet-400' },
          { label: 'Avg Outlier Score', value: (MOCK_VIDEOS.reduce((s, v) => s + v.outlier_score, 0) / MOCK_VIDEOS.length).toFixed(1) + 'x', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Total Views', value: formatNumber(MOCK_VIDEOS.reduce((s, v) => s + v.views, 0)), icon: Eye, color: 'text-blue-400' },
          { label: 'Mega Outliers', value: MOCK_VIDEOS.filter(v => v.outlier_score >= 8).length.toString(), icon: Zap, color: 'text-yellow-400' },
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

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/60"
          />
        </div>

        {/* Platform filter */}
        <div className="flex gap-1.5">
          {PLATFORM_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                platform === p
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
              )}
            >
              {p === 'All' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-1.5 px-3 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/60"
          >
            {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((video) => (
          <button
            key={video.id}
            onClick={() => openVideoModal(video)}
            className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all text-left group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={video.thumbnail_url || ''}
                alt={video.title || ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

              {/* Outlier badge */}
              <div className={cn(
                'absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm',
                video.outlier_score >= 8
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                  : video.outlier_score >= 5
                  ? 'bg-yellow-950/80 text-yellow-400 border-yellow-500/30'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-600/30'
              )}>
                <TrendingUp className="w-3 h-3" />
                {video.outlier_score.toFixed(1)}x
              </div>

              {/* Platform badge */}
              <div className="absolute top-3 left-3">
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-md',
                  video.channel?.platform === 'YOUTUBE' ? 'bg-red-600 text-white' :
                  video.channel?.platform === 'TIKTOK' ? 'bg-zinc-100 text-zinc-900' :
                  'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                )}>
                  {video.channel?.platform}
                </span>
              </div>

              {/* Play icon overlay */}
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
                    <img
                      src={video.channel?.avatar_url || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
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
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Video detail modal */}
      <VideoDetailModal />
    </div>
  );
}
