'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot, Zap, Play, Plus, ArrowDown, Clock, Calendar, Bell,
  TrendingUp, BarChart3, FileText, Brain, Repeat, Settings,
  Trash2, Copy, Timer, CheckCircle2,
  Sparkles, Loader2, X, ExternalLink, Webhook,
  Download, Send, WifiOff, Wifi, AlertCircle, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  generateWorkflowPlan, testN8nConnection, deployToN8n,
  getN8nExecutions, type WorkflowPlan,
} from '@/actions/automations';
import { buildN8nWorkflow } from '@/lib/n8n-workflow';

// ── Types ────────────────────────────────────────────────────────────────────

type AutomationStatus = 'active' | 'paused';
interface AutomationAction { label: string }
interface Automation {
  id: string; name: string; trigger: string;
  triggerIcon?: 'clock' | 'calendar' | 'zap' | 'bell';
  actions: AutomationAction[]; status: AutomationStatus; lastRun: string;
}
interface N8nConnection { url: string; apiKey: string; connected: boolean; version?: string }

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_AUTOMATIONS: Automation[] = [
  { id: '1', name: 'Daily Outlier Scout', trigger: 'Daily 9am', triggerIcon: 'clock', actions: [{ label: 'Scan tracked channels' }, { label: 'Flag >5x outliers' }, { label: 'Generate brief' }, { label: 'Notify' }], status: 'active', lastRun: '2 hours ago' },
  { id: '2', name: 'Weekly Brief Generator', trigger: 'Monday 8am', triggerIcon: 'calendar', actions: [{ label: 'Compile top 10 outliers' }, { label: 'Generate AI report' }, { label: 'Email' }], status: 'active', lastRun: '3 days ago' },
  { id: '3', name: 'Auto Hook A/B Test', trigger: 'New script saved', triggerIcon: 'zap', actions: [{ label: 'Generate 4 hook variants' }, { label: 'Score all variants' }, { label: 'Add top 2 to queue' }], status: 'paused', lastRun: '1 week ago' },
];

const EXAMPLE_PROMPTS = [
  'Alert me on Slack when a competitor posts a video with 5× their average views',
  'Every Monday morning, generate a trend report and email it to my team',
  'When I save a new idea to Vault, automatically write a script outline',
  'Daily: scan my niche for viral videos and add them to my research vault',
  'After I publish, auto-generate 5 title variations and A/B test the best one',
];

const TEMPLATES = [
  { id: 't1', icon: TrendingUp, name: 'Competitor Monitor', description: 'Alert when a rival channel posts a viral video', color: 'from-red-500/20 to-orange-500/10', prompt: 'Monitor my tracked competitor channels every 6 hours and alert me on Slack when any video gets 5x their channel average views' },
  { id: 't2', icon: Zap, name: 'Content Pipeline', description: 'Idea → Script → Thumbnail automatically', color: 'from-blue-500/20 to-violet-500/10', prompt: 'When I add a new idea to my Vault, automatically generate a full video script with AI and create 4 thumbnail concepts' },
  { id: 't3', icon: Repeat, name: 'A/B Test Loop', description: 'Generate variants, test them, promote the winner', color: 'from-emerald-500/20 to-teal-500/10', prompt: 'Every time I save a new script, generate 4 hook variants, score them, and automatically deploy the top 2 as an A/B test' },
  { id: 't4', icon: Brain, name: 'Brand Guardian', description: 'Check every script for brand compliance', color: 'from-violet-500/20 to-pink-500/10', prompt: 'When a script is marked ready to publish, run a brand voice analysis, score compliance 0-100, and block publishing if score is below 80' },
  { id: 't5', icon: BarChart3, name: 'Trend Radar', description: 'Weekly trending topic discovery in your niche', color: 'from-yellow-500/20 to-orange-500/10', prompt: 'Every Monday at 8am, scan YouTube for the top 50 trending videos in my niche, cross-reference with my vault, and send a weekly opportunity brief via email' },
  { id: 't6', icon: FileText, name: 'ROI Reporter', description: 'Weekly performance email with views & revenue', color: 'from-teal-500/20 to-emerald-500/10', prompt: 'Every Sunday evening, aggregate my YouTube analytics for the week, calculate growth rates, identify top and bottom performers, and email a formatted report' },
];

const TOOL_COLORS: Record<string, string> = {
  'YouTube API': 'bg-red-500/15 text-red-400 border-red-500/20',
  'Claude AI': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'OpenAI': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Gmail': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Slack': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'Discord': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'Telegram': 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  'Supabase': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Airtable': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Google Sheets': 'bg-green-500/15 text-green-400 border-green-500/20',
  'HTTP Request': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

function toolBadgeClass(tool: string) {
  return TOOL_COLORS[tool] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AutomationStatus }) {
  return <span className={cn('w-2 h-2 rounded-full flex-shrink-0', status === 'active' ? 'bg-emerald-400' : 'bg-yellow-400')} />;
}

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div role="switch" aria-checked={enabled} onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer', enabled ? 'bg-emerald-500' : 'bg-zinc-600')}>
      <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform', enabled ? 'translate-x-4' : 'translate-x-1')} />
    </div>
  );
}

const TRIGGER_ICON_MAP = {
  clock: <Clock className="w-4 h-4 text-emerald-400" />,
  calendar: <Calendar className="w-4 h-4 text-emerald-400" />,
  zap: <Zap className="w-4 h-4 text-emerald-400" />,
  bell: <Bell className="w-4 h-4 text-emerald-400" />,
};

// ── Main Page ────────────────────────────────────────────────────────────────

const N8N_LS_KEY = 'vr_n8n_connection';

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(SEED_AUTOMATIONS);
  const [selectedId, setSelectedId] = useState<string>('1');
  const [activeTab, setActiveTab] = useState<'ai-builder' | 'visual' | 'history'>('ai-builder');

  // AI builder state
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<WorkflowPlan | null>(null);
  const [genError, setGenError] = useState('');
  const [savedToList, setSavedToList] = useState(false);

  // n8n connection state (persisted to localStorage)
  const [n8n, setN8n] = useState<N8nConnection>({ url: '', apiKey: '', connected: false });
  const [showN8nPanel, setShowN8nPanel] = useState(false);
  const [testingN8n, setTestingN8n] = useState(false);
  const [n8nTestMsg, setN8nTestMsg] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ workflowId?: string; workflowUrl?: string } | null>(null);
  const [n8nExecutions, setN8nExecutions] = useState<{ id: string; status: string; startedAt: string; workflowName?: string }[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);

  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Load n8n connection from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(N8N_LS_KEY);
      if (stored) setN8n(JSON.parse(stored));
    } catch {}
  }, []);

  function saveN8n(conn: N8nConnection) {
    setN8n(conn);
    localStorage.setItem(N8N_LS_KEY, JSON.stringify(conn));
  }

  async function handleTestN8n() {
    if (!n8n.url || !n8n.apiKey) { setN8nTestMsg('Enter URL and API key first'); return; }
    setTestingN8n(true); setN8nTestMsg('');
    const res = await testN8nConnection(n8n.url, n8n.apiKey);
    if (res.success) {
      const conn = { ...n8n, connected: true, version: res.version };
      saveN8n(conn);
      setN8nTestMsg(`Connected! n8n v${res.version}`);
    } else {
      saveN8n({ ...n8n, connected: false });
      setN8nTestMsg(`Failed: ${res.error}`);
    }
    setTestingN8n(false);
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true); setGeneratedPlan(null); setGenError(''); setDeployResult(null); setSavedToList(false);
    const res = await generateWorkflowPlan(prompt.trim());
    if (res.success && res.data) setGeneratedPlan(res.data);
    else setGenError(res.error ?? 'Generation failed');
    setGenerating(false);
  }

  async function handleDeploy() {
    if (!generatedPlan || !n8n.url || !n8n.apiKey) return;
    setDeploying(true);
    const res = await deployToN8n(generatedPlan, n8n.url, n8n.apiKey);
    if (res.success) setDeployResult({ workflowId: res.workflowId, workflowUrl: res.workflowUrl });
    else setGenError(res.error ?? 'Deploy failed');
    setDeploying(false);
  }

  function handleSaveToList() {
    if (!generatedPlan) return;
    const newId = `ai-${Date.now()}`;
    setAutomations(prev => [{
      id: newId,
      name: generatedPlan.name,
      trigger: generatedPlan.trigger.label,
      triggerIcon: generatedPlan.trigger.type === 'schedule' ? 'clock' :
                   generatedPlan.trigger.type === 'webhook' ? 'zap' : 'bell',
      actions: generatedPlan.steps.map(s => ({ label: s.name })),
      status: 'paused',
      lastRun: 'Never',
    }, ...prev]);
    setSelectedId(newId);
    setSavedToList(true);
  }

  function handleExportJson() {
    if (!generatedPlan) return;
    const json = JSON.stringify(buildN8nWorkflow(generatedPlan), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${generatedPlan.name.replace(/\s+/g, '_')}_n8n.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function handleLoadExecutions() {
    if (!n8n.url || !n8n.apiKey) return;
    setLoadingExecutions(true);
    const res = await getN8nExecutions(n8n.url, n8n.apiKey, 10);
    if (res.success && res.data) setN8nExecutions(res.data);
    setLoadingExecutions(false);
  }

  const selected = automations.find((a) => a.id === selectedId) ?? automations[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-zinc-100 leading-none">Automation Engine</h1>
          <p className="text-[12px] text-zinc-500 mt-0.5">Describe a workflow in plain English — AI builds the plan, n8n runs it</p>
        </div>
        {/* n8n connection badge */}
        <button
          onClick={() => setShowN8nPanel(v => !v)}
          className={cn(
            'ml-auto flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all',
            n8n.connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-zinc-800 border-zinc-700/50 text-zinc-500 hover:text-zinc-300'
          )}
        >
          {n8n.connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {n8n.connected ? `n8n Connected` : 'Connect n8n'}
        </button>
      </div>

      {/* ── n8n Connection Panel ── */}
      {showN8nPanel && (
        <div className="mx-6 mt-4 bg-zinc-900 border border-zinc-700/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center">
                <Webhook className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-zinc-100">n8n Integration</p>
                <p className="text-[11px] text-zinc-500">Connect your self-hosted n8n to deploy workflows automatically</p>
              </div>
            </div>
            <button onClick={() => setShowN8nPanel(false)}><X className="w-4 h-4 text-zinc-500 hover:text-zinc-300" /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">n8n Instance URL</label>
              <input
                type="url"
                placeholder="https://n8n.yourserver.com"
                value={n8n.url}
                onChange={e => saveN8n({ ...n8n, url: e.target.value, connected: false })}
                className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">API Key</label>
              <input
                type="password"
                placeholder="n8n_api_xxxxxxxx"
                value={n8n.apiKey}
                onChange={e => saveN8n({ ...n8n, apiKey: e.target.value, connected: false })}
                className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestN8n}
              disabled={testingN8n}
              className="flex items-center gap-1.5 text-[12px] font-medium bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-200 px-4 py-2 rounded-lg transition-colors"
            >
              {testingN8n ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
              Test Connection
            </button>
            {n8nTestMsg && (
              <span className={cn('text-[11px]', n8n.connected ? 'text-emerald-400' : 'text-red-400')}>
                {n8nTestMsg}
              </span>
            )}
            {n8n.connected && (
              <button
                onClick={handleLoadExecutions}
                disabled={loadingExecutions}
                className="ml-auto flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                {loadingExecutions ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Load recent runs
              </button>
            )}
          </div>

          {/* How to get API key */}
          <div className="bg-zinc-800/50 rounded-lg px-4 py-3 text-[11px] text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-400">How to get your n8n API key:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>In n8n, go to <span className="text-zinc-300">Settings → API</span></li>
              <li>Click <span className="text-zinc-300">Create an API key</span></li>
              <li>Copy it here — VidRevamp stores it in your browser only</li>
            </ol>
          </div>

          {/* Recent n8n executions */}
          {n8nExecutions.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Recent n8n Runs</p>
              <div className="space-y-1.5">
                {n8nExecutions.map(ex => (
                  <div key={ex.id} className="flex items-center gap-3 text-[11px]">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', ex.status === 'success' ? 'bg-emerald-400' : ex.status === 'running' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400')} />
                    <span className="text-zinc-400 truncate flex-1">{ex.workflowName ?? 'Unnamed'}</span>
                    <span className="text-zinc-600 whitespace-nowrap">{new Date(ex.startedAt).toLocaleDateString()}</span>
                    <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', ex.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>{ex.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex" style={{ minHeight: 'calc(100vh - 65px)' }}>
        {/* ── Left: Automation List ── */}
        <aside className="w-[300px] flex-shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-300">Your Automations</span>
            <button
              onClick={() => { setActiveTab('ai-builder'); setGeneratedPlan(null); setPrompt(''); }}
              className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Sparkles className="w-3 h-3" /> New with AI
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {automations.map((auto) => (
              <button key={auto.id} onClick={() => { setSelectedId(auto.id); setActiveTab('visual'); }}
                className={cn('w-full text-left p-3 rounded-xl border transition-all', selectedId === auto.id && activeTab !== 'ai-builder' ? 'bg-zinc-800 border-emerald-500/40' : 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600')}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot status={auto.status} />
                    <span className="text-[13px] font-semibold text-zinc-100 truncate">{auto.name}</span>
                  </div>
                  <ToggleSwitch enabled={auto.status === 'active'} onToggle={() => setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a))} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    {auto.triggerIcon ? TRIGGER_ICON_MAP[auto.triggerIcon] : <Clock className="w-3 h-3 text-emerald-400" />}
                    <span className="truncate max-w-[120px]">{auto.trigger}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-600 mt-1.5">
                  <Clock className="w-3 h-3" /> {auto.lastRun}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Right: Tabs ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Tab bar */}
          <div className="flex border-b border-zinc-800 px-6 bg-zinc-900/40">
            {([
              { id: 'ai-builder', label: 'AI Builder', icon: Sparkles },
              { id: 'visual', label: 'Visual Editor', icon: Zap },
              { id: 'history', label: 'Run History', icon: Timer },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('flex items-center gap-1.5 text-[12px] font-medium px-4 py-3 border-b-2 transition-colors -mb-px',
                  activeTab === tab.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300')}>
                <tab.icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            ))}
          </div>

          {/* ── AI Builder Tab ── */}
          {activeTab === 'ai-builder' && (
            <div className="p-6 space-y-6 max-w-3xl">
              {/* Prompt box */}
              <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-100">Describe your automation</p>
                    <p className="text-[11px] text-zinc-500">Plain English — the AI will design the full workflow</p>
                  </div>
                </div>

                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                  placeholder="e.g. Alert me on Slack whenever a competitor posts a video that gets 5× their average views…"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl px-4 py-3 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/60 resize-none"
                />

                {/* Example prompts */}
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button key={i} onClick={() => setPrompt(ex)}
                      className="text-[10px] text-zinc-400 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 hover:border-zinc-600 px-2.5 py-1.5 rounded-lg transition-colors text-left leading-snug max-w-[220px] truncate">
                      {ex}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating workflow…</> : <><Sparkles className="w-4 h-4" /> Generate Workflow</>}
                </button>
                {genError && (
                  <div className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{genError}
                  </div>
                )}
              </div>

              {/* Generated plan */}
              {generatedPlan && (
                <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-5 space-y-5">
                  {/* Plan header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-[15px] font-bold text-zinc-100">{generatedPlan.name}</h2>
                      </div>
                      <p className="text-[12px] text-zinc-400">{generatedPlan.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700/50">{generatedPlan.estimatedRuntime}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">{generatedPlan.estimatedCostPerRun}/run</span>
                    </div>
                  </div>

                  {/* Visual diagram */}
                  <div className="flex flex-col items-center gap-0 max-w-md mx-auto">
                    {/* Trigger */}
                    <div className="w-full border-2 border-emerald-500/50 bg-emerald-500/5 rounded-xl p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          {generatedPlan.trigger.type === 'schedule' ? <Clock className="w-4 h-4 text-emerald-400" /> :
                           generatedPlan.trigger.type === 'webhook' ? <Webhook className="w-4 h-4 text-emerald-400" /> :
                           <Zap className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Trigger</p>
                          <p className="text-[13px] text-zinc-200">{generatedPlan.trigger.label}</p>
                          {generatedPlan.trigger.cronExpression && (
                            <code className="text-[10px] text-zinc-500 font-mono">{generatedPlan.trigger.cronExpression}</code>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Steps */}
                    {generatedPlan.steps.map((step, idx) => (
                      <div key={step.id} className="w-full flex flex-col items-center">
                        <div className="flex flex-col items-center py-1">
                          <div className="w-px h-4 bg-zinc-700" />
                          <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
                        </div>
                        <div className="w-full border border-zinc-700/60 bg-zinc-800/60 rounded-xl p-3.5">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-500/20 rounded-md flex items-center justify-center text-[11px] font-bold text-blue-400 shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[13px] font-medium text-zinc-200">{step.name}</p>
                                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider', toolBadgeClass(step.tool))}>
                                  {step.tool}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-0.5">{step.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <button onClick={handleSaveToList} disabled={savedToList}
                      className={cn('flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-lg border transition-all', savedToList ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 cursor-default' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700/50 text-zinc-300')}>
                      {savedToList ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</> : <><Plus className="w-3.5 h-3.5" /> Save to My Automations</>}
                    </button>

                    <button onClick={handleExportJson}
                      className="flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-lg border border-zinc-700/50 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Export n8n JSON
                    </button>

                    {n8n.connected ? (
                      deployResult ? (
                        <a href={deployResult.workflowUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" /> Open in n8n
                        </a>
                      ) : (
                        <button onClick={handleDeploy} disabled={deploying}
                          className="flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 transition-colors disabled:opacity-50">
                          {deploying ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deploying…</> : <><Send className="w-3.5 h-3.5" /> Deploy to n8n</>}
                        </button>
                      )
                    ) : (
                      <button onClick={() => setShowN8nPanel(true)}
                        className="flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-300 px-3 py-2 transition-colors">
                        <WifiOff className="w-3.5 h-3.5" /> Connect n8n to deploy
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Templates */}
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Start from a template</p>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.id} onClick={() => { setPrompt(tpl.prompt); promptRef.current?.focus(); }}
                      className={cn('text-left border border-zinc-700/60 rounded-xl p-4 bg-gradient-to-br hover:border-zinc-600 transition-colors', tpl.color)}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 bg-zinc-800/70 rounded-lg flex items-center justify-center text-zinc-300">
                          <tpl.icon className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-semibold text-zinc-200">{tpl.name}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{tpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Visual Editor Tab ── */}
          {activeTab === 'visual' && selected && (
            <div className="p-6 space-y-6 max-w-3xl">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-[16px] font-bold text-zinc-100">{selected.name}</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Visual workflow · click a block to edit</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"><Copy className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"><Settings className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors" onClick={() => setAutomations(prev => prev.filter(a => a.id !== selected.id))}><Trash2 className="w-4 h-4" /></button>
                    <button className="flex items-center gap-1.5 text-[12px] font-medium bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-2 rounded-lg transition-colors"><Play className="w-3.5 h-3.5" /> Run Now</button>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0 max-w-sm mx-auto">
                  <div className="w-full border-2 border-emerald-500/50 bg-emerald-500/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        {selected.triggerIcon ? TRIGGER_ICON_MAP[selected.triggerIcon] : <Clock className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Trigger</p>
                        <p className="text-[13px] text-zinc-200">{selected.trigger}</p>
                      </div>
                    </div>
                  </div>
                  {selected.actions.map((action, idx) => (
                    <div key={idx} className="w-full flex flex-col items-center">
                      <div className="flex flex-col items-center py-1">
                        <div className="w-px h-4 bg-zinc-700" />
                        <ArrowDown className="w-3.5 h-3.5 text-zinc-600" />
                      </div>
                      <div className="w-full border border-zinc-700/60 bg-zinc-800/60 rounded-xl p-3.5 flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-500/20 rounded-md flex items-center justify-center text-[11px] font-bold text-blue-400 shrink-0">{idx + 1}</div>
                        <p className="text-[13px] text-zinc-200">{action.label}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col items-center py-1"><div className="w-px h-4 bg-zinc-700" /></div>
                  <button className="w-full border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-3 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Plus className="w-4 h-4" /><span className="text-[13px]">Add Action</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── History Tab ── */}
          {activeTab === 'history' && (
            <div className="p-6 max-w-3xl space-y-4">
              {n8n.connected && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-zinc-200">n8n Live Executions</p>
                    <button onClick={handleLoadExecutions} disabled={loadingExecutions} className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200">
                      {loadingExecutions ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
                    </button>
                  </div>
                  {n8nExecutions.length === 0 ? (
                    <button onClick={handleLoadExecutions} className="w-full text-[12px] text-zinc-500 py-3 text-center border border-dashed border-zinc-700 rounded-lg hover:border-zinc-600 hover:text-zinc-400 transition-colors">
                      Click to load executions from n8n
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {n8nExecutions.map(ex => (
                        <div key={ex.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-800/60 rounded-lg text-[12px]">
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', ex.status === 'success' ? 'bg-emerald-400' : 'bg-red-400')} />
                          <span className="flex-1 text-zinc-300 truncate">{ex.workflowName ?? 'Unnamed'}</span>
                          <span className="text-zinc-500">{new Date(ex.startedAt).toLocaleString()}</span>
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', ex.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>{ex.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Local demo run history */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <p className="text-[13px] font-semibold text-zinc-200 mb-4">Demo Run History</p>
                <table className="w-full text-[12px]">
                  <thead><tr className="text-left text-zinc-500 border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-2 pr-4">Date</th><th className="pb-2 pr-4">Status</th><th className="pb-2 pr-4">Duration</th><th className="pb-2 pr-4">Cost</th><th className="pb-2">Output</th>
                  </tr></thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {[
                      { date: 'Mar 25 09:00', status: 'success' as const, dur: '1m 12s', cost: '$0.003', out: '4 outliers flagged' },
                      { date: 'Mar 24 09:01', status: 'success' as const, dur: '0m 58s', cost: '$0.002', out: '2 outliers flagged' },
                      { date: 'Mar 23 09:00', status: 'partial' as const, dur: '2m 04s', cost: '$0.004', out: '1 channel timeout' },
                      { date: 'Mar 22 09:00', status: 'success' as const, dur: '1m 05s', cost: '$0.003', out: '7 outliers flagged' },
                      { date: 'Mar 21 09:03', status: 'failed' as const, dur: '0m 12s', cost: '$0.001', out: 'API rate limit hit' },
                    ].map((r, i) => (
                      <tr key={i} className="text-zinc-400">
                        <td className="py-2.5 pr-4 text-zinc-300 whitespace-nowrap">{r.date}</td>
                        <td className="py-2.5 pr-4">
                          <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-medium', r.status === 'success' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : r.status === 'partial' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30')}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono">{r.dur}</td>
                        <td className="py-2.5 pr-4 text-emerald-400 font-mono">{r.cost}</td>
                        <td className="py-2.5">{r.out}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
