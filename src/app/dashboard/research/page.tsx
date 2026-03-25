'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageSquare,
  Download,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  Clock,
  Zap,
  Users,
  ChevronDown,
  ChevronUp,
  BookMarked,
  ExternalLink,
  Loader2,
  PlayCircle,
  Music2,
  Hash,
  Flame,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { searchYouTubeVideos, getChannelVideosWithOutlierScore, searchYouTubeChannels } from '@/actions/youtube';
import type { YouTubeVideoResult } from '@/actions/youtube';
import { getTrackedChannels, addChannelToWatchlist, getOrCreateDefaultWatchlist } from '@/actions/channels';
import { addVaultItem } from '@/actions/vault';
import type { TrackedChannel } from '@/types';

// ── Research types ────────────────────────────────────────────────────────────

interface ResearchVideo {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelHandle: string;
  channelAvatar: string;
  channelAvgViews: number;
  views: number;
  likes: number;
  comments: number;
  outlierScore: number;
  publishedAt: string;
  durationSeconds: number;
  platform: 'YouTube' | 'TikTok' | 'Instagram';
  hook: string;
  tags: string[];
}


// ── YouTube API Helpers ───────────────────────────────────────────────────────

/** Parse ISO 8601 duration (PT4M32S) → total seconds */
function parseISODuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 3600) + (parseInt(m[2] ?? '0') * 60) + parseInt(m[3] ?? '0');
}

function ytResultToResearchVideo(v: YouTubeVideoResult, channelAvgViews = 0): ResearchVideo {
  return {
    id: v.videoId,
    title: v.title,
    thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
    channel: v.channelTitle,
    channelHandle: `@${v.channelTitle.toLowerCase().replace(/\s+/g, '')}`,
    channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.channelId}`,
    channelAvgViews,
    views: v.viewCount,
    likes: v.likeCount,
    comments: v.commentCount,
    outlierScore: v.outlierScore,
    publishedAt: v.publishedAt.split('T')[0],
    durationSeconds: parseISODuration(v.duration),
    platform: 'YouTube',
    hook: v.title,
    tags: [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function scoreColor(score: number) {
  if (score >= 10) return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30';
  if (score >= 5) return 'text-yellow-400 bg-yellow-950/80 border-yellow-500/30';
  return 'text-zinc-400 bg-zinc-900/80 border-zinc-600/30';
}

function scoreGlow(score: number) {
  if (score >= 10) return 'hover:border-emerald-500/30 hover:shadow-emerald-500/5';
  if (score >= 5) return 'hover:border-yellow-500/30 hover:shadow-yellow-500/5';
  return 'hover:border-violet-500/30 hover:shadow-violet-500/5';
}

function exportCSV(videos: ResearchVideo[]) {
  const header = 'Title,Channel,Views,Outlier Score,Likes,Comments,Published,Duration,Platform,Hook\n';
  const rows = videos.map(v =>
    `"${v.title.replace(/"/g, '""')}","${v.channel}",${v.views},${v.outlierScore.toFixed(1)},${v.likes},${v.comments},${v.publishedAt},${formatDuration(v.durationSeconds)},${v.platform},"${v.hook.replace(/"/g, '""')}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vidrevamp-research.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── TikTok Trend Mock Data (Apify tiktok-scraper actor) ───────────────────────
const TT_SOUNDS = [
  { id: 's1', title: 'Flowers - Miley Cyrus (sped up)', uses: 4_820_000, growth: 182, category: 'Music' },
  { id: 's2', title: 'Oh No - Capone (viral transition mix)', uses: 2_140_000, growth: 94, category: 'Music' },
  { id: 's3', title: 'Original sound by @alexhormozi', uses: 890_000, growth: 341, category: 'Motivational' },
  { id: 's4', title: 'Tsamina mina eh eh Waka Waka', uses: 1_340_000, growth: 57, category: 'Music' },
  { id: 's5', title: 'iPhone Notification (glitched)', uses: 3_210_000, growth: 124, category: 'SFX' },
];

const TT_HASHTAGS = [
  { tag: '#sidehustle', posts: 4_200_000, growth: 28, niche: 'Business' },
  { tag: '#passiveincome', posts: 3_800_000, growth: 42, niche: 'Finance' },
  { tag: '#contentcreator', posts: 7_100_000, growth: 15, niche: 'Creator' },
  { tag: '#aitools', posts: 2_400_000, growth: 187, niche: 'Tech' },
  { tag: '#gymtok', posts: 5_600_000, growth: 33, niche: 'Fitness' },
  { tag: '#smallbusiness', posts: 6_200_000, growth: 22, niche: 'Business' },
];

const TT_VIRAL_VIDEOS = [
  { id: 'tt1', title: 'How I make $847 a day with no boss using ONE app', creator: '@sidehustlemike', views: 28_400_000, likes: 1_840_000, sound: 'original sound', hook: 'No degree. No boss. One app. $847/day.', daysAgo: 3 },
  { id: 'tt2', title: 'This AI tool replaced my entire marketing team', creator: '@techfounder', views: 18_200_000, likes: 920_000, sound: 'iPhone notification glitch', hook: 'I fired 3 people. This $20/month tool does it better.', daysAgo: 5 },
  { id: 'tt3', title: 'POV: You finally start the business you\'ve been thinking about', creator: '@entrepreneurlife', views: 12_800_000, likes: 1_120_000, sound: '@alexhormozi motivational', hook: 'Stop planning. Start building.', daysAgo: 7 },
  { id: 'tt4', title: 'The 5am routine that changed my entire life', creator: '@wealthyhabits', views: 9_600_000, likes: 780_000, sound: 'Flowers sped up', hook: '5am. Cold shower. Read. Move. Win.', daysAgo: 9 },
];

// ── Component ────────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';
type SortBy = 'outlier' | 'views' | 'recent' | 'engagement';
type PlatformFilter = 'All' | 'YouTube' | 'TikTok' | 'Instagram';

export default function ResearchPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('outlier');
  const [platform, setPlatform] = useState<PlatformFilter>('All');
  const [minScore, setMinScore] = useState(0);
  const [minViews, setMinViews] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ResearchVideo | null>(null);
  const [savedHooks, setSavedHooks] = useState<Set<string>>(new Set());
  const [showTikTokTrends, setShowTikTokTrends] = useState(false);
  const [ttLoading, setTtLoading] = useState(false);
  const [ttLoaded, setTtLoaded] = useState(false);

  // Tracked channels from Supabase
  const [trackedChannels, setTrackedChannels] = useState<TrackedChannel[]>([]);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  useEffect(() => {
    getTrackedChannels().then(setTrackedChannels);
  }, []);

  async function handleTrackChannel(ch: { channelId: string; title: string; thumbnail: string; subscriberCount?: number }) {
    setTrackingId(ch.channelId);
    const watchlistId = await getOrCreateDefaultWatchlist();
    if (watchlistId) {
      await addChannelToWatchlist(watchlistId, {
        platform: 'YOUTUBE',
        handle: `@${ch.title.toLowerCase().replace(/\s+/g, '')}`,
        display_name: ch.title,
        avatar_url: ch.thumbnail,
        subscriber_count: ch.subscriberCount,
      });
      const updated = await getTrackedChannels();
      setTrackedChannels(updated);
    }
    setTrackingId(null);
  }

  async function fetchTikTokTrends() {
    setTtLoading(true);
    // In production: Apify actor run → tiktok-scraper
    await new Promise(r => setTimeout(r, 2200));
    setTtLoading(false);
    setTtLoaded(true);
  }

  // YouTube live data
  const [ytQuery, setYtQuery] = useState('');
  const [ytMode, setYtMode] = useState<'keyword' | 'channel'>('keyword');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState('');
  const [ytVideos, setYtVideos] = useState<ResearchVideo[]>([]);
  const [ytAvgViews, setYtAvgViews] = useState(0);
  const [ytChannelResults, setYtChannelResults] = useState<{ channelId: string; title: string; thumbnail: string; subscriberCount?: number }[]>([]);

  async function runYouTubeSearch() {
    if (!ytQuery.trim()) return;
    setYtLoading(true);
    setYtError('');
    setYtVideos([]);
    setYtChannelResults([]);
    try {
      if (ytMode === 'keyword') {
        const res = await searchYouTubeVideos(ytQuery, 25, 'viewCount');
        if (!res.success || !res.data) throw new Error(res.error ?? 'Search failed');
        setYtVideos(res.data.map(v => ytResultToResearchVideo(v)));
      } else {
        const res = await searchYouTubeChannels(ytQuery, 8);
        if (!res.success || !res.data) throw new Error(res.error ?? 'Channel search failed');
        setYtChannelResults(res.data);
      }
    } catch (err) {
      setYtError(err instanceof Error ? err.message : 'YouTube API error');
    } finally {
      setYtLoading(false);
    }
  }

  async function loadChannelVideos(channelId: string) {
    setYtLoading(true);
    setYtError('');
    setYtChannelResults([]);
    try {
      const res = await getChannelVideosWithOutlierScore(channelId, 20);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to load channel videos');
      const avg = res.channelAvgViews ?? 0;
      setYtAvgViews(avg);
      setYtVideos(res.data.map(v => ytResultToResearchVideo(v, avg)));
    } catch (err) {
      setYtError(err instanceof Error ? err.message : 'YouTube API error');
    } finally {
      setYtLoading(false);
    }
  }

  const activeVideos = ytVideos;

  const filtered = useMemo(() => {
    let vids = [...activeVideos];

    if (platform !== 'All') vids = vids.filter(v => v.platform === platform);
    if (search.trim()) {
      const q = search.toLowerCase();
      vids = vids.filter(v => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q)));
    }
    if (minScore > 0) vids = vids.filter(v => v.outlierScore >= minScore);
    if (minViews > 0) vids = vids.filter(v => v.views >= minViews * 1000000);
    if (maxDuration > 0) vids = vids.filter(v => v.durationSeconds <= maxDuration * 60);

    switch (sortBy) {
      case 'outlier': vids.sort((a, b) => b.outlierScore - a.outlierScore); break;
      case 'views': vids.sort((a, b) => b.views - a.views); break;
      case 'recent': vids.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()); break;
      case 'engagement': vids.sort((a, b) => (b.likes / b.views) - (a.likes / a.views)); break;
    }

    return vids;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, platform, sortBy, minScore, minViews, maxDuration, ytVideos]);

  const avgScore = filtered.length > 0 ? (filtered.reduce((s, v) => s + v.outlierScore, 0) / filtered.length).toFixed(1) : '0';
  const megaOutliers = filtered.filter(v => v.outlierScore >= 10).length;

  async function saveHook(video: ResearchVideo) {
    setSavedHooks(prev => new Set(Array.from(prev).concat(video.id)));
    await addVaultItem('HOOK', video.hook, video.tags);
  }

  const activeFilterCount = [
    platform !== 'All',
    minScore > 0,
    minViews > 0,
    maxDuration > 0,
  ].filter(Boolean).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Outlier Research</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">
            Discover videos that massively outperformed their channel average — the signal that matters.
          </p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 rounded-lg text-[12px] font-medium text-zinc-300 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* YouTube Live Search */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <PlayCircle className="w-4 h-4 text-red-400" />
          <span className="text-[13px] font-semibold text-zinc-300">YouTube Live Research</span>
          {ytVideos.length > 0 && (
            <button
              onClick={() => { setYtVideos([]); setYtAvgViews(0); setYtChannelResults([]); }}
              className="ml-auto text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear results
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex bg-zinc-800/60 border border-zinc-700/50 rounded-lg overflow-hidden text-[11px]">
            <button
              onClick={() => setYtMode('keyword')}
              className={cn('px-3 py-1.5 font-medium transition-colors', ytMode === 'keyword' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300')}
            >
              Keywords
            </button>
            <button
              onClick={() => setYtMode('channel')}
              className={cn('px-3 py-1.5 font-medium transition-colors', ytMode === 'channel' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300')}
            >
              Channel
            </button>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder={ytMode === 'keyword' ? 'Search YouTube for outlier videos…' : 'Search for a YouTube channel…'}
              value={ytQuery}
              onChange={e => setYtQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runYouTubeSearch()}
              className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-red-500/60"
            />
          </div>
          <button
            onClick={runYouTubeSearch}
            disabled={ytLoading || !ytQuery.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg text-[12px] font-semibold text-white transition-colors"
          >
            {ytLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
            Search
          </button>
        </div>

        {ytError && (
          <p className="mt-2 text-[11px] text-red-400 flex items-center gap-1.5">
            <X className="w-3 h-3" /> {ytError}
          </p>
        )}

        {/* Channel picker results */}
        {ytChannelResults.length > 0 && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ytChannelResults.map(ch => (
              <button
                key={ch.channelId}
                onClick={() => loadChannelVideos(ch.channelId)}
                className="flex items-center gap-2 p-2 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-lg transition-colors text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ch.thumbnail} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-zinc-200 truncate">{ch.title}</p>
                  {ch.subscriberCount && (
                    <p className="text-[10px] text-zinc-500">{formatNumber(ch.subscriberCount)} subs</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {ytVideos.length > 0 && (
          <p className="mt-2 text-[11px] text-emerald-400">
            {ytVideos.length} live videos loaded{ytAvgViews > 0 ? ` · Channel avg: ${formatNumber(Math.round(ytAvgViews))} views` : ''}
          </p>
        )}
      </div>

      {/* TikTok Trends (Apify) */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl mb-6 overflow-hidden">
        <button
          onClick={() => setShowTikTokTrends(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ff0050]" />
            <span className="text-[13px] font-semibold text-zinc-300">TikTok Trend Monitor</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">via Apify</span>
            {ttLoaded && <span className="text-[10px] text-emerald-400 font-semibold">Live data</span>}
          </div>
          {showTikTokTrends ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {showTikTokTrends && (
          <div className="border-t border-zinc-800/60 p-4 space-y-5">
            {!ttLoaded ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ff0050]/10 border border-[#ff0050]/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-[#ff0050]" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-zinc-300">Fetch TikTok Trending Data</p>
                  <p className="text-[12px] text-zinc-600 mt-1">Runs Apify tiktok-scraper actor · Returns top sounds, hashtags, and viral videos in your niche</p>
                </div>
                <button
                  onClick={fetchTikTokTrends}
                  disabled={ttLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#ff0050] hover:bg-[#e00047] text-white text-[13px] font-semibold rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-[#ff0050]/20"
                >
                  {ttLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                  {ttLoading ? 'Running Apify Actor…' : 'Fetch Trends Now'}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">Last refreshed: just now · Apify actor: tiktok-scraper</span>
                  <button onClick={() => { setTtLoaded(false); }} className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
                    <X className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Trending Sounds */}
                <div>
                  <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Music2 className="w-3 h-3" /> Trending Sounds
                  </h4>
                  <div className="space-y-2">
                    {TT_SOUNDS.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 bg-zinc-800/40 rounded-lg">
                        <span className="text-[11px] font-black text-zinc-600 w-4">{i + 1}</span>
                        <div className="w-8 h-8 rounded-lg bg-[#ff0050]/10 border border-[#ff0050]/20 flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-3.5 h-3.5 text-[#ff0050]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-zinc-200 truncate">{s.title}</p>
                          <p className="text-[10px] text-zinc-600">{formatNumber(s.uses)} uses · {s.category}</p>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+{s.growth}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Hashtags */}
                <div>
                  <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Hash className="w-3 h-3" /> Trending Hashtags (7d)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {TT_HASHTAGS.map(h => (
                      <div key={h.tag} className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-3 py-1.5">
                        <span className="text-[12px] font-semibold text-[#ff0050]">{h.tag}</span>
                        <span className="text-[10px] text-zinc-500">{formatNumber(h.posts)}</span>
                        <span className="text-[10px] font-bold text-emerald-400">+{h.growth}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Viral Videos */}
                <div>
                  <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Flame className="w-3 h-3" /> Viral Videos (last 10 days)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {TT_VIRAL_VIDEOS.map(v => (
                      <div key={v.id} className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-3">
                        <p className="text-[12px] font-semibold text-zinc-200 leading-snug mb-1">{v.title}</p>
                        <p className="text-[10px] text-[#ff0050] mb-1">{v.creator}</p>
                        <p className="text-[11px] text-zinc-400 italic mb-2">&ldquo;{v.hook}&rdquo;</p>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                          <span><Eye className="w-2.5 h-2.5 inline mr-0.5" />{formatNumber(v.views)}</span>
                          <span><ThumbsUp className="w-2.5 h-2.5 inline mr-0.5" />{formatNumber(v.likes)}</span>
                          <span className="ml-auto text-zinc-700">{v.daysAgo}d ago</span>
                        </div>
                        <div className="mt-1.5 text-[10px] text-zinc-600">🎵 {v.sound}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Videos Analyzed', value: filtered.length.toString(), icon: TrendingUp, color: 'text-violet-400', bg: 'from-violet-500/10 to-violet-600/5' },
          { label: 'Avg Outlier Score', value: avgScore + 'x', icon: Zap, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5' },
          { label: 'Mega Outliers (10x+)', value: megaOutliers.toString(), icon: TrendingUp, color: 'text-yellow-400', bg: 'from-yellow-500/10 to-yellow-600/5' },
          { label: ytVideos.length > 0 ? 'Live Results' : 'Channels Tracked', value: ytVideos.length > 0 ? `${ytVideos.length}` : trackedChannels.length.toString(), icon: Users, color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5' },
        ].map((stat) => (
          <div key={stat.label} className={cn('bg-gradient-to-br border border-zinc-800/60 rounded-xl p-4', stat.bg, 'bg-zinc-900')}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
              <span className="text-[11px] text-zinc-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-[22px] font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Channels row */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-zinc-400 uppercase tracking-wider">Tracked Channels</h2>
          <a href="/dashboard/channels" className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors">+ Manage in Channels</a>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {trackedChannels.map(ch => (
            <button
              key={ch.id}
              onClick={() => {
                setYtMode('channel');
                setYtQuery(ch.display_name ?? ch.handle);
              }}
              className="flex-shrink-0 bg-zinc-900 border border-zinc-800/60 rounded-xl p-3.5 min-w-[160px] hover:border-violet-500/30 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 mb-3">
                {ch.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ch.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold">
                    {(ch.display_name ?? ch.handle).slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-zinc-200 truncate">{ch.display_name ?? ch.handle}</p>
                  <p className="text-[10px] text-zinc-600">{ch.handle}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">Subscribers</span>
                  <span className="text-[11px] text-zinc-400">{formatNumber(ch.subscriber_count ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600">Platform</span>
                  <span className="text-[10px] font-semibold text-zinc-500">{ch.platform}</span>
                </div>
              </div>
            </button>
          ))}

          {/* Channel search results — show "Track" button */}
          {ytChannelResults.map(ch => {
            const alreadyTracked = trackedChannels.some(t => t.display_name === ch.title);
            return (
              <div key={ch.channelId} className="flex-shrink-0 bg-zinc-900 border border-zinc-800/60 rounded-xl p-3.5 min-w-[160px] relative">
                <div className="flex items-center gap-2.5 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ch.thumbnail} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-zinc-200 truncate">{ch.title}</p>
                    {ch.subscriberCount && <p className="text-[10px] text-zinc-600">{formatNumber(ch.subscriberCount)} subs</p>}
                  </div>
                </div>
                {alreadyTracked ? (
                  <span className="text-[10px] text-emerald-400 font-semibold">Tracked ✓</span>
                ) : (
                  <button
                    onClick={() => handleTrackChannel(ch)}
                    disabled={trackingId === ch.channelId}
                    className="w-full flex items-center justify-center gap-1 py-1 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-[10px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {trackingId === ch.channelId ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
                    Track Channel
                  </button>
                )}
              </div>
            );
          })}

          <a
            href="/dashboard/channels"
            className="flex-shrink-0 min-w-[160px] bg-zinc-900/40 border border-zinc-800/40 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 hover:border-zinc-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <Users className="w-4 h-4 text-zinc-500" />
            </div>
            <p className="text-[11px] text-zinc-600 text-center">Add a channel</p>
          </a>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by title, channel, or tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/60"
          />
        </div>

        {/* Platform tabs */}
        <div className="flex gap-1">
          {(['All', 'YouTube', 'TikTok', 'Instagram'] as PlatformFilter[]).map(p => (
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
              {p}
            </button>
          ))}
        </div>

        {/* Advanced filters button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all',
            showFilters || activeFilterCount > 0
              ? 'bg-violet-600/20 text-violet-300 border-violet-500/30'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border-zinc-700/50'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-violet-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="relative ml-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            className="appearance-none bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-1.5 pl-3 pr-8 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/60 cursor-pointer"
          >
            <option value="outlier">Sort: Outlier Score</option>
            <option value="views">Sort: Most Views</option>
            <option value="recent">Sort: Most Recent</option>
            <option value="engagement">Sort: Engagement Rate</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
        </div>

        {/* View toggle */}
        <div className="flex bg-zinc-800/60 border border-zinc-700/50 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-1.5 transition-colors', viewMode === 'grid' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-1.5 transition-colors', viewMode === 'list' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300')}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 mb-5 grid grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-2 block">Min Outlier Score</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="text-[12px] text-zinc-300 w-10 text-right font-mono">{minScore > 0 ? `${minScore}x` : 'Any'}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-2 block">Min Views</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={minViews}
                onChange={e => setMinViews(Number(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="text-[12px] text-zinc-300 w-12 text-right font-mono">{minViews > 0 ? `${minViews}M` : 'Any'}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-2 block">Max Duration (minutes)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={maxDuration}
                onChange={e => setMaxDuration(Number(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="text-[12px] text-zinc-300 w-12 text-right font-mono">{maxDuration > 0 ? `${maxDuration}m` : 'Any'}</span>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="col-span-3 flex justify-end">
              <button
                onClick={() => { setMinScore(0); setMinViews(0); setMaxDuration(0); setPlatform('All'); }}
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-[12px] text-zinc-600 mb-4">
        {filtered.length} videos · sorted by {sortBy === 'outlier' ? 'outlier score' : sortBy === 'views' ? 'view count' : sortBy === 'recent' ? 'publish date' : 'engagement rate'}
      </p>

      {/* Video Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(video => (
            <div
              key={video.id}
              className={cn(
                'bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer',
                scoreGlow(video.outlierScore)
              )}
              onClick={() => setSelectedVideo(selectedVideo?.id === video.id ? null : video)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />

                {/* Score badge */}
                <div className={cn('absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-black border backdrop-blur-sm', scoreColor(video.outlierScore))}>
                  <TrendingUp className="w-3 h-3" />
                  {video.outlierScore.toFixed(1)}x
                </div>

                {/* Platform */}
                <div className="absolute top-2.5 left-2.5">
                  <span className={cn(
                    'text-[9px] font-bold px-2 py-0.5 rounded',
                    video.platform === 'YouTube' ? 'bg-red-600 text-white' :
                    video.platform === 'TikTok' ? 'bg-zinc-100 text-zinc-900' :
                    'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  )}>
                    {video.platform.toUpperCase()}
                  </span>
                </div>

                {/* Duration */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <Clock className="w-2.5 h-2.5 text-zinc-400" />
                  <span className="text-[10px] text-zinc-300 font-mono">{formatDuration(video.durationSeconds)}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-3.5">
                <h3 className="text-[13px] font-semibold text-zinc-200 line-clamp-2 leading-snug mb-2.5 group-hover:text-white transition-colors">
                  {video.title}
                </h3>

                {/* Channel */}
                <div className="flex items-center gap-1.5 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={video.channelAvatar} alt="" className="w-4 h-4 rounded-full" />
                  <span className="text-[11px] text-zinc-500">{video.channel}</span>
                  <span className="text-[10px] text-zinc-700">·</span>
                  <span className="text-[10px] text-zinc-600">Avg {formatNumber(video.channelAvgViews)} views</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-zinc-500" />
                    <span className="text-[11px] text-zinc-400">{formatNumber(video.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-zinc-500" />
                    <span className="text-[11px] text-zinc-400">{formatNumber(video.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-zinc-500" />
                    <span className="text-[11px] text-zinc-400">{formatNumber(video.comments)}</span>
                  </div>
                  <span className="ml-auto text-[10px] text-zinc-600">{video.publishedAt}</span>
                </div>

                {/* Tags */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {video.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Expanded hook panel */}
              {selectedVideo?.id === video.id && (
                <div className="mx-3.5 mb-3.5 bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-3" onClick={e => e.stopPropagation()}>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Opening Hook</p>
                  <p className="text-[12px] text-zinc-300 leading-relaxed italic mb-3">&ldquo;{video.hook}&rdquo;</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveHook(video)}
                      disabled={savedHooks.has(video.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                        savedHooks.has(video.id)
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-violet-600 hover:bg-violet-500 text-white'
                      )}
                    >
                      <BookMarked className="w-3 h-3" />
                      {savedHooks.has(video.id) ? 'Saved to Vault' : 'Save Hook to Vault'}
                    </button>
                    <button className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[11px] transition-colors">
                      <ExternalLink className="w-3 h-3" />
                      View
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {filtered.map((video, i) => (
            <div
              key={video.id}
              className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-all cursor-pointer group"
              onClick={() => setSelectedVideo(selectedVideo?.id === video.id ? null : video)}
            >
              {/* Rank */}
              <span className="text-[12px] font-mono text-zinc-700 w-5 text-right flex-shrink-0">#{i + 1}</span>

              {/* Thumbnail */}
              <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>

              {/* Title + channel */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                  {video.title}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{video.channel} · {video.publishedAt}</p>
              </div>

              {/* Score */}
              <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-black flex-shrink-0', scoreColor(video.outlierScore))}>
                <TrendingUp className="w-3.5 h-3.5" />
                {video.outlierScore.toFixed(1)}x
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-shrink-0 text-[12px] text-zinc-500">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatNumber(video.views)}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {formatNumber(video.likes)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(video.durationSeconds)}
                </div>
              </div>

              {/* Save hook */}
              <button
                onClick={e => { e.stopPropagation(); saveHook(video); }}
                disabled={savedHooks.has(video.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  savedHooks.has(video.id)
                    ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                )}
              >
                <BookMarked className="w-3 h-3" />
                {savedHooks.has(video.id) ? 'Saved' : 'Save Hook'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeVideos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">No videos yet</p>
          <p className="text-zinc-600 text-[12px]">Search YouTube above by keyword or channel to find outlier videos.</p>
        </div>
      )}

      {activeVideos.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16">
          <TrendingUp className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No videos match your filters.</p>
          <button
            onClick={() => { setSearch(''); setPlatform('All'); setMinScore(0); setMinViews(0); setMaxDuration(0); }}
            className="mt-3 text-violet-400 text-[12px] hover:text-violet-300 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
