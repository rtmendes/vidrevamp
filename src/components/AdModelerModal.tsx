'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2, Copy, Check, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdForModeling {
  id: string;
  platform: string;
  transcript?: string | null;
  ad_copy?: string | null;
  competitor?: { name: string };
  days_active?: number;
}

interface AdModelerModalProps {
  ad: AdForModeling | null;
  onClose: () => void;
}

interface GeneratedScript {
  script: string;
  model: string;
  tokensUsed: number;
  costUsd: number;
}

export function AdModelerModal({ ad, onClose }: AdModelerModalProps) {
  const [productName, setProductName] = useState('');
  const [audience, setAudience] = useState('');
  const [usp1, setUsp1] = useState('');
  const [usp2, setUsp2] = useState('');
  const [usp3, setUsp3] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!ad) return null;

  const sourceText = ad.transcript || ad.ad_copy || '';

  async function handleGenerate() {
    if (!productName.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTranscript: sourceText,
          platform: ad!.platform,
          productName: productName.trim(),
          targetAudience: audience.trim(),
          usps: [usp1, usp2, usp3].filter(Boolean),
          sourceAdId: ad!.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'Generation failed');
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function copyScript() {
    if (!result) return;
    navigator.clipboard.writeText(result.script).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-white text-lg">Model This Ad</h2>
            {ad.competitor?.name && (
              <span className="text-sm text-zinc-500 ml-1">— cloning from <span className="text-zinc-300">{ad.competitor.name}</span></span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Source ad */}
          <div className="w-1/2 p-6 border-r border-zinc-800 overflow-y-auto flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Source Ad Transcript / Copy</p>
              {sourceText ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {sourceText}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-500 italic">
                  No transcript available for this ad. The AI will model the structure based on platform best practices.
                </div>
              )}
            </div>

            <div className="flex gap-2 text-xs text-zinc-500">
              <span className="px-2 py-1 bg-zinc-800 rounded-md uppercase font-semibold tracking-wider">{ad.platform}</span>
              {ad.days_active != null && (
                <span className="px-2 py-1 bg-zinc-800 rounded-md">
                  {ad.days_active}d active
                </span>
              )}
            </div>

            <div className="text-xs text-zinc-500 leading-relaxed bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
              <Zap className="w-3 h-3 inline-block mr-1 text-yellow-500" />
              The AI will extract the hook structure, emotional triggers, pacing, and CTA pattern — then rewrite it for your brand.
            </div>
          </div>

          {/* Right — Form + Output */}
          <div className="w-1/2 p-6 overflow-y-auto flex flex-col gap-5">
            {!result ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Your Brand Details</p>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Product / Brand Name <span className="text-red-400">*</span></label>
                      <input
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        placeholder="e.g. FlowDesk CRM"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Target Audience</label>
                      <input
                        value={audience}
                        onChange={e => setAudience(e.target.value)}
                        placeholder="e.g. Shopify store owners doing $10K/month"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 mb-2 block">Unique Selling Props (up to 3)</label>
                      {[
                        { val: usp1, set: setUsp1, placeholder: 'USP 1: e.g. No monthly fees, ever' },
                        { val: usp2, set: setUsp2, placeholder: 'USP 2: e.g. Set up in under 5 minutes' },
                        { val: usp3, set: setUsp3, placeholder: 'USP 3: e.g. 14-day money-back guarantee' },
                      ].map(({ val, set, placeholder }, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-zinc-600 w-4 shrink-0">{i + 1}.</span>
                          <input
                            value={val}
                            onChange={e => set(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-400 bg-red-950/40 border border-red-700/30 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!productName.trim() || loading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                    productName.trim() && !loading
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating script...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate My Script
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Generated Script</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">
                      {result.tokensUsed} tokens · ${result.costUsd.toFixed(4)}
                    </span>
                    <button
                      onClick={copyScript}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-indigo-800/40 rounded-xl p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto">
                  {result.script}
                </div>

                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center"
                >
                  ← Try again with different inputs
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
