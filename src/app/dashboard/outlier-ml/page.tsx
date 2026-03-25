'use client';

import { useState } from 'react';
import {
  BrainCircuit, TrendingUp, BarChart3, Target, Clock,
  RefreshCw, AlertCircle, CheckCircle2, Loader2,
  ChevronRight, FlaskConical, Database,
  Eye, Activity, Layers,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

// ── Predictive Outlier Model ───────────────────────────────────────────────────
// In production: scikit-learn / XGBoost model serialized to ONNX, served via
// Supabase Edge Function. Training pipeline: weekly batch job via pg_cron →
// pulls usage_events + videos table → retrains → writes model version to storage.

// Feature importance weights (from mock trained model v1.4)
const FEATURE_IMPORTANCES = [
  { feature: 'Views in first 24h', importance: 0.284, description: 'Strongest early signal' },
  { feature: 'CTR in first 1h (impressions)', importance: 0.218, description: 'Hook performance indicator' },
  { feature: 'Hook formula type', importance: 0.142, description: 'Curiosity Gap outperforms 2.1x' },
  { feature: 'Channel subscriber count', importance: 0.118, description: 'Normalization baseline' },
  { feature: 'Video duration (seconds)', importance: 0.094, description: '4-7 min sweet spot in this niche' },
  { feature: 'Day of week published', importance: 0.071, description: 'Tuesday-Thursday +18% lift' },
  { feature: 'Topic cluster embedding', importance: 0.048, description: 'Semantic similarity to past outliers' },
  { feature: 'Thumbnail formula', importance: 0.025, description: 'Face + emotion +12% CTR' },
];

// Model performance metrics
const MODEL_METRICS = {
  version: '1.4.2',
  trainedOn: '847 videos',
  accuracy: 87.3,
  precision: 84.1,
  recall: 89.2,
  f1: 86.6,
  auc: 0.921,
  trainedAt: 'Mar 22, 2026',
  nextRetrainAt: 'Mar 29, 2026',
};

// Predicted outlier candidates (next 7 days)
interface PredictedVideo {
  id: string;
  title: string;
  channel: string;
  predictedScore: number;
  confidencePct: number;
  earlySignal: string;
  publishedHoursAgo: number;
  currentViews: number;
  predictedFinalViews: number;
  riskFactors: string[];
  topFeatures: { name: string; contribution: number }[];
  gradient: string;
}

const PREDICTED_OUTLIERS: PredictedVideo[] = [
  {
    id: 'p1',
    title: 'How I Made $47K This Month Without Posting More Content',
    channel: '@alexhormozi',
    predictedScore: 14.8,
    confidencePct: 91,
    earlySignal: 'First-hour CTR: 22.4% (3.1x above channel avg)',
    publishedHoursAgo: 6,
    currentViews: 48_200,
    predictedFinalViews: 2_840_000,
    riskFactors: [],
    topFeatures: [
      { name: 'First-hour CTR', contribution: 0.42 },
      { name: 'Hook formula: Curiosity Gap', contribution: 0.28 },
      { name: 'Tuesday publish', contribution: 0.14 },
    ],
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'p2',
    title: 'The AI Tool That Made My Team Obsolete (I Use It Every Day)',
    channel: '@techfounder',
    predictedScore: 11.2,
    confidencePct: 84,
    earlySignal: '24h velocity: 8,400 views/hr — 5.8x channel norm',
    publishedHoursAgo: 22,
    currentViews: 182_000,
    predictedFinalViews: 1_640_000,
    riskFactors: ['Competing video published same day by @mrwhosetheboss'],
    topFeatures: [
      { name: '24h view velocity', contribution: 0.51 },
      { name: 'AI topic cluster', contribution: 0.22 },
      { name: 'Face + emotion thumbnail', contribution: 0.18 },
    ],
    gradient: 'from-violet-500 to-indigo-500',
  },
  {
    id: 'p3',
    title: 'My First $100K Month at 24 — The Exact Breakdown',
    channel: '@sidehustlemike',
    predictedScore: 8.7,
    confidencePct: 76,
    earlySignal: 'Comment depth rate: 4.2x baseline (deep engagement)',
    publishedHoursAgo: 38,
    currentViews: 94_000,
    predictedFinalViews: 812_000,
    riskFactors: ['Slow first-6h start; recovery detected at 12h'],
    topFeatures: [
      { name: 'Comment depth rate', contribution: 0.38 },
      { name: 'Before/After thumbnail', contribution: 0.27 },
      { name: 'Income niche cluster', contribution: 0.21 },
    ],
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'p4',
    title: 'I Spent $10K On Ads So You Don\'t Have To — Results Inside',
    channel: '@codiesanchez',
    predictedScore: 7.1,
    confidencePct: 68,
    earlySignal: 'Share rate 2.8x baseline — viral coefficient building',
    publishedHoursAgo: 51,
    currentViews: 61_000,
    predictedFinalViews: 430_000,
    riskFactors: ['Below-avg CTR (6.1%) may cap ceiling', 'High duration (12min) reducing completion'],
    topFeatures: [
      { name: 'Share rate velocity', contribution: 0.33 },
      { name: 'E-commerce niche cluster', contribution: 0.29 },
      { name: 'First 24h views', contribution: 0.24 },
    ],
    gradient: 'from-blue-500 to-cyan-500',
  },
];

// Training data snapshot
const TRAINING_SNAPSHOT = [
  { week: 'W1',  outliers: 4, total: 12, accuracy: 75 },
  { week: 'W2',  outliers: 6, total: 14, accuracy: 78 },
  { week: 'W3',  outliers: 3, total: 11, accuracy: 81 },
  { week: 'W4',  outliers: 7, total: 15, accuracy: 82 },
  { week: 'W5',  outliers: 5, total: 13, accuracy: 84 },
  { week: 'W6',  outliers: 8, total: 16, accuracy: 85 },
  { week: 'W7',  outliers: 6, total: 14, accuracy: 87 },
  { week: 'W8',  outliers: 9, total: 17, accuracy: 87 },
];

// Confidence level color
function confColor(conf: number) {
  if (conf >= 85) return 'text-emerald-400';
  if (conf >= 70) return 'text-yellow-400';
  return 'text-orange-400';
}

function scoreColor(score: number) {
  if (score >= 10) return 'text-yellow-400';
  if (score >= 7) return 'text-emerald-400';
  return 'text-blue-400';
}

export default function OutlierMLPage() {
  const [retraining, setRetraining] = useState(false);
  const [retrained, setRetrained] = useState(false);
  const [expandedId, setExpandedId] = useState<string>('p1');
  const [activeTab, setActiveTab] = useState<'predictions' | 'model' | 'training'>('predictions');

  async function retrainModel() {
    setRetraining(true);
    setRetrained(false);
    await new Promise(r => setTimeout(r, 3200));
    setRetraining(false);
    setRetrained(true);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Predictive Outlier Modeling</h1>
            <span className="text-[10px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full tracking-wider">AI · ML</span>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">ML model trained on your internal video data — predicts outlier probability from early signals.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-zinc-500">Model v{MODEL_METRICS.version}</p>
            <p className="text-[10px] text-zinc-600">Trained {MODEL_METRICS.trainedAt} · {MODEL_METRICS.accuracy}% accuracy</p>
          </div>
          <button
            onClick={retrainModel}
            disabled={retraining}
            className={cn('flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-xl transition-all', retrained ? 'bg-emerald-600/20 border border-emerald-600/30 text-emerald-300' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20')}
          >
            {retraining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : retrained ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {retraining ? 'Retraining…' : retrained ? 'Retrained!' : 'Retrain Model'}
          </button>
        </div>
      </div>

      {/* Model KPI strip */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Accuracy', value: `${MODEL_METRICS.accuracy}%`, color: 'text-violet-400' },
          { label: 'Precision', value: `${MODEL_METRICS.precision}%`, color: 'text-blue-400' },
          { label: 'Recall', value: `${MODEL_METRICS.recall}%`, color: 'text-emerald-400' },
          { label: 'F1 Score', value: `${MODEL_METRICS.f1}%`, color: 'text-yellow-400' },
          { label: 'AUC-ROC', value: MODEL_METRICS.auc.toFixed(3), color: 'text-pink-400' },
          { label: 'Training Set', value: MODEL_METRICS.trainedOn, color: 'text-cyan-400' },
        ].map(m => (
          <div key={m.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 text-center">
            <p className={cn('text-[18px] font-bold', m.color)}>{m.value}</p>
            <p className="text-[9px] text-zinc-600 mt-0.5 uppercase tracking-wider">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1">
        {([
          { id: 'predictions', label: 'Live Predictions', icon: TrendingUp },
          { id: 'model', label: 'Model Insights', icon: FlaskConical },
          { id: 'training', label: 'Training Data', icon: Database },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn('flex items-center gap-1.5 flex-1 py-2 rounded-lg text-[12px] font-medium justify-center transition-all', activeTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PREDICTIONS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'predictions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] text-zinc-500">
              {PREDICTED_OUTLIERS.length} videos currently being tracked · Model scores updated every 30 min
            </p>
            <p className="text-[11px] text-zinc-600">
              <Clock className="w-3 h-3 inline mr-1" />Next update: 28 min
            </p>
          </div>

          {PREDICTED_OUTLIERS.map(vid => {
            const isExpanded = expandedId === vid.id;
            return (
              <div key={vid.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? '' : vid.id)}
                  className="w-full text-left p-4 hover:bg-zinc-800/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Score badge */}
                    <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center flex-shrink-0 text-white', vid.gradient)}>
                      <span className="text-[18px] font-black leading-none">{vid.predictedScore}x</span>
                      <span className="text-[8px] font-bold opacity-80 leading-none mt-0.5">PREDICTED</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[14px] font-semibold text-zinc-100 truncate">{vid.title}</p>
                        {vid.riskFactors.length === 0 && (
                          <span className="flex-shrink-0 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">CLEAN</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">{vid.channel} · {vid.publishedHoursAgo}h ago · {formatNumber(vid.currentViews)} current views</p>
                      <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-violet-400 flex-shrink-0" />
                        {vid.earlySignal}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 space-y-1">
                      <p className={cn('text-[13px] font-bold', confColor(vid.confidencePct))}>{vid.confidencePct}% confident</p>
                      <p className="text-[11px] text-zinc-500">→ {formatNumber(vid.predictedFinalViews)} views</p>
                      <div className="flex items-center gap-1 justify-end">
                        <div className="h-1.5 w-20 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full bg-gradient-to-r', vid.gradient)} style={{ width: `${vid.confidencePct}%` }} />
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={cn('w-4 h-4 text-zinc-600 flex-shrink-0 transition-transform', isExpanded && 'rotate-90')} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800/60 p-4 bg-zinc-950/30 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Top Feature Contributions</p>
                        <div className="space-y-2">
                          {vid.topFeatures.map(f => (
                            <div key={f.name}>
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-zinc-400">{f.name}</span>
                                <span className="text-violet-400 font-bold">{(f.contribution * 100).toFixed(0)}%</span>
                              </div>
                              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${f.contribution * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Projected View Curve</p>
                        <svg viewBox="0 0 180 60" className="w-full">
                          {(() => {
                            const current = vid.currentViews;
                            const final = vid.predictedFinalViews;
                            const progress = current / final;
                            const pts = Array.from({ length: 20 }, (_, i) => {
                              const t = i / 19;
                              // Logistic growth curve
                              const projected = final / (1 + Math.exp(-10 * (t - 0.3)));
                              return { x: t * 180, y: 55 - (projected / final) * 50 };
                            });
                            const currentX = progress * 180;
                            const path = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
                            return (
                              <>
                                <path d={path} stroke="#8b5cf6" strokeWidth="2" fill="none" strokeDasharray="3 2" />
                                <line x1={currentX} y1="0" x2={currentX} y2="60" stroke="#6d28d9" strokeWidth="1" strokeDasharray="2 2" />
                                <circle cx={currentX} cy={55 - (current / final) * 50} r="3" fill="#8b5cf6" />
                                <text x={currentX + 4} y="15" fontSize="7" fill="#7c3aed">Now</text>
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Risk Factors</p>
                        {vid.riskFactors.length === 0 ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            No risk factors detected
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {vid.riskFactors.map((r, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[10px] text-yellow-400 bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-2.5 py-1.5">
                                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                {r}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-3">
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1.5">Prediction Summary</p>
                          <div className="space-y-1 text-[10px] text-zinc-500">
                            <div className="flex justify-between"><span>Current views</span><span className="text-zinc-300 font-semibold">{formatNumber(vid.currentViews)}</span></div>
                            <div className="flex justify-between"><span>Predicted final</span><span className={cn('font-bold', scoreColor(vid.predictedScore))}>{formatNumber(vid.predictedFinalViews)}</span></div>
                            <div className="flex justify-between"><span>Confidence</span><span className={cn('font-bold', confColor(vid.confidencePct))}>{vid.confidencePct}%</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODEL INSIGHTS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'model' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {/* Feature importance */}
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <h3 className="text-[13px] font-bold text-zinc-200 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                Feature Importance (XGBoost)
              </h3>
              <div className="space-y-3">
                {FEATURE_IMPORTANCES.map(f => (
                  <div key={f.feature}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <div>
                        <span className="text-zinc-300 font-medium">{f.feature}</span>
                        <span className="text-zinc-600 ml-2">{f.description}</span>
                      </div>
                      <span className="text-violet-400 font-bold">{(f.importance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full" style={{ width: `${f.importance * 100 / 0.284 * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confusion matrix + ROC */}
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
                <h3 className="text-[13px] font-bold text-zinc-200 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  Confusion Matrix (Test Set)
                </h3>
                <div className="grid grid-cols-2 gap-2 max-w-[200px] mx-auto">
                  {[
                    { label: 'True Outlier', count: 74, bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400' },
                    { label: 'False Positive', count: 11, bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
                    { label: 'False Negative', count: 9, bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' },
                    { label: 'True Non-Outlier', count: 76, bg: 'bg-blue-500/15 border-blue-500/25', text: 'text-blue-400' },
                  ].map(cell => (
                    <div key={cell.label} className={cn('border rounded-xl p-3 text-center', cell.bg)}>
                      <p className={cn('text-[20px] font-black', cell.text)}>{cell.count}</p>
                      <p className="text-[9px] text-zinc-500 leading-tight">{cell.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 text-center mt-2">Threshold: 0.52 · 170 test samples</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
                <h3 className="text-[13px] font-bold text-zinc-200 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-pink-400" />
                  Score Distribution
                </h3>
                <div className="flex items-end gap-1 h-16">
                  {[12, 28, 45, 62, 78, 85, 74, 58, 41, 24, 14, 7].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end">
                      <div
                        className={cn('rounded-t-sm', i >= 8 ? 'bg-yellow-500/60' : i >= 5 ? 'bg-violet-500/60' : 'bg-zinc-700/60')}
                        style={{ height: `${(h / 85) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                  <span>0x</span><span>Outlier score →</span><span>15x+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Model architecture */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
            <h3 className="text-[13px] font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
              Model Architecture
            </h3>
            <div className="grid grid-cols-4 gap-4 text-[11px]">
              {[
                { step: '1', title: 'Feature Engineering', desc: 'Pull early signals from videos table every 30min — views/hr, CTR, comment velocity', icon: Database, color: 'text-blue-400' },
                { step: '2', title: 'XGBoost Classifier', desc: 'Gradient boosted trees trained on 847 labeled videos (outlier: score ≥ 5x)', icon: FlaskConical, color: 'text-violet-400' },
                { step: '3', title: 'Probability Calibration', desc: 'Platt scaling for well-calibrated confidence scores (Brier score: 0.091)', icon: Target, color: 'text-emerald-400' },
                { step: '4', title: 'Weekly Retraining', desc: 'pg_cron job: Sunday midnight — retrain on last 90 days of data, deploy new model', icon: RefreshCw, color: 'text-orange-400' },
              ].map(s => (
                <div key={s.step} className="bg-zinc-800/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center bg-zinc-800 text-[11px] font-black', s.color)}>{s.step}</div>
                    <s.icon className={cn('w-3.5 h-3.5', s.color)} />
                  </div>
                  <p className="font-semibold text-zinc-200 mb-1">{s.title}</p>
                  <p className="text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TRAINING DATA TAB ─────────────────────────────────────────────── */}
      {activeTab === 'training' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Training Videos', value: '847', sub: 'From your channel history', color: 'text-violet-400' },
              { label: 'Outlier Labels', value: '312', sub: '36.8% positive rate', color: 'text-yellow-400' },
              { label: 'Next Retrain', value: 'Mar 29', sub: `${MODEL_METRICS.nextRetrainAt} · Sunday midnight`, color: 'text-emerald-400' },
            ].map(c => (
              <div key={c.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5 text-center">
                <p className={cn('text-[30px] font-black', c.color)}>{c.value}</p>
                <p className="text-[12px] font-semibold text-zinc-400 mt-1">{c.label}</p>
                <p className="text-[10px] text-zinc-600">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
            <h3 className="text-[13px] font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Model Accuracy Over Training Iterations
            </h3>
            <div className="flex items-end gap-3 h-28">
              {TRAINING_SNAPSHOT.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-emerald-400 font-bold">{w.accuracy}%</span>
                  <div className="w-full flex flex-col gap-0.5">
                    <div
                      className="w-full bg-emerald-500/50 rounded-t-sm"
                      style={{ height: `${(w.accuracy - 70) * 4}px` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-600">{w.week}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600 mt-2 text-center">
              Accuracy improved from 75% → 87.3% over 8 training iterations as more labeled data was accumulated
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
            <h3 className="text-[13px] font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Label Distribution by Niche
            </h3>
            <div className="space-y-2.5">
              {[
                { niche: 'Business / Finance', outliers: 128, total: 312, color: 'bg-emerald-500/60' },
                { niche: 'Fitness / Health', outliers: 84, total: 198, color: 'bg-blue-500/60' },
                { niche: 'Tech / AI', outliers: 67, total: 156, color: 'bg-violet-500/60' },
                { niche: 'Lifestyle / Creator', outliers: 33, total: 181, color: 'bg-orange-500/60' },
              ].map(n => {
                const pct = (n.outliers / n.total) * 100;
                return (
                  <div key={n.niche}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">{n.niche}</span>
                      <span className="text-zinc-500">{n.outliers} / {n.total} outliers <span className="text-zinc-400 font-semibold">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', n.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
