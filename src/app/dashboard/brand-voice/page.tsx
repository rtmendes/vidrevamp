'use client';

import { useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Eye,
  MessageSquare,
  Palette,
  Shield,
  Heart,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateBrandOS } from '@/actions/brand-voice';
import type { BrandOS, MessagingPillar, ToneAttribute } from '@/actions/brand-voice';

// ── Helpers ───────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function SectionCard({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="font-bold text-zinc-100 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function PillarCard({ pillar, index }: { pillar: MessagingPillar; index: number }) {
  const colors = [
    { bg: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300' },
    { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
    { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
    { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300' },
  ];
  const c = colors[index % colors.length];

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', c.bg)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-black uppercase tracking-widest', c.text)}>Pillar {index + 1}</span>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', c.badge)}>{pillar.name}</span>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{pillar.description}</p>
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Hook Formulas</p>
        <div className="space-y-1.5">
          {pillar.hookFormulas.map((hook, i) => (
            <div key={i} className="flex items-start gap-2 bg-zinc-900/60 rounded-lg px-3 py-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-zinc-200 flex-1">{hook}</span>
              <CopyButton text={hook} />
            </div>
          ))}
        </div>
      </div>
      {pillar.avoidPhrases.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Avoid</p>
          <div className="flex flex-wrap gap-1.5">
            {pillar.avoidPhrases.map((phrase, i) => (
              <span key={i} className="text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                {phrase}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToneCard({ attr }: { attr: ToneAttribute }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-violet-500/20 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <span className="text-sm font-bold text-zinc-100">{attr.trait}</span>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed">{attr.description}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wide mb-1">Do</p>
          <p className="text-xs text-zinc-300 leading-relaxed">{attr.doExample}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-wide mb-1">Don&apos;t</p>
          <p className="text-xs text-zinc-300 leading-relaxed">{attr.dontExample}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BrandVoicePage() {
  // Form state
  const [brandName, setBrandName] = useState('');
  const [niche, setNiche] = useState('Business');
  const [targetAudience, setTargetAudience] = useState('');
  const [personalityWords, setPersonalityWords] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [uniqueAdvantage, setUniqueAdvantage] = useState('');
  const [platforms, setPlatforms] = useState('YouTube Shorts, TikTok, Instagram Reels');
  const [sampleHook, setSampleHook] = useState('');

  // Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [brandOS, setBrandOS] = useState<BrandOS | null>(null);
  const [error, setError] = useState<string | null>(null);

  const NICHES = ['Business', 'Finance', 'Fitness', 'Health', 'E-Commerce', 'Tech & AI', 'Education', 'Real Estate', 'SaaS', 'Coaching', 'Lifestyle'];

  const canGenerate = brandName.trim() && niche && targetAudience.trim() && personalityWords.trim();

  async function handleGenerate() {
    if (!canGenerate) return;
    setIsGenerating(true);
    setBrandOS(null);
    setError(null);
    const result = await generateBrandOS({
      brandName, niche, targetAudience,
      brandPersonalityWords: personalityWords,
      topCompetitors: competitors,
      uniqueAdvantage,
      contentPlatforms: platforms,
      existingHook: sampleHook,
    });
    if (result.success && result.data) {
      setBrandOS(result.data);
    } else {
      setError(result.error ?? 'Generation failed');
    }
    setIsGenerating(false);
  }

  function exportBrandOS() {
    if (!brandOS) return;
    const blob = new Blob([JSON.stringify(brandOS, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandOS.brandName.replace(/\s+/g, '-')}-brand-os.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-zinc-100 leading-none">Brand Voice AI</h1>
          <p className="text-[12px] text-zinc-500 mt-0.5">Brand OS — voice, messaging pillars, tone rules &amp; hook formulas</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-6 p-6">
        {/* Left config panel */}
        <aside className="w-[360px] flex-shrink-0 space-y-4">
          {/* Brand Name */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Brand Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. EduLaunch, FitPulse, WealthEdge..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </div>

          {/* Niche */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
            >
              {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Target Audience */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Target Audience</label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              rows={3}
              placeholder="e.g. 25-40 year old professionals who want to escape their 9-5 and build an online income..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors resize-none"
            />
          </div>

          {/* Brand Personality */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Brand Personality</label>
            <input
              type="text"
              value={personalityWords}
              onChange={(e) => setPersonalityWords(e.target.value)}
              placeholder="e.g. bold, direct, no-fluff, data-driven, inspiring"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
            <p className="text-xs text-zinc-500 mt-1.5">Comma-separated personality traits</p>
          </div>

          {/* Competitors */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Top Competitors</label>
            <input
              type="text"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="e.g. Ali Abdaal, Graham Stephan, Alex Hormozi"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </div>

          {/* Unique Advantage */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Your Unique Advantage</label>
            <textarea
              value={uniqueAdvantage}
              onChange={(e) => setUniqueAdvantage(e.target.value)}
              rows={2}
              placeholder="What makes you different? e.g. We show real P&L, no theory only results..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors resize-none"
            />
          </div>

          {/* Platforms */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Content Platforms</label>
            <input
              type="text"
              value={platforms}
              onChange={(e) => setPlatforms(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
          </div>

          {/* Sample Hook (optional) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
              Sample Hook <span className="text-zinc-600 normal-case font-normal">(optional)</span>
            </label>
            <p className="text-xs text-zinc-600 mb-2">Paste an existing hook to match your style</p>
            <textarea
              value={sampleHook}
              onChange={(e) => setSampleHook(e.target.value)}
              rows={2}
              placeholder="e.g. I went from $0 to $50k/month in 12 months — here's everything I did..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors resize-none"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all',
              canGenerate && !isGenerating
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
            )}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Building Brand OS...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Brand OS</>
            )}
          </button>
        </aside>

        {/* Right: Results */}
        <main className="flex-1 space-y-4 min-w-0">
          {!brandOS && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-300 mb-1">Brand OS not built yet</h3>
              <p className="text-sm text-zinc-500 max-w-sm">
                Fill in your brand details on the left and click Generate. Your complete Brand OS will appear here — ready to copy and use.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-zinc-300">Building your Brand OS...</p>
                <p className="text-xs text-zinc-500 mt-1">Analyzing voice, crafting pillars, defining tone rules</p>
              </div>
            </div>
          )}

          {brandOS && (
            <>
              {/* Top bar */}
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">{brandOS.brandName}</h2>
                  <p className="text-sm text-violet-400 italic mt-0.5">&ldquo;{brandOS.tagline}&rdquo;</p>
                </div>
                <button
                  onClick={exportBrandOS}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              </div>

              {/* Brand Foundation */}
              <SectionCard title="Brand Foundation" icon={<Target className="w-4 h-4 text-violet-400" />}>
                <div className="grid grid-cols-1 gap-3 mt-1">
                  <div className="bg-zinc-800/50 rounded-xl p-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wide mb-1">Personality</p>
                    <p className="text-sm text-zinc-200 leading-relaxed">{brandOS.brandPersonality}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wide mb-1">Target Audience</p>
                      <p className="text-xs text-zinc-300 leading-relaxed">{brandOS.targetAudience}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wide mb-1">Unique Value Prop</p>
                      <p className="text-xs text-zinc-300 leading-relaxed">{brandOS.uniqueValueProp}</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Signature Hook Formula */}
              <SectionCard title="Signature Hook Formula" icon={<Zap className="w-4 h-4 text-yellow-400" />}>
                <div className="mt-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-200 font-medium leading-relaxed">{brandOS.signatureHookFormula}</p>
                  </div>
                  <CopyButton text={brandOS.signatureHookFormula} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {brandOS.keyEmotions.map((emotion, i) => (
                    <span key={i} className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-pink-400" />
                      {emotion}
                    </span>
                  ))}
                </div>
              </SectionCard>

              {/* Messaging Pillars */}
              <SectionCard title="Messaging Pillars" icon={<TrendingUp className="w-4 h-4 text-blue-400" />}>
                <div className="space-y-3 mt-1">
                  {brandOS.messagingPillars.map((pillar, i) => (
                    <PillarCard key={i} pillar={pillar} index={i} />
                  ))}
                </div>
              </SectionCard>

              {/* Tone of Voice */}
              <SectionCard title="Tone of Voice" icon={<MessageSquare className="w-4 h-4 text-emerald-400" />}>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {brandOS.toneAttributes.map((attr, i) => (
                    <ToneCard key={i} attr={attr} />
                  ))}
                </div>
              </SectionCard>

              {/* Visual Identity */}
              <SectionCard title="Visual Identity" icon={<Palette className="w-4 h-4 text-pink-400" />}>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {Object.entries(brandOS.visualIdentity).map(([key, val]) => (
                    <div key={key} className="bg-zinc-800/50 rounded-xl p-3">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wide mb-1">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed">{val}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Content Rules */}
              <SectionCard title="Content Rules" icon={<Shield className="w-4 h-4 text-orange-400" />}>
                <div className="space-y-2 mt-1">
                  {brandOS.contentRules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-3 bg-zinc-800/50 rounded-xl px-3 py-2.5">
                      <div className="w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-orange-400">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">{rule.rule}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{rule.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Competitor Differentiation + Forbidden Topics */}
              <SectionCard title="Competitive Positioning" icon={<Eye className="w-4 h-4 text-red-400" />} defaultOpen={false}>
                <div className="space-y-4 mt-1">
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">How We&apos;re Different</p>
                    <div className="space-y-2">
                      {brandOS.competitorDifferentiators.map((diff, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          {diff}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Forbidden Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {brandOS.forbiddenTopics.map((topic, i) => (
                        <span key={i} className="text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                          ✕ {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
