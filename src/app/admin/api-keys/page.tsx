'use client';

import { useState, useEffect } from 'react';
import {
  Key, TrendingUp, DollarSign, AlertCircle, CheckCircle,
  XCircle, RefreshCw, BarChart3, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSpend } from '@/lib/utils/spendEstimator';

interface ApiUsageLog {
  id: string;
  provider: string;
  endpoint: string;
  units_used: number;
  cost_usd: number;
  status: string;
  created_at: string;
}

interface ProviderStats {
  provider: string;
  totalCost: number;
  totalCalls: number;
  failureRate: number;
  last7Days: Array<{ date: string; cost: number; calls: number }>;
}

const PROVIDER_COLORS: Record<string, string> = {
  SCRAPE_CREATORS: '#6366f1',
  OPENAI: '#10b981',
  YOUTUBE_API: '#ef4444',
  default: '#94a3b8',
};

const PROVIDER_LIMITS: Record<string, number> = {
  SCRAPE_CREATORS: 500,
  OPENAI: 200,
  YOUTUBE_API: 50,
};

export default function ApiKeysAdminPage() {
  const [logs, setLogs] = useState<ApiUsageLog[]>([]);
  const [stats, setStats] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/api-usage?range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setLogs(data.logs ?? []);
      setStats(data.stats ?? []);
    } catch {
      // Fallback: try Supabase directly via client
      setLogs([]);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }

  const totalMonthCost = stats.reduce((s, p) => s + p.totalCost, 0);
  const totalCalls = stats.reduce((s, p) => s + p.totalCalls, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h1 className="text-2xl font-bold">API Cost Dashboard</h1>
            </div>
            <p className="text-sm text-zinc-500">Real-time tracking across ScrapeCreators, OpenAI, and YouTube API</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden text-sm">
              {(['7d', '30d'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn('px-3 py-1.5 transition-colors', timeRange === r ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-800')}
                >
                  {r === '7d' ? 'Last 7 days' : 'Last 30 days'}
                </button>
              ))}
            </div>
            <button onClick={loadData} className="p-2 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors">
              <RefreshCw className={cn('w-4 h-4 text-zinc-400', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Total Spend ({timeRange})</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{formatSpend(totalMonthCost)}</div>
            <div className="text-xs text-zinc-500 mt-1">${totalMonthCost.toFixed(2)} exact</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">API Calls</span>
            </div>
            <div className="text-3xl font-bold">{totalCalls.toLocaleString()}</div>
            <div className="text-xs text-zinc-500 mt-1">Across {stats.length} providers</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Avg Cost / Call</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              ${totalCalls > 0 ? (totalMonthCost / totalCalls).toFixed(4) : '0.0000'}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Efficiency metric</div>
          </div>
        </div>

        {/* Provider Budget Meters */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Provider Budget Utilization</h2>
          <div className="grid grid-cols-1 gap-3">
            {loading ? (
              <div className="text-sm text-zinc-600 py-4">Loading...</div>
            ) : stats.length === 0 ? (
              <EmptyState />
            ) : (
              stats.map(provider => (
                <ProviderRow
                  key={provider.provider}
                  provider={provider}
                  limit={PROVIDER_LIMITS[provider.provider] ?? 100}
                  color={PROVIDER_COLORS[provider.provider] ?? PROVIDER_COLORS.default}
                  isExpanded={expandedProvider === provider.provider}
                  onToggle={() => setExpandedProvider(prev => prev === provider.provider ? null : provider.provider)}
                />
              ))
            )}
          </div>
        </div>

        {/* Recent Logs Table */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Recent API Calls</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Provider</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Endpoint</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Units</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Cost</th>
                  <th className="text-center px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-600">
                      No API calls logged yet. Run a search or competitor scrape to see data here.
                    </td>
                  </tr>
                ) : (
                  logs.slice(0, 50).map(log => (
                    <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: (PROVIDER_COLORS[log.provider] ?? PROVIDER_COLORS.default) + '20', color: PROVIDER_COLORS[log.provider] ?? PROVIDER_COLORS.default }}
                        >
                          {log.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{log.endpoint}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{log.units_used.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-semibold">${log.cost_usd.toFixed(4)}</td>
                      <td className="px-4 py-3 text-center">
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold text-sm">Required Environment Variables</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {[
              ['SCRAPE_CREATORS_API_KEY', 'ScrapeCreators dashboard'],
              ['OPENAI_API_KEY', 'platform.openai.com/api-keys'],
              ['YOUTUBE_API_KEY', 'Google Cloud Console'],
              ['CRON_SECRET', 'Random string for CRON auth'],
              ['SC_WEBHOOK_SECRET', 'Random string for webhook auth'],
              ['RESEND_API_KEY', 'resend.com for alert emails'],
            ].map(([key, source]) => (
              <div key={key} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-2">
                <span className="text-indigo-400">{key}</span>
                <span className="text-zinc-600">—</span>
                <span className="text-zinc-500">{source}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProviderRow({
  provider,
  limit,
  color,
  isExpanded,
  onToggle,
}: {
  provider: ProviderStats;
  limit: number;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const pct = Math.min((provider.totalCost / limit) * 100, 100);
  const isOver80 = pct >= 80;
  const isOver100 = pct >= 100;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/30 transition-colors">
        <div className="w-28 text-left">
          <span className="text-sm font-semibold" style={{ color }}>{provider.provider}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">${provider.totalCost.toFixed(2)} / ${limit} limit</span>
            <span className={cn('text-xs font-semibold', isOver100 ? 'text-red-400' : isOver80 ? 'text-orange-400' : 'text-zinc-400')}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: isOver100 ? '#ef4444' : isOver80 ? '#f97316' : color }}
            />
          </div>
        </div>

        <div className="text-right w-20 shrink-0">
          <div className="text-sm font-semibold">{provider.totalCalls.toLocaleString()}</div>
          <div className="text-xs text-zinc-500">calls</div>
        </div>

        <div className="text-right w-16 shrink-0">
          <div className="text-xs text-zinc-500">{(provider.failureRate * 100).toFixed(0)}% fail</div>
        </div>

        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
      </button>

      {isExpanded && provider.last7Days.length > 0 && (
        <div className="px-5 pb-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mt-3 mb-2">Daily Breakdown (Last 7 Days)</p>
          <div className="grid grid-cols-7 gap-1">
            {provider.last7Days.map(day => (
              <div key={day.date} className="text-center">
                <div className="text-xs text-zinc-400 font-semibold">${day.cost.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-600">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
      <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="text-sm text-zinc-500 mb-1">No API usage data yet</p>
      <p className="text-xs text-zinc-600">
        Run the SQL migration (<code className="text-indigo-400">ad-intel-schema.sql</code>) then trigger a search or competitor scrape.
      </p>
    </div>
  );
}
