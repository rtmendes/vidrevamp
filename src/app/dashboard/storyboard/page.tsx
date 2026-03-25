'use client';

import { useState, useTransition } from 'react';
import {
  Layers,
  Zap,
  Image,
  Download,
  ChevronLeft,
  ChevronRight,
  Camera,
  Eye,
  Music,
  Clock,
  Film,
  Loader2,
  Plus,
  Video,
  FileText,
  Info,
} from 'lucide-react';
import { generateStoryboard, generateFrameImage } from '@/actions/storyboard';
import type { Storyboard, StoryboardFrame } from '@/actions/storyboard';
import { cn } from '@/lib/utils';

const NICHES = [
  'Business',
  'Finance',
  'Fitness',
  'Health',
  'Education',
  'E-Commerce',
  'Tech & AI',
  'Lifestyle',
] as const;

type AspectRatio = '9:16' | '16:9' | '1:1';

function getShotTypeColor(shotType: string): string {
  const upper = shotType.toUpperCase();
  if (upper.startsWith('ECU') || upper.startsWith('CU')) {
    return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
  }
  if (upper.startsWith('MCU') || upper.startsWith('MS')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  }
  if (upper.startsWith('WS')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
  if (upper.startsWith('OTS') || upper.startsWith('POV')) {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  }
  return 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40';
}

function FrameLetter({ index }: { index: number }) {
  return String.fromCharCode(65 + index);
}

export default function StoryboardPage() {
  const [script, setScript] = useState('');
  const [hook, setHook] = useState('');
  const [niche, setNiche] = useState<string>('Business');
  const [aspect, setAspect] = useState<AspectRatio>('9:16');

  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();

  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);

  // Per-frame image state: frameId -> { loading, url, error }
  const [frameImages, setFrameImages] = useState<
    Record<string, { loading: boolean; url?: string; error?: string }>
  >({});

  function handleGenerate() {
    if (!script.trim() || !hook.trim()) return;
    setError(null);
    setStoryboard(null);
    setFrameImages({});
    setSelectedFrameIndex(0);
    startGenerate(async () => {
      const result = await generateStoryboard(script, hook, niche, aspect);
      if (result.success && result.data) {
        setStoryboard(result.data);
      } else {
        setError(result.error ?? 'Failed to generate storyboard');
      }
    });
  }

  async function handleGenerateImage(frame: StoryboardFrame) {
    setFrameImages((prev) => ({
      ...prev,
      [frame.id]: { loading: true },
    }));
    const result = await generateFrameImage(frame.imagePrompt, aspect);
    if (result.success && result.url) {
      setFrameImages((prev) => ({
        ...prev,
        [frame.id]: { loading: false, url: result.url },
      }));
    } else {
      setFrameImages((prev) => ({
        ...prev,
        [frame.id]: { loading: false, error: result.error ?? 'Failed' },
      }));
    }
  }

  function handleExport() {
    if (!storyboard) return;
    const blob = new Blob([JSON.stringify(storyboard, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-brief-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedFrame = storyboard?.frames[selectedFrameIndex] ?? null;

  return (
    <div className="flex h-full min-h-screen bg-zinc-950">
      {/* ── Left Config Panel ───────────────────────────────── */}
      <aside className="w-[400px] flex-shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                Storyboard Builder
              </h1>
              <p className="text-xs text-zinc-400 leading-snug">
                Frame-by-frame visual planning with AI image generation for every shot.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Script */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              Script
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste your full video script here..."
              rows={8}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition"
            />
          </div>

          {/* Hook */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Hook
            </label>
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              placeholder="Your opening hook line..."
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition"
            />
          </div>

          {/* Niche */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Niche
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition appearance-none cursor-pointer"
            >
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-zinc-400" />
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              {(['9:16', '16:9', '1:1'] as AspectRatio[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspect(r)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition',
                    aspect === r
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="p-5 border-t border-zinc-800">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !script.trim() || !hook.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition',
              isGenerating || !script.trim() || !hook.trim()
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Storyboard…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Generate Storyboard
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Right Storyboard Display ─────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Loading State */}
        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
            <p className="text-zinc-300 font-medium">Directing your storyboard…</p>
            <p className="text-zinc-500 text-sm">AI is mapping every shot, angle, and cut</p>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && !storyboard && !error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Layers className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No storyboard yet</p>
            <p className="text-zinc-600 text-sm text-center max-w-xs">
              Enter your script and hook in the left panel, then click &ldquo;Generate Storyboard&rdquo; to begin.
            </p>
          </div>
        )}

        {/* Error State */}
        {!isGenerating && error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Info className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-red-400 font-medium">Generation failed</p>
            <p className="text-zinc-500 text-sm">{error}</p>
            <button
              onClick={handleGenerate}
              className="mt-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Storyboard Content */}
        {!isGenerating && storyboard && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Film className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{storyboard.title}</h2>
                  <p className="text-xs text-zinc-500">
                    {storyboard.frames.length} frames · {storyboard.aspect}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition"
              >
                <Download className="w-4 h-4" />
                Production Brief
              </button>
            </div>

            {/* Production Summary */}
            <div className="px-6 py-4 border-b border-zinc-800 flex-shrink-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryCard icon={<Clock className="w-4 h-4 text-indigo-400" />} label="Duration" value={storyboard.totalDuration} />
                <SummaryCard icon={<Eye className="w-4 h-4 text-purple-400" />} label="Color Grade" value={storyboard.colorGrade} />
                <SummaryCard icon={<Music className="w-4 h-4 text-pink-400" />} label="Music Mood" value={storyboard.musicMood} />
                <SummaryCard icon={<Camera className="w-4 h-4 text-emerald-400" />} label="Frames" value={`${storyboard.frames.length} shots`} />
              </div>
              {storyboard.productionNotes && (
                <div className="mt-3 px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60">
                  <p className="text-xs text-zinc-400">
                    <span className="text-zinc-300 font-medium">Production Notes: </span>
                    {storyboard.productionNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Filmstrip */}
            <div className="px-6 py-4 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Film className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filmstrip</span>
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                  {storyboard.frames.map((frame, idx) => {
                    const imgState = frameImages[frame.id];
                    const isSelected = selectedFrameIndex === idx;
                    return (
                      <button
                        key={frame.id}
                        onClick={() => setSelectedFrameIndex(idx)}
                        className={cn(
                          'w-48 flex-shrink-0 rounded-xl border text-left transition overflow-hidden group',
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-zinc-800'
                            : 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-600 hover:bg-zinc-800'
                        )}
                      >
                        {/* Image area */}
                        <div className="relative w-full h-28 bg-zinc-900 flex items-center justify-center overflow-hidden">
                          {imgState?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgState.url}
                              alt={`Frame ${FrameLetter({ index: idx })}`}
                              className="w-full h-full object-cover"
                            />
                          ) : imgState?.loading ? (
                            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                          ) : (
                            <div className="flex flex-col items-center gap-1.5">
                              <Image className="w-6 h-6 text-zinc-600" />
                              <span className="text-[10px] text-zinc-600">No image</span>
                            </div>
                          )}
                          {/* Letter badge */}
                          <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-zinc-950/80 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{FrameLetter({ index: idx })}</span>
                          </div>
                          {/* Hook badge */}
                          {idx === 0 && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white uppercase tracking-wider">
                              HOOK
                            </div>
                          )}
                        </div>

                        {/* Frame info */}
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono text-zinc-500">{frame.timestamp}</span>
                            <span
                              className={cn(
                                'text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide',
                                getShotTypeColor(frame.shotType)
                              )}
                            >
                              {frame.shotType.split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">
                            {frame.scriptLine}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Frame Detail */}
            {selectedFrame && (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* Navigation */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                      {FrameLetter({ index: selectedFrameIndex })}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Frame {selectedFrameIndex + 1} of {storyboard.frames.length}
                      </h3>
                      <p className="text-xs text-zinc-500">{selectedFrame.timestamp} · {selectedFrame.duration}s</p>
                    </div>
                    {selectedFrameIndex === 0 && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600/20 text-red-400 border border-red-600/30 uppercase tracking-wider">
                        HOOK
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedFrameIndex((i) => Math.max(0, i - 1))}
                      disabled={selectedFrameIndex === 0}
                      className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedFrameIndex((i) =>
                          Math.min(storyboard.frames.length - 1, i + 1)
                        )
                      }
                      disabled={selectedFrameIndex === storyboard.frames.length - 1}
                      className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                      <div
                        className={cn(
                          'relative bg-zinc-950 flex items-center justify-center',
                          aspect === '9:16' ? 'aspect-[9/16] max-h-64' : aspect === '16:9' ? 'aspect-video' : 'aspect-square'
                        )}
                        style={{ maxHeight: aspect === '9:16' ? '14rem' : undefined }}
                      >
                        {frameImages[selectedFrame.id]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={frameImages[selectedFrame.id].url}
                            alt={`Frame ${FrameLetter({ index: selectedFrameIndex })}`}
                            className="w-full h-full object-cover"
                          />
                        ) : frameImages[selectedFrame.id]?.loading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            <span className="text-xs text-zinc-400">Generating image…</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 p-6">
                            <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                              <Image className="w-7 h-7 text-zinc-600" />
                            </div>
                            <p className="text-xs text-zinc-500 text-center leading-relaxed">
                              {selectedFrame.imagePrompt.slice(0, 80)}
                              {selectedFrame.imagePrompt.length > 80 ? '…' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 border-t border-zinc-800">
                        {frameImages[selectedFrame.id]?.error && (
                          <p className="text-xs text-red-400 mb-2">{frameImages[selectedFrame.id].error}</p>
                        )}
                        <button
                          onClick={() => handleGenerateImage(selectedFrame)}
                          disabled={frameImages[selectedFrame.id]?.loading}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition',
                            frameImages[selectedFrame.id]?.loading
                              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                              : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-500/50'
                          )}
                        >
                          {frameImages[selectedFrame.id]?.loading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Generating…
                            </>
                          ) : (
                            <>
                              <Image className="w-3.5 h-3.5" />
                              {frameImages[selectedFrame.id]?.url ? 'Regenerate Image' : 'Generate Image'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Shot Info */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Shot Details
                      </h4>
                      <DetailRow label="Shot Type" value={selectedFrame.shotType} highlight={getShotTypeColor(selectedFrame.shotType)} />
                      <DetailRow label="Camera Motion" value={selectedFrame.cameraMotion} />
                      <DetailRow label="Cut Type" value={selectedFrame.cutType} />
                      <DetailRow label="Mood" value={selectedFrame.mood} />
                      <DetailRow label="Color Palette" value={selectedFrame.colorPalette} />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Script Line */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Script Line
                      </h4>
                      <p className="text-sm text-zinc-200 leading-relaxed">{selectedFrame.scriptLine}</p>
                    </div>

                    {/* B-Roll */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> B-Roll
                      </h4>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {selectedFrame.broll || <span className="text-zinc-600 italic">None specified</span>}
                      </p>
                    </div>

                    {/* Text Overlay */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Text Overlay
                      </h4>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {selectedFrame.textOverlay || <span className="text-zinc-600 italic">None</span>}
                      </p>
                    </div>

                    {/* VO Notes */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5" /> VO / Pacing Notes
                      </h4>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {selectedFrame.voNotes || <span className="text-zinc-600 italic">None</span>}
                      </p>
                    </div>

                    {/* Image Prompt */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5" /> Image Prompt
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                        {selectedFrame.imagePrompt}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-medium text-zinc-200 truncate">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-zinc-500 flex-shrink-0">{label}</span>
      <span
        className={cn(
          'text-xs font-medium text-right',
          highlight
            ? cn('px-2 py-0.5 rounded border', highlight)
            : 'text-zinc-300'
        )}
      >
        {value || '—'}
      </span>
    </div>
  );
}
