'use client';

import { useState, useCallback } from 'react';
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
  Lightbulb,
  Users,
  BookOpen,
  Laugh,
  ShieldCheck,
  Eye,
  Heart,
  Plus,
  X,
  Play,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { generateMultiModalBlueprint, fixScript, translateBlueprint } from '@/actions/ai-scripts';
import { MOCK_VAULT_ITEMS } from '@/lib/mock-data';
import { SUPPORTED_LANGUAGES } from '@/types';
import { cn } from '@/lib/utils';
import type { ScriptBlueprint } from '@/types';
import { AI_MODELS, DEFAULT_MODEL_ID, BADGE_COLORS, TIER_LABELS, type AIModel } from '@/lib/ai-models';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScriptTab {
  id: string;
  label: string;
  subject: string;
  angle: string;
  scenarioType: string;
  hookFormula: string;
  platform: string;
  duration: string;
  blueprint: ScriptBlueprint | null;
  error: string | null;
}

function createTab(label: string): ScriptTab {
  return {
    id: crypto.randomUUID(),
    label,
    subject: '',
    angle: '',
    scenarioType: '',
    hookFormula: '',
    platform: 'TikTok',
    duration: '60 seconds',
    blueprint: null,
    error: null,
  };
}

// ── Scenario & Hook config ────────────────────────────────────────────────────

const SCENARIO_TYPES = [
  { id: 'founder', label: 'Founder Story', icon: Heart, color: 'text-pink-400', template: 'Founder-led personal story arc: describe the problem I faced, the journey/turning point, and the solution/result I achieved. Make it authentic and emotionally compelling.' },
  { id: 'objection', label: 'Objection Handling', icon: ShieldCheck, color: 'text-blue-400', template: 'Address the #1 objection customers have about [topic]. Acknowledge the objection, reframe it, then resolve it with evidence and a CTA.' },
  { id: 'bts', label: 'Behind the Scenes', icon: Eye, color: 'text-orange-400', template: 'Behind-the-scenes of my process building [topic]. Show the real work, failures, and lessons. Build trust through transparency.' },
  { id: 'educational', label: 'Educational', icon: BookOpen, color: 'text-emerald-400', template: 'Teach [topic] in a clear, structured way. Lead with a surprising fact or counterintuitive insight. Use numbered points or a framework. Position me as the authority.' },
  { id: 'relatable', label: 'Relatable', icon: Users, color: 'text-violet-400', template: 'POV-style relatable scenario about [topic]. The audience should immediately see themselves in this situation. Use "you" language. End with a resolution they want.' },
  { id: 'entertainment', label: 'Entertainment', icon: Laugh, color: 'text-yellow-400', template: 'Entertainment-first approach to [topic]. Hook with something unexpected or funny. Embed the value/message within the entertainment. Soft sell at the end.' },
] as const;

const HOOK_FORMULAS = [
  { id: 'curiosity', label: 'Curiosity Gap', example: 'What nobody tells you about [topic] — until now.' },
  { id: 'contradiction', label: 'Contradiction', example: 'Everyone says [X] is the answer. Here\'s why they\'re wrong.' },
  { id: 'confession', label: 'Confession', example: 'I made this mistake for 5 years before I figured it out.' },
  { id: 'transparency', label: 'Transparency', example: 'This is my [result]. I\'m showing you everything.' },
  { id: 'boldclaim', label: 'Bold Claim', example: 'I [achieved X] in [timeframe]. Here\'s the exact system.' },
  { id: 'pov', label: 'POV / Relatable', example: 'POV: You finally stop [problem] and do this instead.' },
  { id: 'painpoint', label: 'Pain Point', example: 'If you\'re still [struggling with X], you need to see this.' },
  { id: 'social', label: 'Social Proof', example: '[Number] people did [X] using this exact framework.' },
] as const;

const PLATFORMS = ['YouTube (Long)', 'YouTube Shorts', 'TikTok', 'Instagram Reels', 'LinkedIn'];
const DURATIONS = ['15 seconds', '30 seconds', '60 seconds', '3 minutes', '5 minutes', '10 minutes'];

// ── Model Picker ──────────────────────────────────────────────────────────────

function ModelPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const m = AI_MODELS.find((x) => x.id === selectedId)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm hover:border-zinc-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', BADGE_COLORS[m.badge])}>
            {m.provider}
          </span>
          <span className="text-zinc-300 font-medium truncate max-w-[120px]">{m.label}</span>
          {m.free && <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">FREE</span>}
          <span className="text-zinc-600 text-[11px] hidden sm:inline">
            ~${((m.input_per_1k * 1.5 + m.output_per_1k * 0.5)).toFixed(4)}/script
          </span>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl z-30 max-h-[400px] overflow-y-auto">
          {(['power', 'balanced', 'fast'] as AIModel['tier'][]).map((tier) => {
            const models = AI_MODELS.filter((x) => x.tier === tier);
            return (
              <div key={tier}>
                <div className="px-3 py-1.5 bg-zinc-900/60 sticky top-0">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{TIER_LABELS[tier]}</span>
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { onSelect(model.id); setOpen(false); }}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-zinc-800/60 transition-colors',
                      selectedId === model.id && 'bg-violet-500/10',
                    )}
                  >
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5', BADGE_COLORS[model.badge])}>
                      {model.provider}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-medium text-zinc-200">{model.label}</span>
                        {model.free && (
                          <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">FREE</span>
                        )}
                        <span className="text-[10px] text-zinc-500 ml-auto">
                          {model.free ? 'Free' : `$${model.input_per_1k.toFixed(5)} / $${model.output_per_1k.toFixed(5)}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{model.description}</p>
                    </div>
                    {selectedId === model.id && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-1" />}
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

// ── Google Export Helpers ─────────────────────────────────────────────────────

function formatScriptForDocs(tab: ScriptTab): string {
  const bp = tab.blueprint;
  if (!bp) return '';
  return [
    `SCRIPT: ${tab.label}`,
    `Platform: ${tab.platform} · Duration: ${tab.duration}`,
    '',
    '━━━ OPENING HOOK ━━━',
    `"${bp.hook}"`,
    '',
    '━━━ FULL SCRIPT ━━━',
    bp.script,
    '',
    '━━━ EDIT INSTRUCTIONS ━━━',
    ...(bp.editInstructions ?? []).map((inst) =>
      `[${inst.timestamp}] "${inst.scriptLine}"\n→ ${inst.visualInstruction}${inst.broll ? `\n📹 B-Roll: ${inst.broll}` : ''}${inst.textOverlay ? `\n📝 Text: "${inst.textOverlay}"` : ''}`
    ),
    '',
    `Duration: ${bp.estimatedDuration}`,
  ].join('\n');
}

function formatScriptForSheets(tab: ScriptTab): string {
  const bp = tab.blueprint;
  const now = new Date().toLocaleDateString();
  return [
    now,
    tab.label,
    tab.platform,
    tab.duration,
    tab.subject.slice(0, 100),
    bp?.hook ?? '',
    bp?.estimatedDuration ?? '',
    bp ? 'Generated' : 'Draft',
  ].join('\t');
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ScriptPage() {
  const [tabs, setTabs] = useState<ScriptTab[]>([createTab('Script 1')]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);
  const [generatingTabs, setGeneratingTabs] = useState<Set<string>>(new Set());
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTabIds, setSelectedTabIds] = useState<Set<string>>(new Set());

  // Per-tab fixer/lang state (stored by tab id)
  const [fixerStates, setFixerStates] = useState<Record<string, { show: boolean; instruction: string }>>({});
  const [langMenuOpen, setLangMenuOpen] = useState<string | null>(null);
  const [activeLanguages, setActiveLanguages] = useState<Record<string, string>>({});
  const [copiedTabId, setCopiedTabId] = useState<string | null>(null);
  const [exportedTabId, setExportedTabId] = useState<string | null>(null);

  const vaultHooks = MOCK_VAULT_ITEMS;
  const [useVault, setUseVault] = useState(true);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  // ── Tab management ──────────────────────────────────────────────────────────

  function addTab() {
    const newTab = createTab(`Script ${tabs.length + 1}`);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setMultiSelectMode(false);
  }

  function closeTab(id: string) {
    if (tabs.length === 1) return;
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeTabId === id) setActiveTabId(next[next.length - 1].id);
      return next;
    });
    setSelectedTabIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  function updateTab(id: string, updates: Partial<ScriptTab>) {
    setTabs((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }

  function renameTab(id: string) {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    const name = prompt('Rename script:', tab.label);
    if (name?.trim()) updateTab(id, { label: name.trim() });
  }

  // ── Generation ──────────────────────────────────────────────────────────────

  const generateForTab = useCallback(async (tab: ScriptTab) => {
    if (!tab.subject.trim() || !tab.angle.trim()) return;

    const scenario = SCENARIO_TYPES.find((s) => s.id === tab.scenarioType);
    const hook = HOOK_FORMULAS.find((h) => h.id === tab.hookFormula);
    const enrichedAngle = [
      tab.angle.trim(),
      scenario ? `\n\nScript scenario: ${scenario.template}` : '',
      hook ? `\nHook formula to use: "${hook.example}"` : '',
      `\nPlatform: ${tab.platform} · Duration: ${tab.duration}`,
    ].join('');

    setGeneratingTabs((prev) => new Set(prev).add(tab.id));
    updateTab(tab.id, { error: null });

    const result = await generateMultiModalBlueprint(
      tab.subject,
      enrichedAngle,
      useVault ? vaultHooks : [],
      selectedModelId,
    );

    if (result.success && result.data) {
      updateTab(tab.id, { blueprint: result.data, error: null });
      setActiveLanguages((prev) => ({ ...prev, [tab.id]: 'en' }));
    } else {
      updateTab(tab.id, { error: result.error ?? 'Failed to generate script' });
    }

    setGeneratingTabs((prev) => { const s = new Set(prev); s.delete(tab.id); return s; });
  }, [selectedModelId, useVault, vaultHooks]);

  async function handleGenerateActive() {
    await generateForTab(activeTab);
  }

  async function handleGenerateSelected() {
    const toGenerate = tabs.filter((t) => selectedTabIds.has(t.id) && t.subject.trim() && t.angle.trim());
    if (toGenerate.length === 0) return;
    await Promise.all(toGenerate.map((t) => generateForTab(t)));
    setMultiSelectMode(false);
    setSelectedTabIds(new Set());
  }

  // ── Fix & Translate ─────────────────────────────────────────────────────────

  async function handleFix(tabId: string) {
    const tab = tabs.find((t) => t.id === tabId);
    const fixer = fixerStates[tabId];
    if (!tab?.blueprint || !fixer?.instruction.trim()) return;

    setGeneratingTabs((prev) => new Set(prev).add(tabId));
    const result = await fixScript(tab.blueprint, fixer.instruction, selectedModelId);
    if (result.success && result.data) {
      updateTab(tabId, { blueprint: result.data });
      setFixerStates((prev) => ({ ...prev, [tabId]: { show: false, instruction: '' } }));
    } else {
      updateTab(tabId, { error: result.error ?? 'Fix failed' });
    }
    setGeneratingTabs((prev) => { const s = new Set(prev); s.delete(tabId); return s; });
  }

  async function handleTranslate(tabId: string, langCode: string) {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab?.blueprint) return;

    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (!lang || langCode === 'en') {
      setActiveLanguages((prev) => ({ ...prev, [tabId]: langCode }));
      setLangMenuOpen(null);
      return;
    }

    setGeneratingTabs((prev) => new Set(prev).add(tabId));
    setActiveLanguages((prev) => ({ ...prev, [tabId]: langCode }));
    setLangMenuOpen(null);

    const result = await translateBlueprint(tab.blueprint, lang.label, selectedModelId);
    if (result.success && result.data) {
      updateTab(tabId, { blueprint: result.data });
    }
    setGeneratingTabs((prev) => { const s = new Set(prev); s.delete(tabId); return s; });
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function handleCopy(tab: ScriptTab) {
    navigator.clipboard.writeText(formatScriptForDocs(tab));
    setCopiedTabId(tab.id);
    setTimeout(() => setCopiedTabId(null), 2000);
  }

  function handleExportToDocs(tab: ScriptTab) {
    navigator.clipboard.writeText(formatScriptForDocs(tab));
    window.open('https://docs.new', '_blank');
    setExportedTabId(tab.id);
    setTimeout(() => setExportedTabId(null), 3000);
  }

  function handleExportToSheets(tab: ScriptTab) {
    navigator.clipboard.writeText(formatScriptForSheets(tab));
    window.open('https://sheets.new', '_blank');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isActiveGenerating = generatingTabs.has(activeTabId);
  const activeLangCode = activeLanguages[activeTabId] ?? 'en';
  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === activeLangCode);
  const activeFixerState = fixerStates[activeTabId] ?? { show: false, instruction: '' };

  function setActiveFixer(updates: Partial<{ show: boolean; instruction: string }>) {
    setFixerStates((prev) => ({
      ...prev,
      [activeTabId]: { ...(prev[activeTabId] ?? { show: false, instruction: '' }), ...updates },
    }));
  }

  const readyTabsCount = tabs.filter((t) => t.subject.trim() && t.angle.trim()).length;
  const selectedReadyCount = tabs.filter((t) => selectedTabIds.has(t.id) && t.subject.trim() && t.angle.trim()).length;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      {/* ── Top: Tabs ── */}
      <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-0 px-2 pt-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isGenerating = generatingTabs.has(tab.id);
            const isSelected = selectedTabIds.has(tab.id);

            return (
              <div
                key={tab.id}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium border border-b-0 transition-all cursor-pointer group shrink-0 min-w-0',
                  isActive
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100 z-10'
                    : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:text-zinc-300',
                  isSelected && !isActive && 'bg-violet-500/10 border-violet-500/30 text-violet-300',
                )}
                onClick={() => {
                  if (multiSelectMode) {
                    setSelectedTabIds((prev) => {
                      const s = new Set(prev);
                      if (s.has(tab.id)) s.delete(tab.id);
                      else s.add(tab.id);
                      return s;
                    });
                  } else {
                    setActiveTabId(tab.id);
                  }
                }}
                onDoubleClick={() => renameTab(tab.id)}
              >
                {multiSelectMode && (
                  <div className={cn(
                    'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                    isSelected ? 'bg-violet-600 border-violet-500' : 'border-zinc-600',
                  )}>
                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                )}
                {isGenerating && <Loader2 className="w-3 h-3 animate-spin text-violet-400 shrink-0" />}
                {tab.blueprint && !isGenerating && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                <span className="truncate max-w-[100px]">{tab.label}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                    className="hidden group-hover:flex w-4 h-4 items-center justify-center rounded hover:bg-zinc-600/50 text-zinc-500 shrink-0"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add tab button */}
          <button
            onClick={addTab}
            className="flex items-center gap-1 px-2.5 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 rounded-t-lg transition-colors shrink-0 ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New Script
          </button>
        </div>

        {/* Multi-select toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-zinc-800/60">
          <button
            onClick={() => {
              setMultiSelectMode((v) => !v);
              setSelectedTabIds(new Set());
            }}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all',
              multiSelectMode
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-500 hover:text-zinc-300',
            )}
          >
            {multiSelectMode ? <Check className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {multiSelectMode ? `${selectedTabIds.size} selected` : 'Multi-Generate'}
          </button>

          {multiSelectMode && (
            <>
              <button
                onClick={() => setSelectedTabIds(new Set(tabs.map((t) => t.id)))}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded"
              >
                Select All
              </button>
              <button
                onClick={handleGenerateSelected}
                disabled={selectedReadyCount === 0 || generatingTabs.size > 0}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ml-auto',
                  selectedReadyCount > 0 && generatingTabs.size === 0
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
                )}
              >
                {generatingTabs.size > 0 ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating {generatingTabs.size}...</>
                ) : (
                  <><Wand2 className="w-3.5 h-3.5" />Generate {selectedReadyCount} Script{selectedReadyCount !== 1 ? 's' : ''}</>
                )}
              </button>
            </>
          )}

          {/* Model picker (compact) */}
          <div className="ml-auto relative">
            <button
              onClick={() => setShowModelPicker((v) => !v)}
              className="flex items-center gap-1.5 text-xs bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-lg px-2.5 py-1.5 text-zinc-300 transition-colors"
            >
              <span className={cn('text-[10px] font-bold px-1 py-0.5 rounded border', BADGE_COLORS[AI_MODELS.find((m) => m.id === selectedModelId)?.badge ?? 'openai'])}>
                {AI_MODELS.find((m) => m.id === selectedModelId)?.provider ?? 'AI'}
              </span>
              <span className="max-w-[80px] truncate">{AI_MODELS.find((m) => m.id === selectedModelId)?.label}</span>
              <ChevronDown className={cn('w-3 h-3 text-zinc-500 transition-transform', showModelPicker && 'rotate-180')} />
            </button>
            {showModelPicker && (
              <div className="absolute top-full right-0 mt-1 w-[420px] z-40">
                <ModelPicker selectedId={selectedModelId} onSelect={(id) => { setSelectedModelId(id); setShowModelPicker(false); }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-5">
          <div className="grid grid-cols-[1fr_1.4fr] gap-5">

            {/* ── Left: Input panel ── */}
            <div className="space-y-4">

              {/* Scenario Type */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                  Script Scenario
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SCENARIO_TYPES.map((s) => {
                    const Icon = s.icon;
                    const active = activeTab.scenarioType === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => updateTab(activeTabId, { scenarioType: active ? '' : s.id })}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all text-left',
                          active
                            ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                            : 'bg-zinc-800/30 border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
                        )}
                      >
                        <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', active ? s.color : 'text-zinc-600')} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hook Formula + Platform */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Hook Formula</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {HOOK_FORMULAS.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => updateTab(activeTabId, { hookFormula: activeTab.hookFormula === h.id ? '' : h.id })}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all text-left truncate',
                          activeTab.hookFormula === h.id
                            ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                            : 'bg-zinc-800/30 border-zinc-800/60 text-zinc-500 hover:text-zinc-300',
                        )}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Platform</label>
                    <select
                      value={activeTab.platform}
                      onChange={(e) => updateTab(activeTabId, { platform: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/60"
                    >
                      {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">Duration</label>
                    <select
                      value={activeTab.duration}
                      onChange={(e) => updateTab(activeTabId, { duration: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/60"
                    >
                      {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Subject + Angle */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Subject</label>
                  <textarea
                    placeholder="What is your video about? (3-5 sentences)"
                    value={activeTab.subject}
                    onChange={(e) => updateTab(activeTabId, { subject: e.target.value })}
                    rows={4}
                    className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Angle / Unique Spin</label>
                  <textarea
                    placeholder="What's your unique perspective or angle?"
                    value={activeTab.angle}
                    onChange={(e) => updateTab(activeTabId, { angle: e.target.value })}
                    rows={3}
                    className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none leading-relaxed"
                  />
                </div>

                {/* Vault toggle */}
                <div className="flex items-center justify-between p-3 bg-zinc-800/40 border border-zinc-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                    <div>
                      <p className="text-[12px] font-medium text-zinc-300">Use Vault as Context</p>
                      <p className="text-[10px] text-zinc-500">{vaultHooks.length} hooks & styles</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseVault((v) => !v)}
                    className={cn('w-9 h-5 rounded-full transition-colors relative', useVault ? 'bg-violet-600' : 'bg-zinc-700')}
                  >
                    <div className={cn('w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform', useVault ? 'translate-x-4.5' : 'translate-x-0.75')} />
                  </button>
                </div>

                {activeTab.error && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-300">{activeTab.error}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerateActive}
                  disabled={!activeTab.subject.trim() || !activeTab.angle.trim() || isActiveGenerating}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                    activeTab.subject.trim() && activeTab.angle.trim() && !isActiveGenerating
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
                  )}
                >
                  {isActiveGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Generating Blueprint...</>
                  ) : (
                    <><Wand2 className="w-4 h-4" />Generate Blueprint</>
                  )}
                </button>

                {tabs.length > 1 && !multiSelectMode && (
                  <p className="text-center text-[11px] text-zinc-600">
                    {readyTabsCount} script{readyTabsCount !== 1 ? 's' : ''} ready ·{' '}
                    <button onClick={() => setMultiSelectMode(true)} className="text-violet-400 hover:text-violet-300">
                      Generate all at once →
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* ── Right: Output panel ── */}
            <div className="space-y-4">
              {activeTab.blueprint ? (
                <>
                  {/* Action toolbar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Translation menu */}
                    <div className="relative">
                      <button
                        onClick={() => setLangMenuOpen(langMenuOpen === activeTabId ? null : activeTabId)}
                        className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 text-zinc-300 text-[12px] font-medium px-3 py-2 rounded-lg transition-all"
                      >
                        {generatingTabs.has(activeTabId) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Languages className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        {activeLang?.flag} {activeLang?.label}
                        <ChevronDown className="w-3 h-3 text-zinc-500" />
                      </button>
                      {langMenuOpen === activeTabId && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-800 border border-zinc-700/60 rounded-xl shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => handleTranslate(activeTabId, lang.code)}
                              className={cn(
                                'w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-left transition-colors',
                                activeLangCode === lang.code
                                  ? 'bg-violet-500/15 text-violet-300'
                                  : 'text-zinc-300 hover:bg-zinc-700/60',
                              )}
                            >
                              <span>{lang.flag}</span>
                              <span>{lang.label}</span>
                              {activeLangCode === lang.code && <Check className="w-3 h-3 ml-auto text-violet-400" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveFixer({ show: !activeFixerState.show })}
                      className={cn(
                        'flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg transition-all border',
                        activeFixerState.show
                          ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                          : 'bg-zinc-800 border-zinc-700/50 text-zinc-300 hover:border-zinc-600',
                      )}
                    >
                      <Wrench className="w-3.5 h-3.5" />Fixer
                    </button>

                    {/* Google export buttons */}
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => handleCopy(activeTab)}
                        title="Copy script"
                        className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 text-zinc-300 text-[12px] font-medium px-2.5 py-2 rounded-lg transition-all"
                      >
                        {copiedTabId === activeTabId ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" />Copy</>
                        )}
                      </button>
                      <button
                        onClick={() => handleExportToDocs(activeTab)}
                        title="Export to Google Docs (copies to clipboard, opens docs.new)"
                        className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 hover:border-blue-500/50 text-zinc-300 hover:text-blue-300 text-[12px] font-medium px-2.5 py-2 rounded-lg transition-all"
                      >
                        {exportedTabId === activeTabId ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-400" />Paste in Docs!</>
                        ) : (
                          <><FileText className="w-3.5 h-3.5 text-blue-400" />Docs<ExternalLink className="w-3 h-3" /></>
                        )}
                      </button>
                      <button
                        onClick={() => handleExportToSheets(activeTab)}
                        title="Log to Google Sheets (copies row, opens sheets.new)"
                        className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700/50 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-300 text-[12px] font-medium px-2.5 py-2 rounded-lg transition-all"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        Sheets
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Fixer panel */}
                  {activeFixerState.show && (
                    <div className="bg-zinc-900 border border-orange-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-[12px] font-semibold text-orange-300 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />Script Fixer
                      </p>
                      <textarea
                        placeholder="Tell the AI what to change..."
                        value={activeFixerState.instruction}
                        onChange={(e) => setActiveFixer({ instruction: e.target.value })}
                        rows={3}
                        className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFix(activeTabId)}
                          disabled={!activeFixerState.instruction.trim() || generatingTabs.has(activeTabId)}
                          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
                        >
                          {generatingTabs.has(activeTabId) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                          Apply Fix
                        </button>
                        <button onClick={() => setActiveFixer({ show: false })} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm px-4 py-2 rounded-lg transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Blueprint output */}
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-zinc-800/60 bg-gradient-to-r from-yellow-950/30 to-transparent">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                        <p className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">Opening Hook</p>
                        <span className="text-[10px] text-zinc-600 ml-auto">{activeTab.blueprint.estimatedDuration}</span>
                      </div>
                      <p className="text-sm text-zinc-200 font-medium leading-relaxed">
                        &ldquo;{activeTab.blueprint.hook}&rdquo;
                      </p>
                    </div>

                    <div className="p-4 border-b border-zinc-800/60">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-3.5 h-3.5 text-violet-400" />
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Full Script</p>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {activeTab.blueprint.script}
                      </p>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Scissors className="w-3.5 h-3.5 text-red-400" />
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Edit Instructions</p>
                        <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full ml-auto">
                          {activeTab.blueprint.editInstructions?.length ?? 0} segments
                        </span>
                      </div>

                      <div className="space-y-3">
                        {activeTab.blueprint.editInstructions?.map((instruction, i) => (
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
                <div className="bg-zinc-900 border border-zinc-800/40 border-dashed rounded-2xl flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mb-4">
                    <Wand2 className="w-7 h-7 text-violet-400 opacity-70" />
                  </div>
                  <p className="text-[15px] font-semibold text-zinc-400 mb-2">Blueprint Appears Here</p>
                  <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
                    Fill Subject + Angle for <strong className="text-zinc-500">{activeTab.label}</strong>, then hit Generate.
                    {tabs.length > 1 && ` Use Multi-Generate to generate all ${tabs.length} tabs at once.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
