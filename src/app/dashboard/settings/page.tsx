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

          {/* Preferences placeholder */}
          {(activeSection === 'preferences' || activeSection === 'notifications') && (
            <div className="bg-zinc-900 border border-zinc-800/40 border-dashed rounded-xl p-12 text-center">
              <Globe className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
              <p className="text-sm text-zinc-500">{activeSection === 'preferences' ? 'Preferences' : 'Notification'} settings coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
