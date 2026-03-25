'use client';

import { useState, useTransition } from 'react';
import {
  Zap,
  BarChart3,
  Shuffle,
  GitCompare,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Eye,
  Target,
  Layers,
  Sparkles,
  BookMarked,
  Copy,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { analyzeHook, generateHookVariants, compareHooks } from '@/actions/hook-intelligence';
import type { HookAnalysis, HookVariant, HookComparison } from '@/actions/hook-intelligence';
import { cn } from '@/lib/utils';

const TOOL_TABS = ['Analyzer', 'Generator', 'A/B Compare'] as const;
type ToolTab = typeof TOOL_TABS[number];

// Colour helpers
function scoreColor(score: number) {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-yellow-400';
  return 'text-red-400';
}
function scoreBg(score: number) {
  if (score >= 8) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 6) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-red-500/10 border-red-500/20';
}
function scoreBar(score: number) {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function HookLabPage() {
  const [activeTab, setActiveTab] = useState<ToolTab>('Analyzer');

  // ── Analyzer state ───────────────────────────────────────
  const [spokenHook, setSpokenHook] = useState('');
  const [textHook, setTextHook] = useState('');
  const [visualDesc, setVisualDesc] = useState('');
  const [niche, setNiche] = useState('');
  const [analysis, setAnalysis] = useState<HookAnalysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isAnalyzing, startAnalyze] = useTransition();

  // ── Generator state ──────────────────────────────────────
  const [genSubject, setGenSubject] = useState('');
  const [genAngle, setGenAngle] = useState('');
  const [genNiche, setGenNiche] = useState('');
  const [genAudience, setGenAudience] = useState('');
  const [variants, setVariants] = useState<HookVariant[] | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [copiedVariant, setCopiedVariant] = useState<number | null>(null);

  // ── A/B Compare state ─────────────────────────────────────
  const [hookA, setHookA] = useState('');
  const [hookB, setHookB] = useState('');
  const [compareNiche, setCompareNiche] = useState('');
  const [comparison, setComparison] = useState<HookComparison | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [isComparing, startCompare] = useTransition();

  function handleAnalyze() {
    if (!spokenHook.trim()) return;
    setAnalyzeError(null);
    startAnalyze(async () => {
      const result = await analyzeHook(spokenHook, textHook, visualDesc, undefined, niche);
      if (result.success && result.data) setAnalysis(result.data);
      else setAnalyzeError(result.error ?? 'Analysis failed');
    });
  }

  function handleGenerate() {
    if (!genSubject.trim() || !genAngle.trim()) return;
    setGenError(null);
    startGenerate(async () => {
      const result = await generateHookVariants(genSubject, genAngle, genNiche || 'General', genAudience || 'General audience');
      if (result.success && result.data) setVariants(result.data);
      else setGenError(result.error ?? 'Generation failed');
    });
  }

  function handleCompare() {
    if (!hookA.trim() || !hookB.trim()) return;
    setCompareError(null);
    startCompare(async () => {
      const result = await compareHooks(hookA, hookB, compareNiche);
      if (result.success && result.data) setComparison(result.data);
      else setCompareError(result.error ?? 'Comparison failed');
    });
  }

  function copyVariant(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedVariant(idx);
    setTimeout(() => setCopiedVariant(null), 1500);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Hook Lab</h1>
          </div>
          <p className="text-sm text-zinc-500">
            AI-powered hook intelligence using the Kallaway 4-Dimension Framework.
          </p>
        </div>
        {/* Framework pill */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <span className="text-[11px] text-zinc-400 font-medium">Kallaway Framework</span>
        </div>
      </div>

      {/* Framework legend */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { icon: Target, label: 'On-Target Clarity', desc: 'Topic clear in <3 sec?', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: TrendingUp, label: 'Contrast Strength', desc: 'Baseline vs reality gap', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { icon: Layers, label: 'Component Alignment', desc: 'Text/visual/audio aligned?', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { icon: Eye, label: 'Curiosity Loop', desc: 'Open unanswered question?', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map((dim) => (
          <div key={dim.label} className={cn('border rounded-xl p-3', dim.bg)}>
            <dim.icon className={cn('w-4 h-4 mb-1.5', dim.color)} />
            <p className="text-[11px] font-semibold text-zinc-300 leading-tight">{dim.label}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{dim.desc}</p>
          </div>
        ))}
      </div>

      {/* Tool tabs */}
      <div className="flex gap-1 mb-5 bg-zinc-900 border border-zinc-800/60 rounded-xl p-1 w-fit">
        {TOOL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all',
              activeTab === tab
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {tab === 'Analyzer' && <BarChart3 className="w-3.5 h-3.5" />}
            {tab === 'Generator' && <Sparkles className="w-3.5 h-3.5" />}
            {tab === 'A/B Compare' && <GitCompare className="w-3.5 h-3.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* ─── ANALYZER TAB ─────────────────────────────────────── */}
      {activeTab === 'Analyzer' && (
        <div className="grid grid-cols-[1fr_1.2fr] gap-5">
          {/* Input */}
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Spoken Hook <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Paste your spoken hook here...&#10;&#10;Ex: Stop doing what everyone else is doing. Most people never build wealth because they optimize for the wrong metric."
                  value={spokenHook}
                  onChange={(e) => setSpokenHook(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Text Hook (on-screen caption)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Most People Get This Wrong"
                  value={textHook}
                  onChange={(e) => setTextHook(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Visual Hook Description
                </label>
                <input
                  type="text"
                  placeholder="Ex: Creator A-roll tight frame, gesturing at camera"
                  value={visualDesc}
                  onChange={(e) => setVisualDesc(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Your Niche
                </label>
                <input
                  type="text"
                  placeholder="Ex: Business / Fitness / Personal Finance"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                />
              </div>

              {analyzeError && (
                <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-300">{analyzeError}</p>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!spokenHook.trim() || isAnalyzing}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                  !spokenHook.trim() || isAnalyzing
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg shadow-orange-500/20'
                )}
              >
                {isAnalyzing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Hook...</>
                  : <><BarChart3 className="w-4 h-4" /> Analyze Hook</>
                }
              </button>
            </div>

            {/* Hook structures reference */}
            <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                8 Kallaway Hook Structures
              </p>
              <div className="space-y-1.5">
                {[
                  'Fortuneteller', 'Experimentation', 'Educational/Tutorial',
                  'Secret Reveal', 'Contrarian/Negative', 'Comparison', 'Question', 'Raw Shock'
                ].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-500" />
                    <span className="text-[11px] text-zinc-500">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis output */}
          <div>
            {analysis ? (
              <div className="space-y-4">
                {/* Overall score */}
                <div className={cn('border rounded-2xl p-5', scoreBg(analysis.overallScore))}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Hook Score
                      </p>
                      <div className="flex items-end gap-2">
                        <span className={cn('text-5xl font-black', scoreColor(analysis.overallScore))}>
                          {analysis.overallScore.toFixed(1)}
                        </span>
                        <span className="text-zinc-500 text-lg mb-1">/10</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border',
                        analysis.overallScore >= 8
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : analysis.overallScore >= 6
                          ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      )}>
                        {analysis.overallScore >= 8
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : analysis.overallScore >= 6
                          ? <Info className="w-3.5 h-3.5" />
                          : <XCircle className="w-3.5 h-3.5" />
                        }
                        {analysis.verdict}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Structure: {analysis.hookStructure}
                      </p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', scoreBar(analysis.overallScore))}
                      style={{ width: `${(analysis.overallScore / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 4 dimension scores */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      key: 'onTargetClarity',
                      label: 'On-Target Clarity',
                      icon: Target,
                      color: 'text-blue-400',
                      data: analysis.dimensions.onTargetClarity,
                    },
                    {
                      key: 'contrastStrength',
                      label: 'Contrast Strength',
                      icon: TrendingUp,
                      color: 'text-purple-400',
                      data: analysis.dimensions.contrastStrength,
                    },
                    {
                      key: 'componentAlignment',
                      label: 'Component Alignment',
                      icon: Layers,
                      color: 'text-green-400',
                      data: analysis.dimensions.componentAlignment,
                    },
                    {
                      key: 'curiosityLoop',
                      label: 'Curiosity Loop',
                      icon: Eye,
                      color: 'text-orange-400',
                      data: analysis.dimensions.curiosityLoop,
                    },
                  ].map((dim) => (
                    <div key={dim.key} className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <dim.icon className={cn('w-3.5 h-3.5', dim.color)} />
                          <span className="text-[11px] font-semibold text-zinc-400">{dim.label}</span>
                        </div>
                        <span className={cn('text-lg font-black', scoreColor(dim.data.score))}>
                          {dim.data.score}
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-700 rounded-full mb-2 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', scoreBar(dim.data.score))}
                          style={{ width: `${(dim.data.score / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{dim.data.feedback}</p>
                    </div>
                  ))}
                </div>

                {/* Top issue + quick fix */}
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-1.5">
                    Top Issue
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-3">{analysis.topIssue}</p>
                  <div className="flex items-start gap-2 pt-3 border-t border-red-500/10">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Quick Fix</p>
                      <p className="text-[12px] text-zinc-300 leading-relaxed">{analysis.quickFix}</p>
                    </div>
                  </div>
                </div>

                {/* Rewritten version */}
                <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      AI-Rewritten Version
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(analysis.rewrittenVersion);
                      }}
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed italic">
                    &ldquo;{analysis.rewrittenVersion}&rdquo;
                  </p>
                  <button className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                    <BookMarked className="w-3 h-3" />
                    Save to Vault
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800/40 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 text-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4">
                  <BarChart3 className="w-7 h-7 text-yellow-400/60" />
                </div>
                <p className="text-[15px] font-semibold text-zinc-500 mb-2">Analysis Will Appear Here</p>
                <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
                  Paste your hook and hit Analyze to get your 4-dimension Kallaway score.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── GENERATOR TAB ────────────────────────────────────── */}
      {activeTab === 'Generator' && (
        <div className="grid grid-cols-[1fr_1.4fr] gap-5">
          {/* Input */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-4 h-fit">
            <p className="text-[13px] font-semibold text-zinc-300">Generate 5 Hook Variants</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Enter your topic and the AI will generate one variant for each of the 5 strongest Kallaway structures.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Subject <span className="text-red-400">*</span></label>
              <textarea
                placeholder="What is your video about?"
                value={genSubject}
                onChange={(e) => setGenSubject(e.target.value)}
                rows={3}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Angle <span className="text-red-400">*</span></label>
              <textarea
                placeholder="Your unique contrarian take..."
                value={genAngle}
                onChange={(e) => setGenAngle(e.target.value)}
                rows={2}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Niche</label>
                <input
                  type="text"
                  placeholder="Business, Fitness..."
                  value={genNiche}
                  onChange={(e) => setGenNiche(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Audience</label>
                <input
                  type="text"
                  placeholder="Entrepreneurs, Athletes..."
                  value={genAudience}
                  onChange={(e) => setGenAudience(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                />
              </div>
            </div>

            {genError && (
              <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-300">{genError}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!genSubject.trim() || !genAngle.trim() || isGenerating}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                !genSubject.trim() || !genAngle.trim() || isGenerating
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20'
              )}
            >
              {isGenerating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Variants...</>
                : <><Sparkles className="w-4 h-4" /> Generate 5 Variants</>
              }
            </button>
          </div>

          {/* Variants output */}
          <div className="space-y-3">
            {variants ? variants.map((v, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                      #{i + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-violet-400">{v.structure}</span>
                    <span className="text-[10px] text-zinc-600 hidden sm:inline">— {v.structureDescription}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-black', scoreColor(v.estimatedStrength))}>
                      {v.estimatedStrength.toFixed(1)}
                    </span>
                    <button
                      onClick={() => copyVariant(v.spokenHook, i)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      {copiedVariant === i
                        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                        : <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      }
                    </button>
                  </div>
                </div>

                {/* Spoken hook */}
                <div className="bg-zinc-800/40 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Spoken Hook</p>
                  <p className="text-sm text-zinc-200 leading-relaxed italic">&ldquo;{v.spokenHook}&rdquo;</p>
                </div>

                {/* Text + Visual + Audio */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-800/30 rounded-lg p-2.5">
                    <p className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Text Hook</p>
                    <p className="text-[11px] text-zinc-300 leading-tight">{v.textHook}</p>
                  </div>
                  <div className="bg-zinc-800/30 rounded-lg p-2.5">
                    <p className="text-[9px] font-semibold text-green-400 uppercase tracking-wider mb-1">Visual</p>
                    <p className="text-[11px] text-zinc-300 leading-tight">{v.visualHookSuggestion}</p>
                  </div>
                  <div className="bg-zinc-800/30 rounded-lg p-2.5">
                    <p className="text-[9px] font-semibold text-orange-400 uppercase tracking-wider mb-1">Audio</p>
                    <p className="text-[11px] text-zinc-300 leading-tight">{v.audioHookSuggestion}</p>
                  </div>
                </div>

                {/* Contrast type + reasoning */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800/60">
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border',
                    v.contrastType === 'stated'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  )}>
                    {v.contrastType} contrast
                  </span>
                  <p className="text-[11px] text-zinc-500 leading-relaxed flex-1">{v.reasoning}</p>
                  <button className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-violet-400 transition-colors">
                    <BookMarked className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>
            )) : (
              <div className="bg-zinc-900 border border-zinc-800/40 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-violet-400/60" />
                </div>
                <p className="text-[15px] font-semibold text-zinc-500 mb-2">5 Hook Variants Will Appear Here</p>
                <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
                  Each variant uses a different Kallaway structure with fully mapped text, visual, and audio hooks.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── A/B COMPARE TAB ──────────────────────────────────── */}
      {activeTab === 'A/B Compare' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Hook A */}
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[11px] font-black text-blue-400">A</div>
                <span className="text-sm font-semibold text-zinc-300">Hook A</span>
              </div>
              <textarea
                placeholder="Paste Hook A here..."
                value={hookA}
                onChange={(e) => setHookA(e.target.value)}
                rows={5}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/60 resize-none"
              />
            </div>

            {/* Hook B */}
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[11px] font-black text-orange-400">B</div>
                <span className="text-sm font-semibold text-zinc-300">Hook B</span>
              </div>
              <textarea
                placeholder="Paste Hook B here..."
                value={hookB}
                onChange={(e) => setHookB(e.target.value)}
                rows={5}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Niche (optional) — e.g. Business, Fitness..."
              value={compareNiche}
              onChange={(e) => setCompareNiche(e.target.value)}
              className="flex-1 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
            />
            <button
              onClick={handleCompare}
              disabled={!hookA.trim() || !hookB.trim() || isComparing}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all',
                !hookA.trim() || !hookB.trim() || isComparing
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20'
              )}
            >
              {isComparing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Comparing...</>
                : <><GitCompare className="w-4 h-4" /> Compare Hooks</>
              }
            </button>
          </div>

          {compareError && (
            <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[12px] text-red-300">{compareError}</p>
            </div>
          )}

          {/* Comparison result */}
          {comparison && (
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6">
              {/* Winner banner */}
              <div className={cn(
                'flex items-center justify-center gap-3 py-4 rounded-xl mb-5 border',
                comparison.winner === 'A'
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : comparison.winner === 'B'
                  ? 'bg-orange-500/10 border-orange-500/20'
                  : 'bg-zinc-800/40 border-zinc-700/30'
              )}>
                <Zap className={cn('w-5 h-5', comparison.winner === 'A' ? 'text-blue-400' : comparison.winner === 'B' ? 'text-orange-400' : 'text-zinc-400')} />
                <span className={cn('text-lg font-black', comparison.winner === 'A' ? 'text-blue-400' : comparison.winner === 'B' ? 'text-orange-400' : 'text-zinc-300')}>
                  {comparison.winner === 'tie' ? 'It\'s a Tie!' : `Hook ${comparison.winner} Wins`}
                </span>
                {comparison.winner !== 'tie' && (
                  <span className="text-[12px] text-zinc-500">
                    by {comparison.marginOfVictory.toFixed(1)} points
                  </span>
                )}
              </div>

              {/* Side-by-side scores */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {(['A', 'B'] as const).map((side) => {
                  const data = side === 'A' ? comparison.hookA : comparison.hookB;
                  const isWinner = comparison.winner === side;
                  return (
                    <div key={side} className={cn(
                      'rounded-xl p-4 border',
                      isWinner ? (side === 'A' ? 'border-blue-500/30 bg-blue-500/5' : 'border-orange-500/30 bg-orange-500/5') : 'border-zinc-700/30 bg-zinc-800/20'
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black',
                            side === 'A' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          )}>{side}</div>
                          {isWinner && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Winner</span>}
                        </div>
                        <span className={cn('text-2xl font-black', scoreColor(data.score))}>{data.score.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-700 rounded-full mb-3 overflow-hidden">
                        <div className={cn('h-full rounded-full', side === 'A' ? 'bg-blue-500' : 'bg-orange-500')} style={{ width: `${(data.score / 10) * 100}%` }} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-zinc-300">{data.topStrength}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-zinc-400">{data.topWeakness}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation */}
              <div className="bg-violet-500/8 border border-violet-500/20 rounded-xl p-4">
                <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider mb-2">Recommendation</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{comparison.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
