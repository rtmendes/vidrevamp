'use client';

import { useState } from 'react';
import {
  User,
  CreditCard,
  Key,
  Globe,
  Bell,
  Shield,
  Crown,
  Check,
  Zap,
  Mail,
  Smartphone,
  AlertTriangle,
  BarChart3,
  Languages,
  Cpu,
  Monitor,
  SlidersHorizontal,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const PLAN_TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For individuals just getting started',
    features: ['10 AI credits/month', '3 watchlists', 'Basic transcript search', 'Vault storage (20 items)'],
    cta: 'Current Plan',
    current: true,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For serious content creators',
    features: ['500 AI credits/month', 'Unlimited watchlists', 'GPT-4o Vision analysis', 'Vault storage (unlimited)', 'Translation to 11 languages', 'Apify data pipeline'],
    cta: 'Upgrade to Pro',
    current: false,
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$199',
    period: '/month',
    description: 'For teams and agencies',
    features: ['Unlimited AI credits', 'Team collaboration (5 seats)', 'White-label exports', 'Priority support', 'Custom integrations', 'Advanced analytics'],
    cta: 'Contact Sales',
    current: false,
    highlight: false,
  },
];

export default function SettingsPage() {
  const { legacyMode, toggleLegacyMode } = useAppStore();
  const [keywords, setKeywords] = useState(['viral', 'growth', 'business', 'productivity']);
  const [newKeyword, setNewKeyword] = useState('');
  const [activeSection, setActiveSection] = useState('account');

  // ── Preferences state ──
  const [defaultNiche, setDefaultNiche] = useState('Business');
  const [defaultModel, setDefaultModel] = useState('gpt-4o-mini');
  const [defaultAspect, setDefaultAspect] = useState('9:16');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [autoSave, setAutoSave] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [showCostWarnings, setShowCostWarnings] = useState(true);
  const [creditWarningThreshold, setCreditWarningThreshold] = useState(80);

  // ── Notifications state ──
  const [notifDailyBrief, setNotifDailyBrief] = useState(true);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true);
  const [notifOutlierAlert, setNotifOutlierAlert] = useState(true);
  const [outlierThreshold, setOutlierThreshold] = useState(5);
  const [notifScriptReady, setNotifScriptReady] = useState(false);
  const [notifBillingAlerts, setNotifBillingAlerts] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState('creator@email.com');

  function addKeyword() {
    if (!newKeyword.trim() || keywords.includes(newKeyword.trim())) return;
    setKeywords((prev) => [...prev, newKeyword.trim()]);
    setNewKeyword('');
  }

  const SECTIONS = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage your account, subscription, and preferences.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Settings nav */}
        <div className="w-44 shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-left transition-all',
                  activeSection === s.id
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                )}
              >
                <s.icon className={cn('w-3.5 h-3.5', activeSection === s.id ? 'text-violet-400' : 'text-zinc-500')} />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings content */}
        <div className="flex-1 space-y-5">

          {/* Account */}
          {activeSection === 'account' && (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
                <h2 className="text-[14px] font-semibold text-zinc-200 mb-4">Profile</h2>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white">
                    C
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">creator@email.com</p>
                    <p className="text-[12px] text-zinc-500 mt-0.5">Free Plan · Member since March 2024</p>
                    <button className="text-[11px] text-violet-400 hover:text-violet-300 mt-1 transition-colors">
                      Change avatar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-500">Full Name</label>
                    <input
                      defaultValue="Content Creator"
                      className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-500">Email</label>
                    <input
                      defaultValue="creator@email.com"
                      className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                </div>
                <button className="mt-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  Save Changes
                </button>
              </div>

              {/* Legacy mode */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-zinc-500" />
                      <h3 className="text-[14px] font-semibold text-zinc-200">Legacy Mode</h3>
                    </div>
                    <p className="text-[12px] text-zinc-500 leading-relaxed max-w-md">
                      Disables AI features and uses a simplified view — useful for slower connections or if you prefer manual workflows.
                    </p>
                  </div>
                  <button
                    onClick={toggleLegacyMode}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors relative shrink-0',
                      legacyMode ? 'bg-violet-600' : 'bg-zinc-700'
                    )}
                  >
                    <div className={cn(
                      'w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-transform shadow-sm',
                      legacyMode ? 'translate-x-5.5' : 'translate-x-0.75'
                    )} />
                  </button>
                </div>
              </div>

              {/* Keywords */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
                <h3 className="text-[14px] font-semibold text-zinc-200 mb-1">Default Search Keywords</h3>
                <p className="text-[12px] text-zinc-500 mb-4">
                  These keywords are used to filter video feeds and identify relevant content.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="flex items-center gap-1.5 text-[12px] text-zinc-300 bg-zinc-800 border border-zinc-700/40 px-3 py-1 rounded-full"
                    >
                      {kw}
                      <button
                        onClick={() => setKeywords((prev) => prev.filter((k) => k !== kw))}
                        className="text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                    className="flex-1 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                  />
                  <button
                    onClick={addKeyword}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subscription */}
          {activeSection === 'subscription' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {PLAN_TIERS.map((plan) => (
                  <div
                    key={plan.name}
                    className={cn(
                      'relative bg-zinc-900 border rounded-xl p-5 flex flex-col',
                      plan.highlight
                        ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
                        : 'border-zinc-800/60'
                    )}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> Most Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-4">
                      <p className="text-[14px] font-bold text-zinc-100">{plan.name}</p>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="text-2xl font-black text-zinc-100">{plan.price}</span>
                        <span className="text-[12px] text-zinc-500 mb-0.5">{plan.period}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">{plan.description}</p>
                    </div>

                    <ul className="space-y-2 flex-1 mb-4">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-zinc-400">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={cn(
                        'w-full py-2 rounded-lg text-[13px] font-semibold transition-colors',
                        plan.current
                          ? 'bg-zinc-800 text-zinc-500 cursor-default'
                          : plan.highlight
                          ? 'bg-violet-600 hover:bg-violet-500 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                      )}
                      disabled={plan.current}
                    >
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Keys */}
          {activeSection === 'api' && (
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5 space-y-4">
              <h2 className="text-[14px] font-semibold text-zinc-200">API Configuration</h2>
              <p className="text-[12px] text-zinc-500">
                These keys are stored securely as environment variables. Never share them publicly.
              </p>
              {[
                { label: 'OpenAI API Key', placeholder: 'sk-...', env: 'OPENAI_API_KEY' },
                { label: 'Supabase URL', placeholder: 'https://xxx.supabase.co', env: 'NEXT_PUBLIC_SUPABASE_URL' },
                { label: 'Supabase Anon Key', placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', env: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' },
                { label: 'Stripe Secret Key', placeholder: 'sk_live_...', env: 'STRIPE_SECRET_KEY' },
                { label: 'Apify API Token', placeholder: 'apify_api_...', env: 'APIFY_API_TOKEN' },
              ].map((field) => (
                <div key={field.env} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-zinc-400">{field.label}</label>
                    <span className="text-[10px] text-zinc-600 font-mono">{field.env}</span>
                  </div>
                  <input
                    type="password"
                    placeholder={field.placeholder}
                    className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 font-mono"
                  />
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  In production, set these in your <code className="text-amber-400">.env.local</code> file or your hosting provider&apos;s environment variables panel. Never commit API keys to version control.
                </p>
              </div>
            </div>
          )}

          {/* ── Preferences ── */}
          {activeSection === 'preferences' && (
            <div className="space-y-5">
              {/* Content Defaults */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <SlidersHorizontal className="w-4 h-4 text-violet-400" />
                  <h2 className="text-[14px] font-semibold text-zinc-200">Content Defaults</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Default Niche
                    </label>
                    <select
                      value={defaultNiche}
                      onChange={(e) => setDefaultNiche(e.target.value)}
                      className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
                    >
                      {['Business','Finance','Fitness','Health','E-Commerce','Tech & AI','Education','Real Estate','SaaS','Coaching','Lifestyle'].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-600">Pre-fills niche dropdowns across all tools</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                      <Monitor className="w-3 h-3" /> Default Aspect Ratio
                    </label>
                    <div className="flex gap-2">
                      {['9:16','16:9','1:1'].map(r => (
                        <button
                          key={r}
                          onClick={() => setDefaultAspect(r)}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-xs font-semibold border transition-all',
                            defaultAspect === r
                              ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                          )}
                        >{r}</button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-600">Used by Storyboard &amp; Thumbnail tools</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                      <Languages className="w-3 h-3" /> Default Language
                    </label>
                    <select
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value)}
                      className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="pt">Portuguese</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                      <option value="hi">Hindi</option>
                      <option value="ar">Arabic</option>
                    </select>
                    <p className="text-[10px] text-zinc-600">Default for script generation &amp; translation</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                      <Cpu className="w-3 h-3" /> Default AI Model
                    </label>
                    <select
                      value={defaultModel}
                      onChange={(e) => setDefaultModel(e.target.value)}
                      className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
                    >
                      <option value="gpt-4o">GPT-4o (best quality)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (faster, cheaper)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </select>
                    <p className="text-[10px] text-zinc-600">Used when no model is specified per tool</p>
                  </div>
                </div>
              </div>

              {/* Display & UX */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <h2 className="text-[14px] font-semibold text-zinc-200">Display &amp; UX</h2>
                </div>
                {[
                  { label: 'Auto-save scripts', desc: 'Automatically save generated scripts to the Vault', value: autoSave, set: setAutoSave },
                  { label: 'Compact view', desc: 'Reduce spacing for a denser, more information-dense layout', value: compactView, set: setCompactView },
                  { label: 'Cost warnings', desc: 'Show estimated cost before AI generation actions', value: showCostWarnings, set: setShowCostWarnings },
                ].map(({ label, desc, value, set }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-zinc-300">{label}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => set((v: boolean) => !v)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0',
                        value ? 'bg-violet-600' : 'bg-zinc-600',
                      )}
                    >
                      <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm', value ? 'translate-x-4.5' : 'translate-x-0.5')} />
                    </button>
                  </div>
                ))}

                {/* Credit warning threshold */}
                {showCostWarnings && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-zinc-400">Credit warning threshold</label>
                      <span className="text-xs font-bold text-violet-300">{creditWarningThreshold}%</span>
                    </div>
                    <input
                      type="range" min={10} max={95} step={5}
                      value={creditWarningThreshold}
                      onChange={(e) => setCreditWarningThreshold(Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">Warn when credit usage exceeds this % of monthly limit</p>
                  </div>
                )}
              </div>

              <button className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                Save Preferences
              </button>
            </div>
          )}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <div className="space-y-5">
              {/* Delivery channels */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-4 h-4 text-yellow-400" />
                  <h2 className="text-[14px] font-semibold text-zinc-200">Delivery Channels</h2>
                </div>
                {[
                  { label: 'In-app notifications', desc: 'Show notification badges and toasts inside the dashboard', icon: Smartphone, value: notifInApp, set: setNotifInApp },
                  { label: 'Email notifications', desc: 'Send alerts and reports to your email address', icon: Mail, value: notifEmail, set: setNotifEmail },
                ].map(({ label, desc, icon: Icon, value, set }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-300">{label}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => set((v: boolean) => !v)}
                      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0', value ? 'bg-yellow-500' : 'bg-zinc-600')}
                    >
                      <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm', value ? 'translate-x-4.5' : 'translate-x-0.5')} />
                    </button>
                  </div>
                ))}
                {notifEmail && (
                  <div className="pt-1 space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-500">Email address for notifications</label>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-yellow-500/60"
                    />
                  </div>
                )}
              </div>

              {/* Alert types */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-[14px] font-semibold text-zinc-200">Alert Types</h2>
                </div>
                {[
                  { label: 'Daily brief', desc: 'Morning digest of top content opportunities', value: notifDailyBrief, set: setNotifDailyBrief, color: 'bg-emerald-500' },
                  { label: 'Weekly report', desc: 'Full performance and trend summary every Monday', value: notifWeeklyReport, set: setNotifWeeklyReport, color: 'bg-blue-500' },
                  { label: 'Outlier alerts', desc: `Notify when a tracked channel posts a >${outlierThreshold}x outlier video`, value: notifOutlierAlert, set: setNotifOutlierAlert, color: 'bg-orange-500' },
                  { label: 'Script ready', desc: 'Alert when AI script generation completes', value: notifScriptReady, set: setNotifScriptReady, color: 'bg-violet-500' },
                  { label: 'Billing alerts', desc: 'Warn when credits are running low or payment fails', value: notifBillingAlerts, set: setNotifBillingAlerts, color: 'bg-red-500' },
                ].map(({ label, desc, value, set, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2 h-2 rounded-full shrink-0', color)} />
                      <div>
                        <p className="text-sm font-medium text-zinc-300">{label}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => set((v: boolean) => !v)}
                      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0', value ? 'bg-violet-600' : 'bg-zinc-600')}
                    >
                      <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm', value ? 'translate-x-4.5' : 'translate-x-0.5')} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Outlier threshold */}
              {notifOutlierAlert && (
                <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h2 className="text-[14px] font-semibold text-zinc-200">Outlier Alert Threshold</h2>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-medium text-zinc-400">Minimum outlier score to trigger alert</label>
                    <span className="text-sm font-bold text-orange-300">{outlierThreshold}x</span>
                  </div>
                  <input
                    type="range" min={2} max={20} step={1}
                    value={outlierThreshold}
                    onChange={(e) => setOutlierThreshold(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                    <span>2x (frequent)</span>
                    <span>10x (notable)</span>
                    <span>20x (rare)</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-3 bg-zinc-800/60 rounded-lg px-3 py-2">
                    At <span className="text-orange-300 font-semibold">{outlierThreshold}x</span> — you&apos;ll only be alerted to videos that perform {outlierThreshold}× above the channel&apos;s average views. {outlierThreshold <= 3 ? 'This is a low threshold — expect frequent alerts.' : outlierThreshold >= 10 ? 'This is a high threshold — only rare breakout videos will trigger alerts.' : 'This is a balanced threshold.'}
                  </p>
                </div>
              )}

              <button className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                Save Notification Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
