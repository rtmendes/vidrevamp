'use client';

import { useState, useRef } from 'react';
import {
  Bot,
  Zap,
  Play,
  Plus,
  ArrowDown,
  Clock,
  Calendar,
  Bell,
  TrendingUp,
  BarChart3,
  FileText,
  Brain,
  Repeat,
  Settings,
  Trash2,
  Copy,
  Timer,
  CheckCircle2,
  Database,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type AutomationStatus = 'active' | 'paused';

interface AutomationAction {
  label: string;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  triggerIcon?: 'clock' | 'calendar' | 'zap' | 'bell';
  actions: AutomationAction[];
  status: AutomationStatus;
  lastRun: string;
}

interface RunHistoryEntry {
  date: string;
  status: 'success' | 'failed' | 'partial';
  duration: string;
  cost: string;
  output: string;
}

interface WorkflowTemplate {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  color: string;
  triggerIcon: 'clock' | 'calendar' | 'zap' | 'bell';
  trigger: string;
  actions: AutomationAction[];
}

// ── Static Data ──────────────────────────────────────────────────────────────

const AUTOMATIONS: Automation[] = [
  {
    id: '1',
    name: 'Daily Outlier Scout',
    trigger: 'Daily 9am',
    actions: [
      { label: 'Scan tracked channels' },
      { label: 'Flag >5x outliers' },
      { label: 'Generate brief' },
      { label: 'Notify' },
    ],
    status: 'active',
    lastRun: '2 hours ago',
  },
  {
    id: '2',
    name: 'Weekly Brief Generator',
    trigger: 'Monday 8am',
    actions: [
      { label: 'Compile top 10 outliers' },
      { label: 'Generate AI report' },
      { label: 'Email' },
    ],
    status: 'active',
    lastRun: '3 days ago',
  },
  {
    id: '3',
    name: 'Auto Hook A/B Test',
    trigger: 'New script saved',
    actions: [
      { label: 'Generate 4 hook variants' },
      { label: 'Score all variants' },
      { label: 'Add top 2 to queue' },
    ],
    status: 'paused',
    lastRun: '1 week ago',
  },
  {
    id: '4',
    name: 'Viral Alert',
    trigger: 'Channel posts >10x outlier',
    actions: [
      { label: 'Instant notification' },
      { label: 'Generate analysis brief' },
    ],
    status: 'active',
    lastRun: '5 hours ago',
  },
];

const RUN_HISTORY: RunHistoryEntry[] = [
  { date: 'Mar 25, 2026 09:00', status: 'success', duration: '1m 12s', cost: '$0.003', output: '4 outliers flagged' },
  { date: 'Mar 24, 2026 09:01', status: 'success', duration: '0m 58s', cost: '$0.002', output: '2 outliers flagged' },
  { date: 'Mar 23, 2026 09:00', status: 'partial', duration: '2m 04s', cost: '$0.004', output: '1 channel timeout' },
  { date: 'Mar 22, 2026 09:00', status: 'success', duration: '1m 05s', cost: '$0.003', output: '7 outliers flagged' },
  { date: 'Mar 21, 2026 09:03', status: 'failed',  duration: '0m 12s', cost: '$0.001', output: 'API rate limit hit' },
];

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 't1',
    icon: <TrendingUp className="w-5 h-5" />,
    name: 'Competitor Monitor',
    description: 'Watches rival channels and alerts you the moment a post goes viral.',
    color: 'from-red-500/20 to-orange-500/10',
    triggerIcon: 'clock',
    trigger: 'Every 6 hours',
    actions: [
      { label: 'Fetch latest videos from tracked channels' },
      { label: 'Score each video against channel median' },
      { label: 'Flag any video with outlier score > 5x' },
      { label: 'Send instant alert with video link + stats' },
    ],
  },
  {
    id: 't2',
    icon: <Zap className="w-5 h-5" />,
    name: 'Content Pipeline',
    description: 'Takes an idea all the way to published — script, thumbnail, and post.',
    color: 'from-blue-500/20 to-violet-500/10',
    triggerIcon: 'zap',
    trigger: 'New idea added to Vault',
    actions: [
      { label: 'Pull idea from Vault' },
      { label: 'Generate full script with AI' },
      { label: 'Generate 4 thumbnail concepts' },
      { label: 'Score CTR for each thumbnail' },
      { label: 'Add best thumbnail + script to publish queue' },
    ],
  },
  {
    id: 't3',
    icon: <Repeat className="w-5 h-5" />,
    name: 'A/B Test Loop',
    description: 'Auto-generates variants, deploys them, tracks performance, promotes the winner.',
    color: 'from-emerald-500/20 to-teal-500/10',
    triggerIcon: 'zap',
    trigger: 'New script saved',
    actions: [
      { label: 'Generate 4 hook variants for script' },
      { label: 'Score all variants with CTR model' },
      { label: 'Deploy top 2 as A/B test' },
      { label: 'Monitor for 48h — check views + CTR' },
      { label: 'Promote winner, archive loser' },
    ],
  },
  {
    id: 't4',
    icon: <Brain className="w-5 h-5" />,
    name: 'Brand Guardian',
    description: 'Checks every script for brand tone, language, and compliance before publishing.',
    color: 'from-violet-500/20 to-pink-500/10',
    triggerIcon: 'zap',
    trigger: 'Script marked "ready to publish"',
    actions: [
      { label: 'Run brand voice analysis on script' },
      { label: 'Flag off-brand words or phrases' },
      { label: 'Score brand compliance (0–100)' },
      { label: 'If score < 80, request revision' },
      { label: 'If score ≥ 80, approve and notify' },
    ],
  },
  {
    id: 't5',
    icon: <BarChart3 className="w-5 h-5" />,
    name: 'Trend Radar',
    description: 'Monitors TikTok and YouTube trending topics weekly and surfaces opportunities.',
    color: 'from-yellow-500/20 to-orange-500/10',
    triggerIcon: 'calendar',
    trigger: 'Every Monday at 8am',
    actions: [
      { label: 'Pull top 50 trending YouTube videos in niche' },
      { label: 'Pull top 50 TikTok trending sounds + topics' },
      { label: 'Cross-reference with Vault hooks' },
      { label: 'Identify gaps and new angle opportunities' },
      { label: 'Generate weekly opportunity brief' },
    ],
  },
  {
    id: 't6',
    icon: <FileText className="w-5 h-5" />,
    name: 'ROI Reporter',
    description: 'Sends a weekly performance email with views, revenue, and growth metrics.',
    color: 'from-teal-500/20 to-emerald-500/10',
    triggerIcon: 'calendar',
    trigger: 'Every Sunday at 6pm',
    actions: [
      { label: 'Aggregate views, watch time, and revenue' },
      { label: 'Calculate week-over-week growth rates' },
      { label: 'Identify top 3 and bottom 3 performers' },
      { label: 'Generate AI commentary on trends' },
      { label: 'Send formatted report email' },
    ],
  },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: AutomationStatus }) {
  return (
    <span
      className={cn(
        'w-2 h-2 rounded-full flex-shrink-0',
        status === 'active' ? 'bg-emerald-400' : 'bg-yellow-400',
      )}
    />
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={enabled}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer',
        enabled ? 'bg-emerald-500' : 'bg-zinc-600',
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
          enabled ? 'translate-x-4' : 'translate-x-1',
        )}
      />
    </div>
  );
}

function RunStatusBadge({ status }: { status: RunHistoryEntry['status'] }) {
  const map = {
    success: { label: 'Success', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    partial: { label: 'Partial',  cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    failed:  { label: 'Failed',   cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', cls)}>
      {label}
    </span>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

// ── Cron Helpers ─────────────────────────────────────────────────────────────

const CRON_PRESETS = [
  { label: 'Every day at 9am', cron: '0 9 * * *' },
  { label: 'Every Monday at 8am', cron: '0 8 * * 1' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Every weekday at 7am', cron: '0 7 * * 1-5' },
  { label: 'Every Sunday midnight', cron: '0 0 * * 0' },
];

function parseCronDescription(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'Invalid cron expression';
  const preset = CRON_PRESETS.find(p => p.cron === expr.trim());
  if (preset) return preset.label;
  const [min, hour, dom, month, dow] = parts;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let desc = '';
  if (min === '0' && hour !== '*') desc += `At ${parseInt(hour) > 12 ? parseInt(hour)-12+'pm' : hour+'am'}`;
  else if (min !== '*' && hour !== '*') desc += `At ${hour}:${min.padStart(2,'0')}`;
  else desc += 'At a scheduled time';
  if (dom !== '*') desc += ` on day ${dom}`;
  if (dow !== '*') desc += ` on ${dow.split(',').map(d => days[parseInt(d)] ?? d).join(', ')}`;
  if (month !== '*') desc += ` in ${month.split(',').map(m => months[parseInt(m)-1] ?? m).join(', ')}`;
  return desc;
}

function nextRunTimes(cron: string, count = 3): string[] {
  // Simplified next-run estimator based on preset patterns
  const now = new Date();
  const results: string[] = [];
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return ['Invalid expression'];
  const [minStr, hourStr] = parts;
  const min = minStr === '*' ? 0 : parseInt(minStr);
  const hour = hourStr === '*' ? now.getHours() : parseInt(hourStr);
  for (let i = 0; i < count; i++) {
    const next = new Date(now);
    next.setHours(hour, min, 0, 0);
    if (next <= now) next.setDate(next.getDate() + (i + 1));
    else next.setDate(next.getDate() + i);
    results.push(next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + next.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  }
  return results;
}

// Map trigger icon type → React node
const TRIGGER_ICON_MAP: Record<'clock' | 'calendar' | 'zap' | 'bell', React.ReactNode> = {
  clock:    <Clock    className="w-4 h-4 text-emerald-400" />,
  calendar: <Calendar className="w-4 h-4 text-emerald-400" />,
  zap:      <Zap      className="w-4 h-4 text-emerald-400" />,
  bell:     <Bell     className="w-4 h-4 text-emerald-400" />,
};

// Legacy ID-based fallback for seed automations that predate the triggerIcon field
const SEED_TRIGGER_ICONS: Record<string, React.ReactNode> = {
  '1': <Clock    className="w-4 h-4 text-emerald-400" />,
  '2': <Calendar className="w-4 h-4 text-emerald-400" />,
  '3': <Zap      className="w-4 h-4 text-emerald-400" />,
  '4': <Bell     className="w-4 h-4 text-emerald-400" />,
};

function getTriggerIcon(auto: Automation): React.ReactNode {
  if (auto.triggerIcon) return TRIGGER_ICON_MAP[auto.triggerIcon];
  return SEED_TRIGGER_ICONS[auto.id] ?? <Clock className="w-4 h-4 text-emerald-400" />;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(AUTOMATIONS);
  const [selectedId, setSelectedId] = useState<string>('1');
  const [cronExpr, setCronExpr] = useState('0 9 * * *');
  const [cronDeployed, setCronDeployed] = useState(false);
  const [cronDeploying, setCronDeploying] = useState(false);
  const [showCronPanel, setShowCronPanel] = useState(true);
  const [addedTemplateId, setAddedTemplateId] = useState<string | null>(null);
  const builderRef = useRef<HTMLDivElement>(null);

  const selected = automations.find((a) => a.id === selectedId) ?? automations[0];

  function applyTemplate(tpl: WorkflowTemplate) {
    const newId = `tpl-${Date.now()}`;
    const newAutomation: Automation = {
      id: newId,
      name: tpl.name,
      trigger: tpl.trigger,
      triggerIcon: tpl.triggerIcon,
      actions: tpl.actions,
      status: 'paused',
      lastRun: 'Never',
    };
    setAutomations(prev => [...prev, newAutomation]);
    setSelectedId(newId);
    setAddedTemplateId(tpl.id);
    setTimeout(() => setAddedTemplateId(null), 2000);
    // Scroll to builder
    setTimeout(() => builderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  async function deployCron() {
    setCronDeploying(true);
    // In production: supabase.rpc('schedule_automation', { name: selected.name, cron: cronExpr })
    await new Promise(r => setTimeout(r, 1400));
    setCronDeploying(false);
    setCronDeployed(true);
  }

  function toggleAutomation(id: string) {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
          : a,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-zinc-100 leading-none">Automation Engine</h1>
          <p className="text-[12px] text-zinc-500 mt-0.5">Set triggers, chain actions, run your content operation 24/7</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex" style={{ minHeight: 'calc(100vh - 65px)' }}>
        {/* ── Left: Workflow List ── */}
        <aside className="w-[360px] flex-shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-300">Your Automations</span>
            <button className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" />
              New Automation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {automations.map((auto) => (
              <button
                key={auto.id}
                onClick={() => setSelectedId(auto.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all',
                  selectedId === auto.id
                    ? 'bg-zinc-800 border-emerald-500/40'
                    : 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600',
                )}
              >
                {/* Row 1: status dot + name + toggle */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusDot status={auto.status} />
                    <span className="text-sm font-semibold text-zinc-100 truncate">{auto.name}</span>
                  </div>
                  <ToggleSwitch
                    enabled={auto.status === 'active'}
                    onToggle={() => toggleAutomation(auto.id)}
                  />
                </div>

                {/* Row 2: trigger badge + action count */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {getTriggerIcon(auto)}
                    {auto.trigger}
                  </span>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    {auto.actions.length} actions
                  </span>
                </div>

                {/* Row 3: last run */}
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="w-3 h-3" />
                  Last run: {auto.lastRun}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Right: Detail + Builder ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── Visual Builder ── */}
          <div ref={builderRef} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-100">{selected.name}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Visual workflow builder</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-2 rounded-lg transition-colors">
                  <Play className="w-3.5 h-3.5" />
                  Run Now
                </button>
              </div>
            </div>

            {/* Workflow diagram */}
            <div className="flex flex-col items-center gap-0 max-w-sm mx-auto">
              {/* Trigger block */}
              <div className="w-full border-2 border-emerald-500/50 bg-emerald-500/5 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    {getTriggerIcon(selected)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Trigger</p>
                    <p className="text-sm text-zinc-200">{selected.trigger}</p>
                  </div>
                </div>
              </div>

              {/* Action blocks with connectors */}
              {selected.actions.map((action, idx) => (
                <div key={idx} className="w-full flex flex-col items-center">
                  {/* Arrow connector */}
                  <div className="flex flex-col items-center py-1">
                    <div className="w-px h-4 bg-zinc-600" />
                    <ArrowDown className="w-4 h-4 text-zinc-500" />
                    <div className="w-px h-1 bg-zinc-600" />
                  </div>
                  {/* Action block */}
                  <div className="w-full border-2 border-blue-500/40 bg-blue-500/5 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-blue-400">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-zinc-200">{action.label}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Action */}
              <div className="flex flex-col items-center py-1">
                <div className="w-px h-4 bg-zinc-700" />
              </div>
              <button className="w-full border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-3 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Action</span>
              </button>
            </div>
          </div>

          {/* ── Cron Schedule (Supabase pg_cron) ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowCronPanel(v => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Timer className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-zinc-100">Cron Schedule</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Supabase pg_cron · Real database-level scheduling</p>
                </div>
                {cronDeployed && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-2">
                    <CheckCircle2 className="w-3 h-3" /> Deployed
                  </span>
                )}
              </div>
              {showCronPanel ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {showCronPanel && (
              <div className="border-t border-zinc-800 p-5 space-y-4">
                {/* Preset selector */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Quick Presets</label>
                  <div className="flex flex-wrap gap-2">
                    {CRON_PRESETS.map(p => (
                      <button
                        key={p.cron}
                        onClick={() => { setCronExpr(p.cron); setCronDeployed(false); }}
                        className={cn('text-[11px] px-2.5 py-1.5 rounded-lg border transition-all', cronExpr === p.cron ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-zinc-800 border-zinc-700/50 text-zinc-400 hover:text-zinc-200')}
                      >{p.label}</button>
                    ))}
                  </div>
                </div>

                {/* Manual cron input */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Cron Expression</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={cronExpr}
                      onChange={e => { setCronExpr(e.target.value); setCronDeployed(false); }}
                      className="flex-1 font-mono bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-[13px] text-emerald-300 focus:outline-none focus:border-emerald-500/60"
                      placeholder="0 9 * * *"
                    />
                    <code className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700/30 px-2 py-1 rounded">min hr dom mon dow</code>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1.5">
                    <span className="text-emerald-400 font-semibold">→ </span>{parseCronDescription(cronExpr)}
                  </p>
                </div>

                {/* Next run times */}
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Next 3 Scheduled Runs</label>
                  <div className="space-y-1.5">
                    {nextRunTimes(cronExpr, 3).map((t, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-[11px]">
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        <span className="text-zinc-400">{t}</span>
                        {i === 0 && <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">NEXT</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deploy button */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={deployCron}
                    disabled={cronDeploying || cronDeployed}
                    className={cn('flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-lg transition-all', cronDeployed ? 'bg-emerald-600/20 border border-emerald-600/30 text-emerald-300 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20')}
                  >
                    {cronDeploying
                      ? <><Database className="w-3.5 h-3.5 animate-pulse" /> Deploying to pg_cron…</>
                      : cronDeployed
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> Deployed to Supabase</>
                      : <><Database className="w-3.5 h-3.5" /> Deploy to Supabase pg_cron</>}
                  </button>
                  {cronDeployed && (
                    <span className="text-[11px] text-zinc-500">
                      SQL: <code className="text-zinc-400 font-mono">select cron.schedule(&apos;{selected.name}&apos;, &apos;{cronExpr}&apos;, ...)</code>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Run History ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Run History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Duration</th>
                    <th className="pb-2 pr-4 font-medium">Cost</th>
                    <th className="pb-2 font-medium">Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {RUN_HISTORY.map((run, idx) => (
                    <tr key={idx} className="text-zinc-400">
                      <td className="py-2.5 pr-4 text-zinc-300 text-xs whitespace-nowrap">{run.date}</td>
                      <td className="py-2.5 pr-4">
                        <RunStatusBadge status={run.status} />
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{run.duration}</td>
                      <td className="py-2.5 pr-4 text-emerald-400 font-mono text-xs">{run.cost}</td>
                      <td className="py-2.5 text-xs">{run.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Workflow Templates ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Workflow Templates</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Start from a proven automation pattern</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className={cn(
                    'border border-zinc-700/60 rounded-xl p-4 bg-gradient-to-br hover:border-zinc-600 transition-colors',
                    tpl.color,
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-zinc-800/70 rounded-lg flex items-center justify-center text-zinc-300">
                      {tpl.icon}
                    </div>
                    <span className="text-sm font-semibold text-zinc-200">{tpl.name}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{tpl.description}</p>
                  <button
                    onClick={() => applyTemplate(tpl)}
                    className={cn(
                      'w-full text-xs font-medium py-1.5 rounded-lg transition-all border flex items-center justify-center gap-1.5',
                      addedTemplateId === tpl.id
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border-zinc-700/50',
                    )}
                  >
                    {addedTemplateId === tpl.id ? (
                      <><Sparkles className="w-3 h-3" /> Added ✓</>
                    ) : (
                      'Use Template'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
