'use client';

import { useState } from 'react';
import {
  SplitSquareHorizontal, Zap, TrendingUp, BarChart3, RefreshCw,
  Trophy, Target, Brain, Eye, Clock, Flame, ChevronDown, ChevronUp,
  Copy, Check, Loader2, Plus, Star, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateHookVariants, scoreHooks } from '@/actions/split-test';
import type { HookVariant, ScoreResult } from '@/actions/split-test';

const NICHES = ['Business', 'Finance', 'Fitness', 'Health & Wellness', 'Education', 'E-Commerce', 'Tech & AI', 'Lifestyle', 'Real Estate', 'Personal Dev'];
const AUDIENCES = ['Entrepreneurs', 'Side hustlers', 'Fitness beginners', 'Small business owners', 'Content creators', 'Investors', 'Students', 'Busy professionals'];

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-500">{label}</span>
        <span className={cn('font-bold', color)}>{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color.replace('text-', 'bg-'))} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function WinnerBadge() {
  return (
    <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-2 py-0.5">
      <Trophy className="w-2.5 h-2.5 text-yellow-400" />
      <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wider">Winner</span>
    </div>
  );
}

// ── Statistical Significance Engine ─────────────────────────────────────────
// Uses two-proportion z-test against control (variant A)
// Confidence = normalCDF(|z|) * 2 - 1 expressed as %

function normalCDF(z: number): number {
  // Abramowitz & Stegun approximation — accurate to ±7.5×10⁻⁸
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422820 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302745))));
  return z > 0 ? 1 - p : p;
}

function twoProportionZ(c1: number, n1: number, c2: number, n2: number): number {
  if (n1 < 1 || n2 < 1) return 0;
  const p1 = c1 / n1, p2 = c2 / n2;
  const pPool = (c1 + c2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  return se === 0 ? 0 : (p1 - p2) / se;
}

function confidencePct(z: number): number {
  return Math.min(99.9, Math.max(0, (2 * normalCDF(Math.abs(z)) - 1) * 100));
}

// Wilson score 95% CI half-width
function wilsonHW(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  const p = clicks / impressions;
  const z = 1.96;
  return (z * Math.sqrt((p * (1 - p) + z * z / (4 * impressions)) / impressions)) / (1 + z * z / impressions);
}

interface LiveVariant {
  variantId: string;
  label: string;    // A, B, C…
  hook: string;
  impressions: number;
  clicks: number;
  baseCtr: number;  // used for simulation
}

export default function SplitTestPage() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('Business');
  const [audience, setAudience] = useState('Entrepreneurs');
  const [variantCount, setVariantCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState('');
  const [variants, setVariants] = useState<HookVariant[]>([]);
  const [scores, setScores] = useState<ScoreResult[]>([]);
  const [winner, setWinner] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [bestFormula, setBestFormula] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [liveTests, setLiveTests] = useState<LiveVariant[]>([]);
  const [testRunning, setTestRunning] = useState(false);

  async function runGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setVariants([]);
    setScores([]);
    try {
      const res = await generateHookVariants(topic, niche, audience, variantCount);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Generation failed');
      setVariants(res.data.variants);
      setWinner(res.data.winner);
      setAnalysis(res.data.analysis);
      setBestFormula(res.data.bestFormula);
      // Auto-score
      setScoring(true);
      const scoreRes = await scoreHooks(res.data.variants.map(v => ({ id: v.id, hook: v.hook })), niche);
      if (scoreRes.success && scoreRes.data) setScores(scoreRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
      setScoring(false);
    }
  }

  function copyHook(id: string, hook: string) {
    navigator.clipboard.writeText(hook).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  }

  function getScore(variantId: string) {
    return scores.find(s => s.hookId === variantId);
  }

  function startLiveTest() {
    // Seed with 200 impressions per variant, CTR ≈ predictedCtr with ±noise
    const initial: LiveVariant[] = sortedVariants.map((v, i) => {
      const base = v.predictedCtr / 100;
      const seed = Math.round(200 + Math.random() * 100);
      const clicks = Math.round(seed * (base + (Math.random() - 0.5) * 0.01));
      return { variantId: v.id, label: String.fromCharCode(65 + i), hook: v.hook, impressions: seed, clicks, baseCtr: base };
    });
    setLiveTests(initial);
    setTestRunning(true);
  }

  function addImpressions(batchSize = 500) {
    setLiveTests(prev => prev.map(lv => {
      const newImpr = Math.round(batchSize / prev.length);
      // Add noise: ±15% around base CTR
      const noise = (Math.random() - 0.5) * 0.03;
      const newClicks = Math.round(newImpr * Math.max(0, lv.baseCtr + noise));
      return { ...lv, impressions: lv.impressions + newImpr, clicks: lv.clicks + newClicks };
    }));
  }

  function stopTest() { setTestRunning(false); }

  const sortedVariants = [...variants].sort((a, b) => b.predictedCtr - a.predictedCtr);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <SplitSquareHorizontal className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Split Testing Engine</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">Generate A/B/C/D hook variants, AI-score each one, and find your winner before you shoot.</p>
        </div>
      </div>

      <div className="grid grid-cols-[340px_1fr] gap-6">
        {/* Left: Config panel */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-4">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Test Configuration</p>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Topic / Concept *</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. How I paid off $100K in debt in 18 months using one budgeting method"
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Niche</label>
              <select value={niche} onChange={e => setNiche(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500/60">
                {NICHES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Target Audience</label>
              <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-orange-500/60">
                {AUDIENCES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-400 mb-2 block">Number of Variants: <span className="text-orange-400 font-bold">{variantCount}</span></label>
              <input type="range" min={2} max={6} value={variantCount} onChange={e => setVariantCount(Number(e.target.value))} className="w-full accent-orange-500" />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>2 (A/B)</span><span>4 (A/B/C/D)</span><span>6 (Max)</span>
              </div>
            </div>

            {error && <p className="text-[11px] text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">{error}</p>}

            <button
              onClick={runGenerate}
              disabled={loading || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 text-white text-[13px] font-semibold rounded-lg transition-all shadow-lg shadow-orange-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? 'Generating Variants…' : `Generate ${variantCount} Hook Variants`}
            </button>
          </div>

          {/* Best formula card */}
          {bestFormula && (
            <div className="bg-gradient-to-br from-orange-950/40 to-red-950/40 border border-orange-800/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3.5 h-3.5 text-yellow-400" />
                <p className="text-[11px] font-semibold text-yellow-400">Best Formula for {niche}</p>
              </div>
              <p className="text-[13px] font-bold text-zinc-200">{bestFormula}</p>
              <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">{analysis}</p>
            </div>
          )}

          {/* How split testing works */}
          <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4 space-y-3">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">How It Works</p>
            {[
              { icon: Brain, label: 'Generate', desc: 'AI creates variants using different proven hook formulas' },
              { icon: BarChart3, label: 'Score', desc: 'Each hook scored on 5 dimensions: clarity, curiosity, urgency, specificity, emotional pull' },
              { icon: Target, label: 'Test', desc: 'Deploy top 2 variants. Track real CTR and retention' },
              { icon: Trophy, label: 'Win', desc: 'Winner promoted when confidence reaches 95%' },
            ].map(step => (
              <div key={step.label} className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <step.icon className="w-3 h-3 text-orange-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-300">{step.label}</p>
                  <p className="text-[10px] text-zinc-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {variants.length === 0 && !loading && (
            <div className="bg-zinc-900/40 border border-zinc-800/40 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
                <SplitSquareHorizontal className="w-7 h-7 text-zinc-600" />
              </div>
              <p className="text-[15px] font-semibold text-zinc-500 mb-1">No variants yet</p>
              <p className="text-[12px] text-zinc-700">Enter a topic and click Generate to create A/B/C/D hook variants</p>
            </div>
          )}

          {loading && (
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-8 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-zinc-300 mb-1">Generating {variantCount} Hook Variants</p>
                <p className="text-[12px] text-zinc-600">AI is crafting distinct angles using proven formulas…</p>
              </div>
            </div>
          )}

          {sortedVariants.length > 0 && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Variants', value: variants.length.toString(), icon: SplitSquareHorizontal, color: 'text-orange-400' },
                  { label: 'Top Score', value: `${Math.max(...variants.map(v => v.predictedCtr))}%`, icon: TrendingUp, color: 'text-emerald-400' },
                  { label: 'Avg Score', value: `${Math.round(variants.reduce((s, v) => s + v.predictedCtr, 0) / variants.length)}%`, icon: BarChart3, color: 'text-blue-400' },
                  { label: 'Score Range', value: `${Math.max(...variants.map(v => v.predictedCtr)) - Math.min(...variants.map(v => v.predictedCtr))}pt`, icon: Target, color: 'text-violet-400' },
                ].map(s => (
                  <div key={s.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <s.icon className={cn('w-3 h-3', s.color)} />
                      <span className="text-[10px] text-zinc-500">{s.label}</span>
                    </div>
                    <p className={cn('text-[20px] font-bold', s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Variant cards */}
              <div className="space-y-3">
                {scoring && (
                  <div className="flex items-center gap-2 text-[12px] text-zinc-500 px-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                    Scoring all variants across 5 dimensions…
                  </div>
                )}
                {sortedVariants.map((variant, idx) => {
                  const isWinner = variant.id === winner;
                  const score = getScore(variant.id);
                  const isExpanded = expandedId === variant.id;
                  return (
                    <div key={variant.id} className={cn('bg-zinc-900 border rounded-xl overflow-hidden transition-all', isWinner ? 'border-yellow-500/40 shadow-lg shadow-yellow-500/5' : 'border-zinc-800/60')}>
                      {/* Card header */}
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0', isWinner ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-zinc-800 text-zinc-400')}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isWinner && <WinnerBadge />}
                              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{variant.formula}</span>
                            </div>
                            <p className="text-[14px] font-semibold text-zinc-100 leading-snug">&ldquo;{variant.hook}&rdquo;</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => copyHook(variant.id, variant.hook)} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
                              {copiedId === variant.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setExpandedId(isExpanded ? '' : variant.id)} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* CTR bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-1000', isWinner ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-orange-600 to-red-600')}
                              style={{ width: `${variant.predictedCtr}%` }}
                            />
                          </div>
                          <span className={cn('text-[13px] font-bold w-10 text-right', isWinner ? 'text-yellow-400' : 'text-orange-400')}>{variant.predictedCtr}%</span>
                        </div>

                        <div className="flex gap-3 mt-2">
                          <span className="text-[10px] text-zinc-600">
                            <Flame className="w-2.5 h-2.5 inline mr-0.5 text-orange-500" />
                            {variant.emotionTrigger}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            <Eye className="w-2.5 h-2.5 inline mr-0.5 text-blue-500" />
                            {variant.wordCount} words
                          </span>
                        </div>
                      </div>

                      {/* Expanded score details */}
                      {isExpanded && score && (
                        <div className="border-t border-zinc-800/60 p-4 bg-zinc-950/40 space-y-4">
                          <div>
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Pattern Interrupt</p>
                            <p className="text-[12px] text-zinc-400">{variant.patternInterrupt}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Score Breakdown</p>
                            <div className="space-y-2">
                              <ScoreBar label="Clarity" value={score.scores.clarity} color="text-blue-400" />
                              <ScoreBar label="Curiosity" value={score.scores.curiosity} color="text-violet-400" />
                              <ScoreBar label="Urgency" value={score.scores.urgency} color="text-red-400" />
                              <ScoreBar label="Specificity" value={score.scores.specificity} color="text-emerald-400" />
                              <ScoreBar label="Emotional Pull" value={score.scores.emotionalPull} color="text-pink-400" />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">AI Feedback</p>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{score.feedback}</p>
                          </div>
                          {score.improvements.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Improvements</p>
                              <ul className="space-y-1">
                                {score.improvements.map((imp, i) => (
                                  <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-500">
                                    <Plus className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                    {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            onClick={() => window.location.href = `/dashboard/script?hook=${encodeURIComponent(variant.hook)}`}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-[12px] font-medium rounded-lg transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Build Full Script with This Hook
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={runGenerate}
                className="flex items-center gap-2 text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate with different angles
              </button>
            </>
          )}

          {/* Statistical Significance Tracker */}
          {variants.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
                  <p className="text-[12px] font-semibold text-zinc-300">Live Statistical Significance Tracker</p>
                  {testRunning && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {liveTests.length > 0 && testRunning && (
                    <>
                      <button onClick={() => addImpressions(500)} className="text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors">
                        +500 impressions
                      </button>
                      <button onClick={() => addImpressions(2000)} className="text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors">
                        +2K impressions
                      </button>
                      <button onClick={stopTest} className="text-[11px] text-red-400 bg-red-950/30 hover:bg-red-950/50 border border-red-800/30 px-2.5 py-1 rounded-lg transition-colors">
                        Stop
                      </button>
                    </>
                  )}
                  {!testRunning && (
                    <button onClick={startLiveTest} className="text-[11px] text-orange-300 bg-orange-950/40 hover:bg-orange-950/60 border border-orange-800/30 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5">
                      <Play className="w-3 h-3" />
                      Start Live Test
                    </button>
                  )}
                </div>
              </div>

              {liveTests.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-[12px] text-zinc-600 mb-1">Statistical significance tracking not started</p>
                  <p className="text-[11px] text-zinc-700">Activates at 200+ impressions per variant. Significance declared at 95% confidence (p &lt; 0.05).</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Overall test status */}
                  {(() => {
                    const control = liveTests[0];
                    const totalImpr = liveTests.reduce((s, l) => s + l.impressions, 0);
                    const leaders = liveTests.filter((lv, i) => i > 0).map(lv => {
                      const z = twoProportionZ(lv.clicks, lv.impressions, control.clicks, control.impressions);
                      return { lv, z, conf: confidencePct(z) };
                    });
                    const significantWinner = leaders.find(l => l.conf >= 95 && l.z > 0);
                    const controlWins = leaders.every(l => l.conf >= 95 && l.z < 0);
                    return (
                      <div className={cn('rounded-xl p-3 flex items-center gap-3 border', significantWinner ? 'bg-yellow-500/10 border-yellow-500/20' : controlWins ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-800/40 border-zinc-700/40')}>
                        {significantWinner ? <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" /> : controlWins ? <Trophy className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
                        <div>
                          {significantWinner ? (
                            <p className="text-[12px] font-bold text-yellow-300">Variant {significantWinner.lv.label} declared winner at {significantWinner.conf.toFixed(1)}% confidence</p>
                          ) : controlWins ? (
                            <p className="text-[12px] font-bold text-emerald-300">Control (A) wins — challenger variants underperform at 95%+ confidence</p>
                          ) : (
                            <p className="text-[12px] font-semibold text-zinc-400">Test in progress — {totalImpr.toLocaleString()} total impressions collected</p>
                          )}
                          <p className="text-[10px] text-zinc-600 mt-0.5">Significance threshold: 95% (p &lt; 0.05) · Two-proportion z-test vs. control (A)</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Per-variant stats table */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-[28px_1fr_80px_80px_70px_100px_90px] gap-2 px-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                      <div />
                      <div>Variant</div>
                      <div className="text-right">Impressions</div>
                      <div className="text-right">Clicks</div>
                      <div className="text-right">CTR</div>
                      <div className="text-right">vs Control</div>
                      <div className="text-right">Confidence</div>
                    </div>
                    {liveTests.map((lv, i) => {
                      const ctr = lv.impressions > 0 ? lv.clicks / lv.impressions : 0;
                      const hw = wilsonHW(lv.clicks, lv.impressions);
                      const control = liveTests[0];
                      const z = i === 0 ? 0 : twoProportionZ(lv.clicks, lv.impressions, control.clicks, control.impressions);
                      const conf = i === 0 ? null : confidencePct(z);
                      const lift = i === 0 ? null : ((ctr - (control.clicks / control.impressions)) / Math.max(control.clicks / control.impressions, 0.0001) * 100);
                      const isSignificant = conf !== null && conf >= 95;
                      return (
                        <div key={lv.variantId} className={cn('grid grid-cols-[28px_1fr_80px_80px_70px_100px_90px] gap-2 items-center px-2 py-2.5 rounded-lg border', i === 0 ? 'bg-zinc-800/30 border-zinc-700/30' : isSignificant && z > 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-zinc-800/10 border-zinc-800/30')}>
                          <div className={cn('w-6 h-6 rounded flex items-center justify-center text-[10px] font-black', i === 0 ? 'bg-zinc-700 text-zinc-300' : isSignificant && z > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-400')}>{lv.label}</div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-zinc-300 truncate font-medium">{lv.hook.slice(0, 50)}{lv.hook.length > 50 ? '…' : ''}</p>
                            {i === 0 && <span className="text-[9px] text-zinc-600 bg-zinc-700 px-1.5 py-0.5 rounded-full">Control</span>}
                          </div>
                          <div className="text-right text-[12px] font-mono text-zinc-400">{lv.impressions.toLocaleString()}</div>
                          <div className="text-right text-[12px] font-mono text-zinc-400">{lv.clicks.toLocaleString()}</div>
                          <div className="text-right">
                            <span className="text-[12px] font-bold text-zinc-200">{(ctr * 100).toFixed(2)}%</span>
                            <span className="text-[9px] text-zinc-600 block">±{(hw * 100).toFixed(2)}%</span>
                          </div>
                          <div className="text-right">
                            {lift !== null ? (
                              <span className={cn('text-[12px] font-bold', lift > 0 ? 'text-emerald-400' : 'text-red-400')}>
                                {lift > 0 ? '+' : ''}{lift.toFixed(1)}%
                              </span>
                            ) : <span className="text-[11px] text-zinc-600">—</span>}
                          </div>
                          <div className="text-right">
                            {conf !== null ? (
                              <div>
                                <span className={cn('text-[12px] font-bold', conf >= 95 ? (z > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-400')}>{conf.toFixed(1)}%</span>
                                <div className="h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                                  <div className={cn('h-full rounded-full transition-all', conf >= 95 ? (z > 0 ? 'bg-emerald-500' : 'bg-red-500') : 'bg-zinc-600')} style={{ width: `${Math.min(100, conf)}%` }} />
                                </div>
                              </div>
                            ) : <span className="text-[11px] text-zinc-600">control</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-zinc-700 pt-1">
                    95% CI uses Wilson score interval · Significance: two-proportion z-test · Min sample: 200 impressions/variant
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
