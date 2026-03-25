'use client';

import { useState, useTransition } from 'react';
import {
  Wand2,
  Loader2,
  Languages,
  Wrench,
  Copy,
  Check,
  ChevronDown,
  Zap,
  FileText,
  Scissors,
  Film,
  Type,
  Camera,
  AlertCircle,
} from 'lucide-react';
import { generateMultiModalBlueprint, fixScript, translateBlueprint } from '@/actions/ai-scripts';
import { MOCK_VAULT_ITEMS } from '@/lib/mock-data';
import { SUPPORTED_LANGUAGES } from '@/types';
import { cn } from '@/lib/utils';
import type { ScriptBlueprint } from '@/types';

export default function ScriptPage() {
  const [subject, setSubject] = useState('');
  const [angle, setAngle] = useState('');
  const [blueprint, setBlueprint] = useState<ScriptBlueprint | null>(null);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [showFixer, setShowFixer] = useState(false);
  const [fixerInstruction, setFixerInstruction] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useVault, setUseVault] = useState(true);

  const [isGenerating, startGenerate] = useTransition();
  const [isFixing, startFix] = useTransition();
  const [isTranslating, startTranslate] = useTransition();

  const vaultHooks = MOCK_VAULT_ITEMS;

  function handleGenerate() {
    if (!subject.trim() || !angle.trim()) return;
    setError(null);
    startGenerate(async () => {
      const result = await generateMultiModalBlueprint(
        subject,
        angle,
        useVault ? vaultHooks : []
      );
      if (result.success && result.data) {
        setBlueprint(result.data);
        setActiveLanguage('en');
      } else {
        setError(result.error ?? 'Failed to generate script');
      }
    });
  }

  function handleFix() {
    if (!blueprint || !fixerInstruction.trim()) return;
    setError(null);
    startFix(async () => {
      const result = await fixScript(blueprint, fixerInstruction);
      if (result.success && result.data) {
        setBlueprint(result.data);
        setFixerInstruction('');
        setShowFixer(false);
      } else {
        setError(result.error ?? 'Failed to fix script');
      }
    });
  }

  function handleTranslate(langCode: string) {
    if (!blueprint) return;
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (!lang || langCode === 'en') {
      setActiveLanguage(langCode);
      return;
    }
    setError(null);
    startTranslate(async () => {
      const result = await translateBlueprint(blueprint, lang.label);
      if (result.success && result.data) {
        setBlueprint(result.data);
        setActiveLanguage(langCode);
      } else {
        setError(result.error ?? 'Failed to translate');
      }
    });
    setShowLangMenu(false);
    setActiveLanguage(langCode);
  }

  function handleCopy() {
    if (!blueprint) return;
    const text = `HOOK: ${blueprint.hook}\n\nSCRIPT:\n${blueprint.script}\n\nEDIT INSTRUCTIONS:\n${
      blueprint.editInstructions
        .map((i) => `[${i.timestamp}] ${i.scriptLine}\n→ ${i.visualInstruction}`)
        .join('\n\n')
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isLoading = isGenerating || isFixing || isTranslating;
  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Script Generator</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          AI-powered multi-modal content blueprints using your Vault as context.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-5">
        {/* Left: Input panel */}
        <div className="space-y-4">
          {/* Subject */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Subject
              </label>
              <textarea
                placeholder="What is your video about? (3-5 sentences)&#10;&#10;Example: My video is about how I automated my entire content workflow using AI tools. I want to show exactly which tools I use and how I set them up."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                rows={5}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Angle / Unique Spin
              </label>
              <textarea
                placeholder="What's your unique perspective or angle on this subject?&#10;&#10;Example: My angle is that most people overcomplicate this — I use only 3 tools and spend less than 30 minutes per week on distribution."
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                rows={4}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none leading-relaxed"
              />
            </div>

            {/* Vault toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-800/40 border border-zinc-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <div>
                  <p className="text-[12px] font-medium text-zinc-300">Use Vault as Context</p>
                  <p className="text-[10px] text-zinc-500">{vaultHooks.length} hooks & styles available</p>
                </div>
              </div>
              <button
                onClick={() => setUseVault((v) => !v)}
                className={cn(
                  'w-9 h-5 rounded-full transition-colors relative',
                  useVault ? 'bg-violet-600' : 'bg-zinc-700'
                )}
              >
                <div className={cn(
                  'w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform',
                  useVault ? 'translate-x-4.5' : 'translate-x-0.75'
                )} />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!subject.trim() || !angle.trim() || isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                !subject.trim() || !angle.trim() || isLoading
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Blueprint...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Blueprint
                </>
              )}
            </button>
          </div>

          {/* Tips */}
          <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Tips</p>
            <ul className="space-y-2 text-[12px] text-zinc-500 leading-relaxed">
              <li className="flex gap-2"><span className="text-violet-400">•</span> Be specific about your subject — vague inputs produce generic scripts.</li>
              <li className="flex gap-2"><span className="text-violet-400">•</span> Any URLs in your input are automatically ignored by the AI.</li>
              <li className="flex gap-2"><span className="text-violet-400">•</span> The Vault context shapes the hook style and visual tactics used.</li>
              <li className="flex gap-2"><span className="text-violet-400">•</span> Use the Fixer to iterate on any part of the generated blueprint.</li>
            </ul>
          </div>
        </div>

        {/* Right: Output panel */}
        <div className="space-y-4">
          {blueprint ? (
            <>
              {/* Action toolbar */}
              <div className="flex items-center gap-2">
                {/* Translation menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangMenu((v) => !v)}
                    disabled={isTranslating}
                    className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 text-zinc-300 text-[12px] font-medium px-3 py-2 rounded-lg transition-all"
                  >
                    {isTranslating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Languages className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    {activeLang?.flag} {activeLang?.label}
                    <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </button>

                  {showLangMenu && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-800 border border-zinc-700/60 rounded-xl shadow-xl shadow-black/40 z-20 overflow-hidden">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleTranslate(lang.code)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-left transition-colors',
                            activeLanguage === lang.code
                              ? 'bg-violet-500/15 text-violet-300'
                              : 'text-zinc-300 hover:bg-zinc-700/60'
                          )}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                          {activeLanguage === lang.code && (
                            <Check className="w-3 h-3 ml-auto text-violet-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFixer((v) => !v)}
                  className={cn(
                    'flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg transition-all border',
                    showFixer
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                      : 'bg-zinc-800 border-zinc-700/50 text-zinc-300 hover:border-zinc-600'
                  )}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Fixer
                </button>

                <button
                  onClick={handleCopy}
                  className="ml-auto flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 text-zinc-300 text-[12px] font-medium px-3 py-2 rounded-lg transition-all"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy All</>
                  )}
                </button>
              </div>

              {/* Fixer panel */}
              {showFixer && (
                <div className="bg-zinc-900 border border-orange-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-[12px] font-semibold text-orange-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Script Fixer
                  </p>
                  <textarea
                    placeholder="Tell the AI what to change... &#10;Example: Make the hook more provocative. Add a stronger CTA at the end. Make it funnier."
                    value={fixerInstruction}
                    onChange={(e) => setFixerInstruction(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleFix}
                      disabled={!fixerInstruction.trim() || isFixing}
                      className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
                    >
                      {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                      Apply Fix
                    </button>
                    <button
                      onClick={() => setShowFixer(false)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Blueprint output */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
                {/* Hook */}
                <div className="p-4 border-b border-zinc-800/60 bg-gradient-to-r from-yellow-950/30 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <p className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">Opening Hook</p>
                    <span className="text-[10px] text-zinc-600 ml-auto">{blueprint.estimatedDuration}</span>
                  </div>
                  <p className="text-sm text-zinc-200 font-medium leading-relaxed">
                    &ldquo;{blueprint.hook}&rdquo;
                  </p>
                </div>

                {/* Script */}
                <div className="p-4 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Full Script</p>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {blueprint.script}
                  </p>
                </div>

                {/* Edit Instructions */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Scissors className="w-3.5 h-3.5 text-red-400" />
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Edit Instructions</p>
                    <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full ml-auto">
                      {blueprint.editInstructions?.length ?? 0} segments
                    </span>
                  </div>

                  <div className="space-y-3">
                    {blueprint.editInstructions?.map((instruction, i) => (
                      <div key={i} className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                            {instruction.timestamp}
                          </span>
                          <span className="text-[10px] text-zinc-500">{instruction.cutType}</span>
                        </div>

                        <p className="text-[13px] text-zinc-200 font-medium mb-2 italic">
                          &ldquo;{instruction.scriptLine}&rdquo;
                        </p>

                        <div className="space-y-1.5">
                          <div className="flex gap-2">
                            <Camera className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-zinc-400">{instruction.visualInstruction}</p>
                          </div>

                          {instruction.broll && (
                            <div className="flex gap-2">
                              <Film className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                              <p className="text-[12px] text-zinc-500">B-Roll: {instruction.broll}</p>
                            </div>
                          )}

                          {instruction.textOverlay && (
                            <div className="flex gap-2">
                              <Type className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
                              <p className="text-[12px] text-zinc-500">Text: &ldquo;{instruction.textOverlay}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Empty state
            <div className="bg-zinc-900 border border-zinc-800/40 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mb-4">
                <Wand2 className="w-7 h-7 text-violet-400 opacity-70" />
              </div>
              <p className="text-[15px] font-semibold text-zinc-400 mb-2">Your Blueprint Will Appear Here</p>
              <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
                Fill in your Subject and Angle, then hit Generate to create a full 60-second multi-modal content blueprint.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
