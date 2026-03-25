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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateThumbnails } from '@/actions/thumbnail';
import type { ThumbnailVariant } from '@/actions/thumbnail';

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

// GeneratedThumbnail kept for fallback gradient display
interface GeneratedThumbnail {
  id: string;
  gradient: string;
  title: string;
}

// ── Static Data ──────────────────────────────────────────────────────────────

const BRAND_COLORS: BrandColor[] = [
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#dc2626', label: 'Red' },
  { hex: '#2563eb', label: 'Blue' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#ea580c', label: 'Orange' },
  { hex: '#db2777', label: 'Pink' },
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
    name: 'Face + Text',
    description: 'Expressive face beside bold headline — highest CTR formula.',
  },
  {
    icon: <RefreshCw className="w-4 h-4 text-blue-400" />,
    name: 'Before / After',
    description: 'Split-screen transformation creates instant curiosity.',
  },
  {
    icon: <Layout className="w-4 h-4 text-emerald-400" />,
    name: 'List (3 Items)',
    description: 'Numbered list implies completeness and actionability.',
  },
  {
    icon: <Eye className="w-4 h-4 text-yellow-400" />,
    name: 'Reaction Face',
    description: 'Strong emotion (shock, joy, disgust) drives clicks.',
  },
  {
    icon: <Zap className="w-4 h-4 text-orange-400" />,
    name: 'Arrow to Subject',
    description: 'Red arrow pointing at the key element draws the eye.',
  },
  {
    icon: <Star className="w-4 h-4 text-pink-400" />,
    name: 'Curiosity Gap',
    description: 'Partial information that forces the viewer to click.',
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

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ThumbnailPage() {
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [style, setStyle] = useState<ThumbnailStyle>('Photo-real');
  const [selectedColor, setSelectedColor] = useState<string>(BRAND_COLORS[0].hex);
  const [includeFace, setIncludeFace] = useState(true);
  const [platform, setPlatform] = useState<Platform>('YouTube');
  const [count, setCount] = useState(4);

  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<ThumbnailVariant[] | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [usedIndex, setUsedIndex] = useState<number | null>(null);

  // kept for fallback gradient display
  const generated: GeneratedThumbnail[] | null = variants
    ? variants.map((v, i) => ({ id: `thumb-${i}`, gradient: MOCK_GRADIENTS[i % MOCK_GRADIENTS.length], title }))
    : null;

  async function handleGenerate() {
    if (!title.trim()) return;
    setIsGenerating(true);
    setVariants(null);
    setGenError(null);
    setUsedIndex(null);
    const result = await generateThumbnails({ title, hook, style, brandColor: selectedColor, includeFace, platform, count });
    if (result.success && result.variants) {
      setVariants(result.variants);
    } else {
      setGenError(result.error ?? 'Generation failed');
    }
    setIsGenerating(false);
  }

  const aspectClass = getAspectClass(platform);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Image className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Thumbnail Generator</h1>
            <p className="text-yellow-100 text-sm">
              AI-powered thumbnail variants with brand colors and proven visual formulas.
            </p>
          </div>
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
        <aside className="w-[380px] flex-shrink-0 space-y-4">
          {/* Video title */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Video Title
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
              Hook / Concept
            </label>
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={3}
              placeholder="Describe the visual concept or emotional hook..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 transition-colors resize-none"
            />
          </div>

          {/* Style select */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ThumbnailStyle)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 transition-colors"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Brand color */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Brand Color
              </span>
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.hex}
                  title={c.label}
                  onClick={() => setSelectedColor(c.hex)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    selectedColor === c.hex
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  {selectedColor === c.hex && (
                    <Check className="w-3.5 h-3.5 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">Selected: {BRAND_COLORS.find((c) => c.hex === selectedColor)?.label}</p>
          </div>

          {/* Include face toggle */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-200">Include Face</p>
                <p className="text-xs text-zinc-500 mt-0.5">Add a person&apos;s face to the thumbnail</p>
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
            <p className="text-xs text-zinc-500 mt-2">
              Aspect ratio: <span className="text-zinc-300 font-mono">{PLATFORMS.find((p) => p.id === platform)?.ratio}</span>
            </p>
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
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
            </div>
          </div>

          {/* Cost + Generate */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Estimated cost</span>
              <span className="text-zinc-300 font-mono">
                ${(count * 0.04).toFixed(2)} ({count} × $0.04)
              </span>
            </div>
            <p className="text-xs text-zinc-600">$0.04 per thumbnail (DALL-E 3 Standard)</p>
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
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate {count} Thumbnail{count > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── Right: Results ── */}
        <main className="flex-1 space-y-6">
          {/* Results grid */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-100">Generated Thumbnails</h2>
              {generated && (
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors border border-zinc-700/50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              )}
            </div>

            <div className={cn(
              'grid gap-4',
              count === 1 ? 'grid-cols-1 max-w-sm' :
              count === 2 ? 'grid-cols-2' :
              'grid-cols-2',
            )}>
              {Array.from({ length: count }, (_, i) => {
                const thumb = generated?.[i];
                const isLoading = isGenerating;

                if (isLoading) {
                  return (
                    <div
                      key={i}
                      className={cn(
                        'rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/40 flex items-center justify-center',
                        aspectClass,
                      )}
                    >
                      <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                        <span className="text-xs">Generating...</span>
                      </div>
                    </div>
                  );
                }

                if (!thumb) {
                  return (
                    <div
                      key={i}
                      className={cn(
                        'rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/20 flex items-center justify-center',
                        aspectClass,
                      )}
                    >
                      <div className="flex flex-col items-center gap-2 text-zinc-600">
                        <Image className="w-8 h-8" />
                        <span className="text-xs">Variant {i + 1}</span>
                      </div>
                    </div>
                  );
                }

                const variant = variants?.[i];

                return (
                  <div key={thumb.id} className="relative group rounded-xl overflow-hidden border border-zinc-700/50">
                    {/* Real DALL-E image or gradient fallback */}
                    {variant?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={variant.url}
                        alt={`Thumbnail variant ${i + 1} — ${variant.formulaName}`}
                        className={cn('w-full object-cover', aspectClass)}
                      />
                    ) : variant?.error ? (
                      <div className={cn('w-full bg-zinc-800 flex flex-col items-center justify-center gap-2', aspectClass)}>
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <span className="text-xs text-red-400 text-center px-3">{variant.error}</span>
                      </div>
                    ) : (
                      <div className={cn('w-full bg-gradient-to-br', thumb.gradient, aspectClass)} />
                    )}

                    {/* Formula badge */}
                    {variant?.formulaName && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {variant.formulaName}
                      </div>
                    )}

                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-white text-xs font-bold line-clamp-2 leading-tight">{thumb.title}</p>
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="flex items-center gap-1.5 bg-white text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <button
                        onClick={() => setUsedIndex(i)}
                        className={cn(
                          'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                          usedIndex === i
                            ? 'bg-emerald-500 text-white'
                            : 'bg-yellow-500 text-zinc-900 hover:bg-yellow-400',
                        )}
                      >
                        {usedIndex === i ? (
                          <><Check className="w-3.5 h-3.5" /> Using This</>
                        ) : (
                          <>Use This</>
                        )}
                      </button>
                    </div>

                    {/* Used badge */}
                    {usedIndex === i && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Selected
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Thumbnail Formulas ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-400" />
              <h3 className="text-base font-bold text-zinc-100">Proven Thumbnail Formulas</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {FORMULAS.map((formula) => (
                <div
                  key={formula.name}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center">
                      {formula.icon}
                    </div>
                    <span className="text-xs font-semibold text-zinc-200">{formula.name}</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{formula.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
