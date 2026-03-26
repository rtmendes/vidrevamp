'use client';

import { useState } from 'react';
import {
  Image,
  Download,
  Zap,
  Loader2,
  Check,
  RefreshCw,
  Palette,
  Monitor,
  Smartphone,
  Square,
  Eye,
  Star,
  Camera,
  Layout,
  AlertCircle,
  ChevronDown,
  Link,
  BarChart2,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateThumbnails, analyzeThumbnailCTR } from '@/actions/thumbnail';
import type { ThumbnailVariant, CTRScore } from '@/actions/thumbnail';
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL_ID, IMAGE_BADGE_COLORS, type ImageModel } from '@/lib/image-models';

// ── Types ────────────────────────────────────────────────────────────────────

type ThumbnailStyle = 'Photo-real' | 'Illustrated' | 'Bold Text' | 'Minimalist' | 'High Contrast' | 'Cinematic';
type Platform = 'YouTube' | 'TikTok' | 'Instagram';

interface BrandColor {
  hex: string;
  label: string;
}

interface ThumbnailFormula {
  icon: React.ReactNode;
  name: string;
  description: string;
}

// ── Static Data ──────────────────────────────────────────────────────────────

const BRAND_COLORS: BrandColor[] = [
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#dc2626', label: 'Red' },
  { hex: '#2563eb', label: 'Blue' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#ea580c', label: 'Orange' },
  { hex: '#db2777', label: 'Pink' },
  { hex: '#eab308', label: 'Yellow' },
  { hex: '#06b6d4', label: 'Cyan' },
];

const STYLES: ThumbnailStyle[] = [
  'Photo-real',
  'Illustrated',
  'Bold Text',
  'Minimalist',
  'High Contrast',
  'Cinematic',
];

const PLATFORMS: { id: Platform; icon: React.ReactNode; ratio: string }[] = [
  { id: 'YouTube',   icon: <Monitor className="w-3.5 h-3.5" />,   ratio: '16:9' },
  { id: 'TikTok',    icon: <Smartphone className="w-3.5 h-3.5" />, ratio: '9:16' },
  { id: 'Instagram', icon: <Square className="w-3.5 h-3.5" />,     ratio: '1:1' },
];

const FORMULAS: ThumbnailFormula[] = [
  {
    icon: <Camera className="w-4 h-4 text-violet-400" />,
    name: 'Face + Emotion',
    description: 'Expressive face beside bold headline — highest CTR formula.',
  },
  {
    icon: <RefreshCw className="w-4 h-4 text-blue-400" />,
    name: 'Before / After',
    description: 'Split-screen transformation creates instant curiosity.',
  },
  {
    icon: <Layout className="w-4 h-4 text-emerald-400" />,
    name: 'Bold Headline',
    description: 'Strong typography on clean background — great for authority.',
  },
  {
    icon: <Eye className="w-4 h-4 text-yellow-400" />,
    name: 'Curiosity Gap',
    description: 'Partial reveal forces the viewer to click to find out.',
  },
  {
    icon: <Zap className="w-4 h-4 text-orange-400" />,
    name: 'Arrow to Subject',
    description: 'Red arrow pointing at the key element draws the eye.',
  },
  {
    icon: <Star className="w-4 h-4 text-pink-400" />,
    name: 'Reaction Face',
    description: 'Strong emotion (shock, joy, disgust) drives clicks.',
  },
];

const MOCK_GRADIENTS = [
  'from-violet-600 via-purple-600 to-pink-600',
  'from-blue-600 via-cyan-500 to-teal-500',
  'from-orange-500 via-amber-500 to-yellow-400',
  'from-emerald-500 via-teal-500 to-cyan-500',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAspectClass(platform: Platform): string {
  if (platform === 'YouTube') return 'aspect-video';
  if (platform === 'TikTok') return 'aspect-[9/16]';
  return 'aspect-square';
}

function scoreColor(v: number): string {
  if (v >= 80) return 'text-emerald-400';
  if (v >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className={cn('font-bold', scoreColor(value))}>{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Image Model Picker ────────────────────────────────────────────────────────

function ImageModelPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = IMAGE_MODELS.find((m) => m.id === selectedId) ?? IMAGE_MODELS[0];

  const tiers: ImageModel['tier'][] = ['power', 'balanced', 'fast'];
  const tierLabels = { power: 'Max Quality', balanced: 'Balanced', fast: 'Fast / Draft' };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-800 border border-zinc-700/60 rounded-xl text-sm hover:border-zinc-600 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0', IMAGE_BADGE_COLORS[selected.badge])}>
            {selected.provider}
          </span>
          <span className="text-zinc-300 font-medium truncate">{selected.label}</span>
          {selected.free && (
            <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">FREE</span>
          )}
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform shrink-0 ml-2', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl z-30 overflow-hidden max-h-80 overflow-y-auto">
          {tiers.map((tier) => {
            const models = IMAGE_MODELS.filter((m) => m.tier === tier);
            return (
              <div key={tier}>
                <div className="px-3 py-1.5 bg-zinc-900/60 sticky top-0">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{tierLabels[tier]}</span>
                </div>
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { onSelect(m.id); setOpen(false); }}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-zinc-800/60 transition-colors',
                      selectedId === m.id && 'bg-yellow-500/10',
                    )}
                  >
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5', IMAGE_BADGE_COLORS[m.badge])}>
                      {m.provider.split(' ')[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-medium text-zinc-200">{m.label}</span>
                        {m.free && (
                          <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">FREE</span>
                        )}
                        <span className="text-[10px] text-zinc-500 ml-auto">${m.cost_per_image.toFixed(3)}/img</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{m.best_for}</p>
                    </div>
                    {selectedId === m.id && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ThumbnailPage() {
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [style, setStyle] = useState<ThumbnailStyle>('Photo-real');
  const [selectedColor, setSelectedColor] = useState<string>(BRAND_COLORS[0].hex);
  const [includeFace, setIncludeFace] = useState(true);
  const [platform, setPlatform] = useState<Platform>('YouTube');
  const [count, setCount] = useState(4);
  const [imageModelId, setImageModelId] = useState(DEFAULT_IMAGE_MODEL_ID);

  // Inspiration URL (recreate from competitor thumbnail)
  const [inspirationUrl, setInspirationUrl] = useState('');
  const [showInspirationPanel, setShowInspirationPanel] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<ThumbnailVariant[] | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [usedIndex, setUsedIndex] = useState<number | null>(null);

  // CTR Score
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'score' | 'formulas'>('thumbnails');
  const [ctrScore, setCtrScore] = useState<CTRScore | null>(null);
  const [scoringIndex, setScoringIndex] = useState<number | null>(null);

  const imageModel = IMAGE_MODELS.find((m) => m.id === imageModelId) ?? IMAGE_MODELS[0];

  // Extract video ID from YouTube URL for thumbnail inspiration
  function extractYTVideoId(url: string): string | null {
    const m = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return m?.[1] ?? null;
  }

  const inspirationVideoId = inspirationUrl ? extractYTVideoId(inspirationUrl) : null;
  const inspirationThumbUrl = inspirationVideoId
    ? `https://img.youtube.com/vi/${inspirationVideoId}/maxresdefault.jpg`
    : null;

  async function handleGenerate() {
    if (!title.trim()) return;
    setIsGenerating(true);
    setVariants(null);
    setGenError(null);
    setUsedIndex(null);
    setCtrScore(null);
    setActiveTab('thumbnails');

    const inspirationNote = inspirationVideoId
      ? `Inspired by YouTube video thumbnail (video ID: ${inspirationVideoId}) — recreate a similar composition, energy, and layout but with different content`
      : undefined;

    const result = await generateThumbnails({
      title, hook, style, brandColor: selectedColor, includeFace, platform, count,
      imageModelId,
      inspirationNote,
    });

    if (result.success && result.variants) {
      setVariants(result.variants);
    } else {
      setGenError(result.error ?? 'Generation failed');
    }
    setIsGenerating(false);
  }

  async function handleScoreVariant(index: number) {
    if (!variants) return;
    setScoringIndex(index);
    setActiveTab('score');
    const variant = variants[index];
    const result = await analyzeThumbnailCTR({
      title,
      formulaName: variant.formulaName,
      style,
      includeFace,
      platform,
    });
    if (result.success && result.score) {
      setCtrScore(result.score);
    }
    setScoringIndex(null);
  }

  async function handleDownload(url: string, index: number) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `thumbnail-v${index + 1}-${title.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}.jpg`;
      a.click();
    } catch {
      window.open(url, '_blank');
    }
  }

  const aspectClass = getAspectClass(platform);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
          <Image className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-zinc-100 leading-none">Thumbnail Creator</h1>
          <p className="text-[12px] text-zinc-500 mt-0.5">AI-generated · multiple models · CTR scoring</p>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {genError && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {genError}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex gap-6 p-6">

        {/* ── Left Config Panel ── */}
        <aside className="w-[360px] flex-shrink-0 space-y-3">

          {/* Video title */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Video Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. I Made $10k in 30 Days With AI..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 transition-colors"
            />
          </div>

          {/* Hook / concept */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Visual Concept / Hook
            </label>
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={2}
              placeholder="Describe the scene, emotion, or visual idea..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 transition-colors resize-none"
            />
          </div>

          {/* Recreate from URL */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <button
              onClick={() => setShowInspirationPanel((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wide"
            >
              <span className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-blue-400" />
                Recreate from URL
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showInspirationPanel && 'rotate-180')} />
            </button>
            {showInspirationPanel && (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={inspirationUrl}
                  onChange={(e) => setInspirationUrl(e.target.value)}
                  placeholder="Paste a YouTube video URL to clone its thumbnail style..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
                {inspirationThumbUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inspirationThumbUrl} alt="Inspiration thumbnail" className="w-full aspect-video object-cover" />
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Style Reference
                    </div>
                    <button
                      onClick={() => { setInspirationUrl(''); }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-zinc-600">
                  The AI will recreate a similar composition and energy with your content.
                </p>
              </div>
            )}
          </div>

          {/* Image Model Picker */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Image Model
              </span>
            </label>
            <ImageModelPicker selectedId={imageModelId} onSelect={setImageModelId} />
            <p className="text-[11px] text-zinc-600 mt-2">{imageModel.strengths}</p>
          </div>

          {/* Style select */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Art Style
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={cn(
                    'px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-center',
                    style === s
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                      : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Brand color */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Brand Color
              </span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => setSelectedColor(c.hex)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center',
                    selectedColor === c.hex
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {selectedColor === c.hex && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Include face toggle */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-200">Include Face</p>
                <p className="text-xs text-zinc-500 mt-0.5">Add an expressive person to the thumbnail</p>
              </div>
              <button
                onClick={() => setIncludeFace((v) => !v)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  includeFace ? 'bg-yellow-500' : 'bg-zinc-600',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
                    includeFace ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
          </div>

          {/* Platform tabs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              Platform
            </label>
            <div className="flex gap-1 bg-zinc-800 p-1 rounded-xl">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-all',
                    platform === p.id
                      ? 'bg-yellow-500 text-zinc-900 shadow'
                      : 'text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  {p.icon}
                  <span>{p.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Count slider */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                Variants
              </label>
              <span className="text-sm font-bold text-yellow-400">{count}</span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>1</span><span>2</span><span>3</span><span>4</span>
            </div>
          </div>

          {/* Cost + Generate */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Estimated cost</span>
              <span className="text-zinc-300 font-mono">
                ${(count * imageModel.cost_per_image).toFixed(3)} ({count} × ${imageModel.cost_per_image.toFixed(3)})
              </span>
            </div>
            {imageModel.free && (
              <p className="text-xs text-emerald-400 font-medium">Free tier model — rate limits apply</p>
            )}
            <button
              onClick={handleGenerate}
              disabled={!title.trim() || isGenerating}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
                title.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-zinc-900 shadow-lg shadow-orange-500/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
              )}
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
              ) : (
                <><Zap className="w-4 h-4" />Generate {count} Thumbnail{count > 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        </aside>

        {/* ── Right: Results ── */}
        <main className="flex-1 min-w-0 space-y-4">

          {/* Tab bar */}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            {[
              { id: 'thumbnails' as const, label: 'Thumbnails', icon: <Image className="w-3.5 h-3.5" /> },
              { id: 'score' as const, label: 'CTR Score', icon: <BarChart2 className="w-3.5 h-3.5" /> },
              { id: 'formulas' as const, label: 'Formulas', icon: <Star className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-all',
                  activeTab === tab.id
                    ? 'bg-yellow-500 text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Thumbnails Tab ── */}
          {activeTab === 'thumbnails' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-zinc-100">Generated Thumbnails</h2>
                {variants && (
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors border border-zinc-700/50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                )}
              </div>

              <div className={cn('grid gap-4', count <= 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2')}>
                {Array.from({ length: count }, (_, i) => {
                  const variant = variants?.[i];

                  if (isGenerating) {
                    return (
                      <div key={i} className={cn('rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/40 flex items-center justify-center', aspectClass)}>
                        <div className="flex flex-col items-center gap-2 text-zinc-500">
                          <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                          <span className="text-xs">Generating...</span>
                        </div>
                      </div>
                    );
                  }

                  if (!variant) {
                    return (
                      <div key={i} className={cn('rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/20 flex items-center justify-center', aspectClass)}>
                        <div className="flex flex-col items-center gap-2 text-zinc-600">
                          <Image className="w-8 h-8" />
                          <span className="text-xs">Variant {i + 1}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={variant.index} className="relative group rounded-xl overflow-hidden border border-zinc-700/50">
                      {variant.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={variant.url}
                          alt={`Thumbnail variant ${i + 1} — ${variant.formulaName}`}
                          className={cn('w-full object-cover', aspectClass)}
                        />
                      ) : variant.error ? (
                        <div className={cn('w-full bg-zinc-800 flex flex-col items-center justify-center gap-2', aspectClass)}>
                          <AlertCircle className="w-6 h-6 text-red-400" />
                          <span className="text-xs text-red-400 text-center px-3">{variant.error}</span>
                        </div>
                      ) : (
                        <div className={cn('w-full bg-gradient-to-br', MOCK_GRADIENTS[i % MOCK_GRADIENTS.length], aspectClass)} />
                      )}

                      {/* Formula badge */}
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {variant.formulaName}
                      </div>

                      {/* Used badge */}
                      {usedIndex === i && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />Selected
                        </div>
                      )}

                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-2">
                          {variant.url && (
                            <button
                              onClick={() => handleDownload(variant.url!, i)}
                              className="flex items-center gap-1.5 bg-white text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />Download
                            </button>
                          )}
                          <button
                            onClick={() => setUsedIndex(i)}
                            className={cn(
                              'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                              usedIndex === i
                                ? 'bg-emerald-500 text-white'
                                : 'bg-yellow-500 text-zinc-900 hover:bg-yellow-400',
                            )}
                          >
                            {usedIndex === i ? <><Check className="w-3.5 h-3.5" />Using</> : <>Use This</>}
                          </button>
                        </div>
                        <button
                          onClick={() => handleScoreVariant(i)}
                          disabled={scoringIndex !== null}
                          className="flex items-center gap-1.5 bg-zinc-800/80 text-zinc-200 text-xs font-medium px-3 py-1 rounded-lg border border-zinc-600/50 hover:bg-zinc-700/80 transition-colors"
                        >
                          {scoringIndex === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart2 className="w-3 h-3 text-yellow-400" />}
                          CTR Score
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CTR Score Tab ── */}
          {activeTab === 'score' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-yellow-400" />
                <h3 className="text-base font-bold text-zinc-100">CTR Score Analysis</h3>
              </div>

              {!variants && !ctrScore && (
                <div className="flex flex-col items-center py-12 text-center">
                  <BarChart2 className="w-10 h-10 text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">Generate thumbnails first, then hover one and click &ldquo;CTR Score&rdquo;</p>
                </div>
              )}

              {scoringIndex !== null && !ctrScore && (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                  <p className="text-zinc-400 text-sm">Analyzing CTR potential...</p>
                </div>
              )}

              {ctrScore && (
                <div className="space-y-6">
                  {/* Overall score */}
                  <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                    <div className={cn('text-5xl font-black', scoreColor(ctrScore.overall))}>
                      {ctrScore.overall}
                    </div>
                    <div>
                      <p className="text-zinc-300 font-semibold">Overall CTR Score</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {ctrScore.overall >= 80 ? 'Excellent — high click probability' :
                         ctrScore.overall >= 60 ? 'Good — solid click potential' :
                         'Needs improvement — apply the tips below'}
                      </p>
                    </div>
                  </div>

                  {/* 5-axis breakdown */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Breakdown</p>
                    <ScoreBar value={ctrScore.virality} label="Virality" />
                    <ScoreBar value={ctrScore.clarity} label="Clarity" />
                    <ScoreBar value={ctrScore.curiosity} label="Curiosity Gap" />
                    <ScoreBar value={ctrScore.emotion} label="Emotional Impact" />
                    <ScoreBar value={ctrScore.design} label="Design Quality" />
                  </div>

                  {/* Tips */}
                  {ctrScore.tips.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Improvement Tips</p>
                      {ctrScore.tips.map((tip, i) => (
                        <div key={i} className="flex gap-2.5 text-sm text-zinc-400 bg-zinc-800/40 rounded-lg px-3 py-2.5">
                          <span className="text-yellow-500 font-bold shrink-0">{i + 1}.</span>
                          {tip}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setCtrScore(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Clear score
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Formulas Tab ── */}
          {activeTab === 'formulas' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-400" />
                <h3 className="text-base font-bold text-zinc-100">Proven Thumbnail Formulas</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {FORMULAS.map((formula) => (
                  <div
                    key={formula.name}
                    className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 hover:border-zinc-600 transition-colors cursor-pointer"
                    onClick={() => setActiveTab('thumbnails')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center">
                        {formula.icon}
                      </div>
                      <span className="text-xs font-semibold text-zinc-200">{formula.name}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{formula.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs font-semibold text-blue-300 mb-2">Pro Tips</p>
                <ul className="space-y-1.5 text-xs text-blue-200/70">
                  <li>• <strong>Face + Emotion</strong> is the highest CTR formula on YouTube — use it for most content</li>
                  <li>• <strong>Curiosity Gap</strong> works best for mystery/reveal content (results, transformations)</li>
                  <li>• <strong>Bold Headline</strong> works for educational/authority content where text is the hook</li>
                  <li>• Generate 4 variants and use CTR Score to pick the winner</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
