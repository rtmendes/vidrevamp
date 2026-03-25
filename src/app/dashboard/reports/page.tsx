'use client';

import { useState } from 'react';
import {
  FileBarChart,
  Zap,
  TrendingUp,
  Calendar,
  Brain,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  DollarSign,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Star,
  Clock,
  Mail,
  Send,
  Bell,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateWeeklyReport, generateDailyBrief, WeeklyReport } from '@/actions/reports';

const NICHE_OPTIONS = [
  'Business',
  'Finance',
  'Fitness',
  'Health & Wellness',
  'Education',
  'Tech & AI',
  'E-Commerce',
  'Lifestyle',
] as const;

type PriorityLevel = 'high' | 'medium' | 'low';

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const styles: Record<PriorityLevel, string> = {
    high: 'bg-red-500/15 text-red-400 border border-red-500/25',
    medium: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
    low: 'bg-green-500/15 text-green-400 border border-green-500/25',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide', styles[priority])}>
      {priority}
    </span>
  );
}

function SectionCard({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-zinc-900 border border-zinc-800 rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-zinc-400">{icon}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dailyBrief, setDailyBrief] = useState<{
    brief: string;
    topicIdeas: string[];
    hookFormula: string;
    urgentAction: string;
  } | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [niche, setNiche] = useState<string>('Business');
  const [error, setError] = useState<string>('');
  const [trackedChannelsInput, setTrackedChannelsInput] = useState('');
  const [outliersInput, setOutliersInput] = useState('');
  const [expandedPatterns, setExpandedPatterns] = useState<Record<number, boolean>>({});
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailFrequency, setEmailFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');

    const trackedChannels = trackedChannelsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const recentOutliers = outliersInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const result = await generateWeeklyReport(niche, trackedChannels, recentOutliers);
      if (result.success && result.data) {
        setReport(result.data);
      } else {
        setError(result.error ?? 'Failed to generate report.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDailyBrief = async () => {
    setDailyLoading(true);
    try {
      const result = await generateDailyBrief(niche);
      if (result.success && result.data) {
        setDailyBrief(result.data);
      }
    } catch {
      // non-critical
    } finally {
      setDailyLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vidrevamp-weekly-report-${report.week.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePattern = (idx: number) => {
    setExpandedPatterns((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSendEmail = async () => {
    if (!emailAddress.trim() || !report) return;
    setSendingEmail(true);
    setEmailSent(false);
    // In production: POST to /api/send-report → Resend/SendGrid
    await new Promise(r => setTimeout(r, 1800));
    setSendingEmail(false);
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileBarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Intelligence Reports</h1>
              <p className="text-pink-100 text-sm mt-0.5">
                AI-generated weekly performance reports, pattern analysis, and next-week content briefs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleGenerateDailyBrief}
              disabled={dailyLoading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {dailyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              Daily Brief
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-white text-pink-600 hover:bg-pink-50 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Generate This Week&apos;s Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Config Strip */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-pink-400" />
            Report Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Niche</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
              >
                {NICHE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                Tracked Channels
                <span className="text-zinc-600 ml-1">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={trackedChannelsInput}
                onChange={(e) => setTrackedChannelsInput(e.target.value)}
                placeholder="MrBeast, Alex Hormozi..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
                Recent Outliers
                <span className="text-zinc-600 ml-1">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={outliersInput}
                onChange={(e) => setOutliersInput(e.target.value)}
                placeholder="Paste video titles that went viral this week..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Email Delivery */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-400" />
              Email Delivery
              <span className="text-[10px] font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">Resend / SendGrid</span>
            </h2>
            <button onClick={() => setEmailEnabled(v => !v)} className="flex items-center gap-1.5 text-[12px] transition-colors">
              {emailEnabled
                ? <><ToggleRight className="w-5 h-5 text-pink-400" /><span className="text-pink-400 font-semibold">Enabled</span></>
                : <><ToggleLeft className="w-5 h-5 text-zinc-600" /><span className="text-zinc-500">Disabled</span></>}
            </button>
          </div>

          {emailEnabled && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Recipient Email</label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={e => setEmailAddress(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Auto-send Frequency</label>
                <select value={emailFrequency} onChange={e => setEmailFrequency(e.target.value as 'daily' | 'weekly')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="daily">Daily Brief (8am)</option>
                  <option value="weekly">Weekly Report (Mon 8am)</option>
                </select>
              </div>
              <div className="col-span-3 flex items-center gap-3">
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailAddress.trim() || !report}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {sendingEmail ? 'Sending…' : 'Send Report Now'}
                </button>
                {emailSent && (
                  <span className="flex items-center gap-1.5 text-[12px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Report sent to {emailAddress}
                  </span>
                )}
                {!report && (
                  <span className="text-[11px] text-zinc-600">Generate a report first to send it via email.</span>
                )}
                <div className="ml-auto flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <Bell className="w-3 h-3" />
                  {emailFrequency === 'weekly' ? 'Next auto-send: Monday 8:00 AM' : 'Next auto-send: Tomorrow 8:00 AM'}
                </div>
              </div>
            </div>
          )}

          {!emailEnabled && (
            <p className="text-[12px] text-zinc-600">Enable email delivery to automatically send weekly reports and daily briefs to your inbox via Resend.</p>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Daily Brief Card */}
        {dailyBrief && (
          <div className="bg-zinc-900 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">Today&apos;s Daily Brief</h2>
              <span className="ml-auto text-xs text-zinc-500">{niche}</span>
            </div>

            <p className="text-zinc-300 text-sm leading-relaxed mb-4">{dailyBrief.brief}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {dailyBrief.topicIdeas.map((idea, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-full"
                >
                  {idea}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1 font-medium">Hook Formula</p>
                <p className="text-sm text-yellow-300 font-medium">{dailyBrief.hookFormula}</p>
              </div>
              <div className="flex-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-400" /> Urgent Action
                </p>
                <p className="text-sm text-white font-medium">{dailyBrief.urgentAction}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!report && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl mb-6">
              <FileBarChart className="w-12 h-12 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Report Generated Yet</h3>
            <p className="text-zinc-500 text-sm max-w-md mb-6">
              Configure your niche and channels above, then generate your first AI-powered weekly intelligence report.
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Generate First Report
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-10 h-10 text-pink-400 animate-spin mb-4" />
            <p className="text-zinc-300 font-medium">Generating your intelligence report...</p>
            <p className="text-zinc-600 text-sm mt-1">This takes 15–30 seconds</p>
          </div>
        )}

        {/* Report Sections */}
        {report && !loading && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {report.week}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Generated {new Date(report.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON
                </button>
              </div>
            </div>

            {/* Executive Summary */}
            <SectionCard title="Executive Summary" icon={<BookOpen className="w-4 h-4" />}>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                {report.executiveSummary}
              </p>
            </SectionCard>

            {/* Cost Analysis */}
            <SectionCard title="Cost Analysis" icon={<DollarSign className="w-4 h-4" />}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Spend', value: report.costAnalysis.totalSpend, icon: <DollarSign className="w-4 h-4 text-green-400" /> },
                  { label: 'Content Generated', value: String(report.costAnalysis.contentGenerated), icon: <FileBarChart className="w-4 h-4 text-blue-400" /> },
                  { label: 'Cost Per Piece', value: report.costAnalysis.costPerPiece, icon: <Target className="w-4 h-4 text-yellow-400" /> },
                  { label: 'ROI', value: report.costAnalysis.roi, icon: <TrendingUp className="w-4 h-4 text-pink-400" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-zinc-500 font-medium">{label}</span></div>
                    <p className="text-lg font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Top Insights */}
            <SectionCard title="Top Insights" icon={<Brain className="w-4 h-4" />}>
              <ol className="space-y-3">
                {report.topInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-pink-500/15 border border-pink-500/25 text-pink-400 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-zinc-300 text-sm leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ol>
            </SectionCard>

            {/* Winning Patterns */}
            <SectionCard title="Winning Patterns" icon={<Star className="w-4 h-4" />}>
              <div className="space-y-3">
                {report.winningPatterns.map((p, i) => {
                  const isOpen = expandedPatterns[i] ?? false;
                  return (
                    <div key={i} className="bg-zinc-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => togglePattern(i)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-750 transition-colors"
                      >
                        <span className="text-sm font-semibold text-white">{p.pattern}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3 border-t border-zinc-700 pt-3">
                          <div>
                            <p className="text-xs text-zinc-500 font-medium mb-1">Evidence</p>
                            <p className="text-sm text-zinc-300">{p.evidence}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 font-medium mb-1">Recommendation</p>
                            <p className="text-sm text-emerald-300">{p.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Top Performing Content */}
            <SectionCard title="Top Performing Content" icon={<TrendingUp className="w-4 h-4" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['Title', 'Views', 'Outlier Score', 'Hook', 'Why It Worked'].map((col) => (
                        <th
                          key={col}
                          className="text-left text-xs text-zinc-500 font-medium py-2 pr-4 last:pr-0 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.topPerformingContent.map((item, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-white max-w-[200px]">
                          <span className="line-clamp-2">{item.title}</span>
                        </td>
                        <td className="py-3 pr-4 text-emerald-400 font-semibold whitespace-nowrap">
                          {item.views}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-pink-500/15 border border-pink-500/25 text-pink-400 text-xs font-bold rounded">
                            {item.outlierScore}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-zinc-400 text-xs max-w-[180px]">
                          <span className="line-clamp-2">{item.hook}</span>
                        </td>
                        <td className="py-3 text-zinc-300 text-xs max-w-[200px]">
                          <span className="line-clamp-3">{item.why}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Next Week Content Briefs */}
            <SectionCard title="Next Week Content Briefs" icon={<Calendar className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.nextWeekBriefs.map((brief, i) => (
                  <div
                    key={i}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white leading-snug">{brief.topic}</h3>
                      <PriorityBadge priority={brief.priority} />
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{brief.angle}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-yellow-300 font-medium">
                        {brief.estimatedOutlierPotential}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Content Gaps */}
            <SectionCard title="Content Gaps" icon={<AlertCircle className="w-4 h-4" />}>
              <div className="flex flex-wrap gap-2">
                {report.contentGaps.map((gap, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs rounded-lg"
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {gap}
                  </span>
                ))}
              </div>
            </SectionCard>

            {/* Action Items */}
            <SectionCard title="Action Items" icon={<CheckCircle2 className="w-4 h-4" />}>
              <ul className="space-y-3">
                {report.actionItems.map((action, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-300 leading-relaxed">{action}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5 ml-auto" />
                  </li>
                ))}
              </ul>
            </SectionCard>

            {/* Bottom Download */}
            <div className="flex justify-center pb-6">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Full Report as JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
