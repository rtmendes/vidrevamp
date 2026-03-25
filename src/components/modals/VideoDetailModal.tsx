'use client';

import { useState, useMemo } from 'react';
import {
  X,
  Eye,
  ThumbsUp,
  MessageCircle,
  Clock,
  Search,
  TrendingUp,
  Scissors,
  Film,
  Type,
  Camera,
  Palette,
  Zap,
  ExternalLink,
  BookMarked,
  Plus,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn, formatNumber, getOutlierLabel } from '@/lib/utils';
import type { TranscriptEntry } from '@/types';

const TABS = ['Transcript', 'Vision', 'Save'] as const;
type ModalTab = typeof TABS[number];

export function VideoDetailModal() {
  const { videoModal, closeVideoModal } = useAppStore();
  const [activeTab, setActiveTab] = useState<ModalTab>('Transcript');
  const [transcriptSearch, setTranscriptSearch] = useState('');

  const video = videoModal.video;

  // All hooks must run before any early return (Rules of Hooks)
  const filteredTranscript = useMemo((): TranscriptEntry[] => {
    if (!video) return [];
    if (!transcriptSearch.trim()) return video.transcript;
    const q = transcriptSearch.toLowerCase();
    return video.transcript.filter((entry) =>
      entry.text.toLowerCase().includes(q) || entry.t.includes(q)
    );
  }, [video, transcriptSearch]);

  if (!videoModal.isOpen || !video) return null;

  const va = video.visual_analysis;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && closeVideoModal()}
    >
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-[15px] font-semibold text-zinc-100 leading-snug line-clamp-2">
              {video.title}
            </h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[11px] text-zinc-500 font-medium">
                @{video.channel?.handle?.replace('@', '')}
              </span>
              <div className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-zinc-500" />
                <span className="text-[11px] text-zinc-400">{formatNumber(video.views)}</span>
              </div>
              {video.likes && (
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3 h-3 text-zinc-500" />
                  <span className="text-[11px] text-zinc-400">{formatNumber(video.likes)}</span>
                </div>
              )}
              {video.comments && (
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3 text-zinc-500" />
                  <span className="text-[11px] text-zinc-400">{formatNumber(video.comments)}</span>
                </div>
              )}
              {video.duration_seconds && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-[11px] text-zinc-400">
                    {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              {/* Outlier score badge */}
              <div className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border',
                video.outlier_score >= 8
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : video.outlier_score >= 5
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  : 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30'
              )}>
                <TrendingUp className="w-2.5 h-2.5" />
                {video.outlier_score.toFixed(1)}x · {getOutlierLabel(video.outlier_score)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={closeVideoModal}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thumbnail preview */}
        {video.thumbnail_url && (
          <div className="relative w-full aspect-video bg-zinc-950 max-h-48 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnail_url}
              alt={video.title || 'Video thumbnail'}
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
                Idea Detail View
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 px-5 bg-zinc-900">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-violet-500 text-violet-300'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* TRANSCRIPT TAB */}
          {activeTab === 'Transcript' && (
            <div className="p-5">
              {/* Search bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search transcript..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2.5 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/60 focus:bg-zinc-800"
                />
              </div>

              {/* Transcript entries */}
              <div className="space-y-2">
                {filteredTranscript.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">No matches found.</p>
                ) : (
                  filteredTranscript.map((entry, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-lg hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                    >
                      <span className="text-[11px] font-mono text-violet-400 mt-0.5 shrink-0 w-10">
                        {entry.t}
                      </span>
                      <p className="text-sm text-zinc-300 leading-relaxed">{entry.text}</p>
                      <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <BookMarked className="w-3.5 h-3.5 text-zinc-500 hover:text-violet-400" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VISION TAB */}
          {activeTab === 'Vision' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">GPT-4o Vision Analysis</p>
                  <p className="text-[11px] text-zinc-500">Visual editing tactics extracted from video screenshots</p>
                </div>
              </div>

              {/* Visual Hook */}
              <VisionCard
                icon={<Zap className="w-3.5 h-3.5 text-yellow-400" />}
                iconBg="bg-yellow-500/10 border-yellow-500/20"
                label="Visual Hook"
                content={va.visual_hook}
              />

              {/* Pacing */}
              <VisionCard
                icon={<Scissors className="w-3.5 h-3.5 text-red-400" />}
                iconBg="bg-red-500/10 border-red-500/20"
                label="Editing Pacing"
                content={`${va.pacing_cuts_per_sec} cuts/sec — ${
                  va.pacing_cuts_per_sec > 3 ? 'Very fast, high-energy editing style' :
                  va.pacing_cuts_per_sec > 2 ? 'Fast-paced, engagement-optimized' :
                  'Slower, story-driven pacing'
                }`}
                metric={
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-zinc-500">Slow</span>
                      <span className="text-[10px] text-zinc-500">Fast</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                        style={{ width: `${Math.min(100, (va.pacing_cuts_per_sec / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                }
              />

              {/* B-Roll */}
              <VisionCard
                icon={<Film className="w-3.5 h-3.5 text-blue-400" />}
                iconBg="bg-blue-500/10 border-blue-500/20"
                label="B-Roll Usage"
                content={va.broll_usage}
              />

              {/* Text Overlay */}
              <VisionCard
                icon={<Type className="w-3.5 h-3.5 text-green-400" />}
                iconBg="bg-green-500/10 border-green-500/20"
                label="Text Overlay Style"
                content={va.text_overlay_style}
              />

              {/* Camera Framing */}
              <VisionCard
                icon={<Camera className="w-3.5 h-3.5 text-purple-400" />}
                iconBg="bg-purple-500/10 border-purple-500/20"
                label="Camera Framing"
                content={va.camera_framing}
              />

              {/* Color Grade */}
              <VisionCard
                icon={<Palette className="w-3.5 h-3.5 text-pink-400" />}
                iconBg="bg-pink-500/10 border-pink-500/20"
                label="Color Grade"
                content={va.color_grade}
              />

              {/* Key Moments */}
              {va.key_moments && va.key_moments.length > 0 && (
                <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Key Visual Moments
                  </p>
                  <div className="space-y-2">
                    {va.key_moments.map((moment, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-[11px] font-mono text-violet-400 shrink-0 mt-0.5 w-10">
                          {moment.timestamp}
                        </span>
                        <p className="text-[12px] text-zinc-300 leading-relaxed">{moment.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SAVE TAB */}
          {activeTab === 'Save' && (
            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-400 mb-4">Save elements from this video to your Vault or a Project.</p>

              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-4 bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/40 rounded-xl text-left transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/25 transition-colors">
                    <BookMarked className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Save Hook to Vault</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Extract the opening hook and save it as a reusable template</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/40 rounded-xl text-left transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/25 transition-colors">
                    <Film className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Save Style to Vault</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Save the visual editing style and tactics as a reference</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-4 bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/40 rounded-xl text-left transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                    <Plus className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Add to Project</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Save this video insight to one of your projects</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Vision Card sub-component ──────────────────────────────────
function VisionCard({
  icon,
  iconBg,
  label,
  content,
  metric,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  content: string;
  metric?: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center border', iconBg)}>
          {icon}
        </div>
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-sm text-zinc-200 leading-relaxed">{content}</p>
      {metric}
    </div>
  );
}
