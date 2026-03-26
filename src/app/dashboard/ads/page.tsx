'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  DollarSign,
  Eye,
  TrendingUp,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  Bell,
  BookMarked,
  ExternalLink,
  Clock,
  ChevronDown,
  Target,
  Tv,
  Lightbulb,
  Copy,
  Check,
  Play,
  AlertCircle,
  PlayCircle,
  Globe,
  Loader2,
  CheckCircle,
  Database,
  Tv2,
  Music2,
  Sparkles,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { searchYouTube, searchFbAdLibrary, searchTikTok, saveYouTubeToVault, saveFbAdsToVault, saveTikTokToVault } from '@/actions/scrape-creators';
import type { ScYouTubeVideo, ScFbAd, ScTikTokVideo, ScSearchSource } from '@/actions/scrape-creators';
import { AdModelerModal } from '@/components/AdModelerModal';
import type { AdForModeling } from '@/components/AdModelerModal';

// ── Mock Ad Data ─────────────────────────────────────────────────────────────

type AdPlatform = 'YouTube' | 'TikTok' | 'Instagram';
type AdType = 'In-Stream' | 'Discovery' | 'Shorts' | 'Feed' | 'Story' | 'Reels';
type Industry = 'E-Commerce' | 'SaaS' | 'Coaching' | 'Finance' | 'Health' | 'Real Estate' | 'Agency';

interface AdVideo {
  id: string;
  title: string;
  advertiser: string;
  advertiserLogo: string;
  industry: Industry;
  platform: AdPlatform;
  adType: AdType;
  thumbnail: string;
  views: number;
  estimatedSpend: number; // USD per month
  firstSeen: string;
  lastSeen: string;
  isActive: boolean;
  hook: string;
  script: string[];
  landingUrl: string;
  cta: string;
  tags: string[];
  viewVelocity: number; // views/day
}

const MOCK_ADS: AdVideo[] = [
  {
    id: 'ad1',
    title: 'How I Replaced My 9-5 Income With This One Business Model',
    advertiser: 'Wealth Builders Academy',
    advertiserLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=WBA&backgroundColor=7c3aed',
    industry: 'Coaching',
    platform: 'YouTube',
    adType: 'In-Stream',
    thumbnail: 'https://picsum.photos/seed/ad1/640/360',
    views: 4200000,
    estimatedSpend: 84000,
    firstSeen: '2025-01-03',
    lastSeen: '2025-03-24',
    isActive: true,
    hook: 'What if I told you that in 90 days, you could completely replace your 9-to-5 income?',
    script: [
      'Hook: "What if I told you that in 90 days, you could completely replace your 9-to-5 income?"',
      'Problem: "Most people spend 40 years trading time for money — and retire broke."',
      'Agitate: "Meanwhile, a small group of people cracked the code to building wealth without a boss."',
      'Solution: "I\'m going to show you the exact 3-step system that 2,400 students used to quit their jobs."',
      'CTA: "Click the link below and claim your free training before it expires."',
    ],
    landingUrl: 'wealthbuildersacademy.com/free-training',
    cta: 'Claim Free Training',
    tags: ['income replacement', 'course', 'online business'],
    viewVelocity: 18200,
  },
  {
    id: 'ad2',
    title: 'This AI Tool Writes Your Emails Better Than You Can',
    advertiser: 'CopyFlow AI',
    advertiserLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=CF&backgroundColor=0891b2',
    industry: 'SaaS',
    platform: 'YouTube',
    adType: 'In-Stream',
    thumbnail: 'https://picsum.photos/seed/ad2/640/360',
    views: 8100000,
    estimatedSpend: 162000,
    firstSeen: '2024-12-18',
    lastSeen: '2025-03-24',
    isActive: true,
    hook: 'Your emails are losing you money. Here\'s how AI fixes that in 60 seconds.',
    script: [
      'Hook: "Your emails are losing you money. Here\'s how AI fixes that in 60 seconds."',
      'Demo: Show typing a prompt → watching AI generate high-converting email copy.',
      'Social proof: "Over 47,000 marketers use CopyFlow to 3x their open rates."',
      'Guarantee: "Try it free for 14 days. If you don\'t see results, we refund you."',
      'CTA: "Start your free trial — link in the description."',
    ],
    landingUrl: 'copyflow.ai/trial',
    cta: 'Start Free Trial',
    tags: ['AI writing', 'email', 'SaaS', 'copywriting'],
    viewVelocity: 34500,
  },
  {
    id: 'ad3',
    title: 'Buy Your First Rental Property With $0 Down (Legally)',
    advertiser: 'Real Estate Mastery',
    advertiserLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=REM&backgroundColor=059669',
    industry: 'Real Estate',
    platform: 'YouTube',
    adType: 'Discovery',
    thumbnail: 'https://picsum.photos/seed/ad3/640/360',
    views: 2900000,
    estimatedSpend: 43500,
    firstSeen: '2025-01-28',
    lastSeen: '2025-03-20',
    isActive: true,
    hook: 'You don\'t need a down payment to buy your first rental property. Here\'s proof.',
    script: [
      'Hook: "You don\'t need a down payment to buy your first rental property. Here\'s proof."',
      'Credibility: "I own 22 units and started with zero dollars of my own money."',
      'Method reveal: "The secret is a strategy called house hacking that banks actively support."',
      'Result: "My first house hack now cashflows $2,800/month while I sleep."',
      'CTA: "Watch my free webinar and I\'ll show you how to copy this exact strategy."',
    ],
    landingUrl: 'remasters.co/webinar',
    cta: 'Watch Free Webinar',
    tags: ['real estate', 'investing', 'rental property', 'no money down'],
    viewVelocity: 9700,
  },
  {
    id: 'ad4',
    title: 'Drop 20 Pounds WITHOUT Counting Calories (Doctor Explains)',
    advertiser: 'MetaboFix',
    advertiserLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=MF&backgroundColor=dc2626',
    industry: 'Health',
    platform: 'TikTok',
    adType: 'Feed',
    thumbnail: 'https://picsum.photos/seed/ad4/640/360',
    views: 12400000,
    estimatedSpend: 186000,
    firstSeen: '2024-11-05',
    lastSeen: '2025-03-22',
    isActive: true,
    hook: 'POV: A doctor shows you why counting calories is making you fatter.',
    script: [
      'Hook: Camera starts on doctor in lab coat — "POV: A doctor shows you why counting calories is making you fatter."',
      'Pattern interrupt: "Most diet advice is designed to keep you buying diet products forever."',
      'Science: "Here\'s what happens to your metabolism when you restrict calories…" [diagram]',
      'Solution: "Instead, target these 3 fat-burning hormones with our clinically tested formula."',
      'CTA: "Tap the link. Limited supply. Use code DOC20 for 20% off."',
    ],
    landingUrl: 'metabofix.com/doctor',
    cta: 'Get 20% Off',
    tags: ['weight loss', 'health', 'supplement', 'doctor'],
    viewVelocity: 62000,
  },
  {
    id: 'ad5',
    title: 'We Built a $2M Shopify Store Using Just This ONE Strategy',
    advertiser: 'EcomScale',
    advertiserLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=ES&backgroundColor=d97706',
    industry: 'E-Commerce',
    platform: 'YouTube',
    adType: 'In-Stream',
    thumbnail: 'https://picsum.photos/seed/ad5/640/360',
    views: 6700000,
    estimatedSpend: 134000,
    firstSeen: '2025-01-14',
    lastSeen: '2025-03-23',
    isActive: true,
    hook: 'One single strategy took our Shopify store from $40K to $2M in 14 months.',
    script: [
      'Hook: "One single strategy took our Shopify store from $40K to $2M in 14 months."',
      'Curiosity gap: "It\'s not dropshipping. It\'s not influencer marketing. It\'s not what you think."',
      'Proof: Screen recording of Shopify dashboard showing revenue spike.',
      'Tease: "The strategy works because it solves the #1 problem every ecom store has: trust."',
      'CTA: "I\'m releasing a free case study that breaks down every step. Link in description."',
    ],
    landingUrl: 'ecomscale.io/case-study',
    cta: 'Get Free Case Study',
    tags: ['ecommerce', 'Shopify', 'DTC', 'scaling'],
    viewVelocity: 28800,
  },
  {
    id: 'ad6',
    title: 'This Agency Funnel Made Us $847K Last Month (Steal It)',
    advertiser: 'AgencyOS',
    advertiserLogo: 'https://api.dicebear.com/7.x/initials/svg?seed=AO&backgroundColor=7c3aed',
    industry: 'Agency',
    platform: 'Instagram',
    adType: 'Reels',
    thumbnail: 'https://picsum.photos/seed/ad6/640/360',
    views: 3800000,
    estimatedSpend: 57000,
    firstSeen: '2025-02-10',
    lastSeen: '2025-03-24',
    isActive: true,
    hook: 'Our agency made $847,000 last month from one funnel. We\'re giving it away for free.',
    script: [
      'Hook: "Our agency made $847,000 last month from one funnel. We\'re giving it away for free."',
      'Credibility: Quick montage of client results, office, team.',
      'The funnel breakdown: VSL → Typeform → Stripe → Slack notification.',
      'Objection kill: "No, you don\'t need a big team. This runs on 3 freelancers."',
      'CTA: "DM us \'FUNNEL\' and we\'ll send you the full breakdown."',
    ],
    landingUrl: 'agencyos.com/funnel',
    cta: 'DM "FUNNEL"',
    tags: ['agency', 'funnel', 'B2B', 'lead generation'],
    viewVelocity: 14200,
  },
];

interface TrackedCompetitor {
  id: string;
  name: string;
  logo: string;
  industry: Industry;
  activeAds: number;
  estimatedMonthlySpend: number;
  lastNewAd: string;
  alertEnabled: boolean;
}

const MOCK_COMPETITORS: TrackedCompetitor[] = [
  { id: 'cp1', name: 'CopyFlow AI', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=CF&backgroundColor=0891b2', industry: 'SaaS', activeAds: 14, estimatedMonthlySpend: 320000, lastNewAd: '2025-03-23', alertEnabled: true },
  { id: 'cp2', name: 'MetaboFix', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MF&backgroundColor=dc2626', industry: 'Health', activeAds: 31, estimatedMonthlySpend: 520000, lastNewAd: '2025-03-24', alertEnabled: true },
  { id: 'cp3', name: 'EcomScale', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ES&backgroundColor=d97706', industry: 'E-Commerce', activeAds: 8, estimatedMonthlySpend: 180000, lastNewAd: '2025-03-20', alertEnabled: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSpend(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

function spendColor(spend: number) {
  if (spend >= 100000) return 'text-red-400 bg-red-950/60 border-red-700/30';
  if (spend >= 50000) return 'text-orange-400 bg-orange-950/60 border-orange-700/30';
  return 'text-yellow-400 bg-yellow-950/60 border-yellow-700/30';
}

function daysSince(dateStr: string) {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';
type TabView = 'ads' | 'competitors' | 'swipe' | 'import';

export default function AdsPage() {
  const [tab, setTab] = useState<TabView>('ads');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [platform, setPlatform] = useState<AdPlatform | 'All'>('All');
  const [industry, setIndustry] = useState<Industry | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [minSpend, setMinSpend] = useState(0);
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdVideo | null>(null);
  const [savedAds, setSavedAds] = useState<Set<string>>(new Set());
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState(MOCK_COMPETITORS);
  const [modelingAd, setModelingAd] = useState<AdForModeling | null>(null);

  const filteredAds = useMemo(() => {
    let ads = [...MOCK_ADS];
    if (platform !== 'All') ads = ads.filter(a => a.platform === platform);
    if (industry !== 'All') ads = ads.filter(a => a.industry === industry);
    if (activeOnly) ads = ads.filter(a => a.isActive);
    if (minSpend > 0) ads = ads.filter(a => a.estimatedSpend >= minSpend * 1000);
    if (search.trim()) {
      const q = search.toLowerCase();
      ads = ads.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.advertiser.toLowerCase().includes(q) ||
        a.hook.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    ads.sort((a, b) => b.estimatedSpend - a.estimatedSpend);
    return ads;
  }, [search, platform, industry, activeOnly, minSpend]);

  function copyScript(ad: AdVideo) {
    const text = ad.script.join('\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedScript(ad.id);
    setTimeout(() => setCopiedScript(null), 2000);
  }

  function toggleAlert(id: string) {
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, alertEnabled: !c.alertEnabled } : c));
  }

  // ── Live Search (ScrapeCreators) state ───────────────────────────────────
  type ScResults =
    | { source: 'youtube'; items: ScYouTubeVideo[] }
    | { source: 'facebook-ads'; items: ScFbAd[] }
    | { source: 'tiktok'; items: ScTikTokVideo[] };

  const [scSource, setScSource] = useState<ScSearchSource>('youtube');
  const [scQuery, setScQuery] = useState('');
  const [scCountry, setScCountry] = useState('US');
  const [scSearching, setScSearching] = useState(false);
  const [scResults, setScResults] = useState<ScResults | null>(null);
  const [scError, setScError] = useState<string | null>(null);
  const [scSaved, setScSaved] = useState<Set<string>>(new Set());
  const [scSaving, setScSaving] = useState<Set<string>>(new Set());
  const [scSavingAll, setScSavingAll] = useState(false);
  const [scSaveMsg, setScSaveMsg] = useState<string | null>(null);

  async function handleScSearch() {
    if (!scQuery.trim()) return;
    setScSearching(true);
    setScResults(null);
    setScError(null);
    setScSaved(new Set());
    setScSaveMsg(null);
    try {
      if (scSource === 'youtube') {
        const r = await searchYouTube(scQuery, 20);
        if (!r.success) setScError(r.error ?? 'Search failed');
        else setScResults({ source: 'youtube', items: r.results });
      } else if (scSource === 'facebook-ads') {
        const r = await searchFbAdLibrary(scQuery, scCountry, 20);
        if (!r.success) setScError(r.error ?? 'Search failed');
        else setScResults({ source: 'facebook-ads', items: r.results });
      } else {
        const r = await searchTikTok(scQuery, 20);
        if (!r.success) setScError(r.error ?? 'Search failed');
        else setScResults({ source: 'tiktok', items: r.results });
      }
    } catch (e) {
      setScError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setScSearching(false);
    }
  }

  async function saveScItem(id: string) {
    if (!scResults || scSaved.has(id)) return;
    setScSaving(prev => new Set(Array.from(prev).concat(id)));
    try {
      let res;
      if (scResults.source === 'youtube') {
        const item = scResults.items.find((v: ScYouTubeVideo) => v.id === id);
        if (item) res = await saveYouTubeToVault([item]);
      } else if (scResults.source === 'facebook-ads') {
        const item = scResults.items.find((v: ScFbAd) => v.id === id);
        if (item) res = await saveFbAdsToVault([item]);
      } else {
        const item = scResults.items.find((v: ScTikTokVideo) => v.id === id);
        if (item) res = await saveTikTokToVault([item]);
      }
      if (res?.success) setScSaved(prev => new Set(Array.from(prev).concat(id)));
    } finally {
      setScSaving(prev => { const s = new Set(Array.from(prev)); s.delete(id); return s; });
    }
  }

  async function saveAllScResults() {
    if (!scResults || scResults.items.length === 0) return;
    setScSavingAll(true);
    setScSaveMsg(null);
    try {
      let res;
      if (scResults.source === 'youtube') {
        res = await saveYouTubeToVault(scResults.items as ScYouTubeVideo[]);
      } else if (scResults.source === 'facebook-ads') {
        res = await saveFbAdsToVault(scResults.items as ScFbAd[]);
      } else {
        res = await saveTikTokToVault(scResults.items as ScTikTokVideo[]);
      }
      if (res?.success) {
        const ids = scResults.items.map((i: ScYouTubeVideo | ScFbAd | ScTikTokVideo) => i.id);
        setScSaved(new Set(ids));
        setScSaveMsg(`${res.saved} items saved to Vault`);
      }
    } finally {
      setScSavingAll(false);
    }
  }

  const activeFilterCount = [platform !== 'All', industry !== 'All', activeOnly, minSpend > 0].filter(Boolean).length;
  const totalSpend = filteredAds.reduce((s, a) => s + a.estimatedSpend, 0);

  const INDUSTRIES: Industry[] = ['E-Commerce', 'SaaS', 'Coaching', 'Finance', 'Health', 'Real Estate', 'Agency'];
  const PLATFORMS: AdPlatform[] = ['YouTube', 'TikTok', 'Instagram'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Ad Intelligence</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">
            Spy on competitors&apos; YouTube, TikTok & Instagram ads — see spend estimates, hooks, and creative strategies.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-3 py-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · updated hourly
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Active Advertisers', value: MOCK_ADS.filter(a => a.isActive).length.toString(), icon: Tv, color: 'text-orange-400' },
          { label: 'Total Est. Monthly Spend', value: formatSpend(totalSpend), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Avg Views Per Ad', value: formatNumber(Math.round(filteredAds.reduce((s, a) => s + a.views, 0) / Math.max(filteredAds.length, 1))), icon: Eye, color: 'text-blue-400' },
          { label: 'Competitors Tracked', value: competitors.length.toString(), icon: Target, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
              <span className="text-[11px] text-zinc-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-[22px] font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-zinc-900 border border-zinc-800/60 rounded-xl p-1 w-fit">
        {([
          { id: 'ads', label: 'Ad Library', icon: Play },
          { id: 'competitors', label: 'Competitor Tracker', icon: Target },
          { id: 'swipe', label: 'Swipe File', icon: BookMarked },
          { id: 'import', label: 'Live Search', icon: Search },
        ] as { id: TabView; label: string; icon: React.FC<{ className?: string }> }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all',
              tab === t.id
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === 'swipe' && savedAds.size > 0 && (
              <span className="bg-violet-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                {savedAds.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── AD LIBRARY TAB ── */}
      {tab === 'ads' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search advertiser, hook, keyword…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60"
              />
            </div>

            {/* Platform */}
            <div className="flex gap-1">
              {(['All', ...PLATFORMS] as (AdPlatform | 'All')[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                    platform === p
                      ? 'bg-orange-600 text-white'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all',
                showFilters || activeFilterCount > 0
                  ? 'bg-orange-600/20 text-orange-300 border-orange-500/30'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border-zinc-700/50'
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View toggle */}
            <div className="ml-auto flex bg-zinc-800/60 border border-zinc-700/50 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={cn('p-1.5 transition-colors', viewMode === 'grid' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300')}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn('p-1.5 transition-colors', viewMode === 'list' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300')}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Advanced filters panel */}
          {showFilters && (
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 mb-5 grid grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-2 block">Industry</label>
                <div className="relative">
                  <select
                    value={industry}
                    onChange={e => setIndustry(e.target.value as Industry | 'All')}
                    className="w-full appearance-none bg-zinc-800 border border-zinc-700/50 rounded-lg py-1.5 pl-3 pr-8 text-[12px] text-zinc-300 focus:outline-none focus:border-orange-500/60"
                  >
                    <option value="All">All Industries</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-2 block">Min Monthly Spend ($K)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={10}
                    value={minSpend}
                    onChange={e => setMinSpend(Number(e.target.value))}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="text-[12px] text-zinc-300 w-14 text-right font-mono">{minSpend > 0 ? `$${minSpend}K+` : 'Any'}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-2 block">Status</label>
                <button
                  onClick={() => setActiveOnly(!activeOnly)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all w-full',
                    activeOnly ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                  )}
                >
                  <div className={cn('w-1.5 h-1.5 rounded-full', activeOnly ? 'bg-emerald-400' : 'bg-zinc-600')} />
                  Active Ads Only
                </button>
              </div>
              {activeFilterCount > 0 && (
                <div className="col-span-3 flex justify-end">
                  <button
                    onClick={() => { setIndustry('All'); setMinSpend(0); setActiveOnly(false); setPlatform('All'); }}
                    className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          <p className="text-[12px] text-zinc-600 mb-4">{filteredAds.length} ads · sorted by estimated spend</p>

          {/* Ad Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAds.map(ad => (
                <div key={ad.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 hover:shadow-lg transition-all group">
                  {/* Thumbnail */}
                  <div
                    className="relative aspect-video overflow-hidden bg-zinc-800 cursor-pointer"
                    onClick={() => setSelectedAd(selectedAd?.id === ad.id ? null : ad)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.thumbnail} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />

                    {/* Spend badge */}
                    <div className={cn('absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border backdrop-blur-sm', spendColor(ad.estimatedSpend))}>
                      <DollarSign className="w-3 h-3" />
                      {formatSpend(ad.estimatedSpend)}/mo
                    </div>

                    {/* Active indicator */}
                    {ad.isActive && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-emerald-900/80 border border-emerald-500/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400">LIVE</span>
                      </div>
                    )}

                    {/* Platform */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className={cn(
                        'text-[9px] font-bold px-2 py-0.5 rounded',
                        ad.platform === 'YouTube' ? 'bg-red-600 text-white' :
                        ad.platform === 'TikTok' ? 'bg-zinc-100 text-zinc-900' :
                        'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      )}>
                        {ad.platform.toUpperCase()} · {ad.adType}
                      </span>
                    </div>

                    {/* View velocity */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                      <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-[10px] text-zinc-300 font-mono">{formatNumber(ad.viewVelocity)}/day</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3.5">
                    {/* Advertiser */}
                    <div className="flex items-center gap-2 mb-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ad.advertiserLogo} alt="" className="w-5 h-5 rounded" />
                      <span className="text-[11px] font-semibold text-zinc-300">{ad.advertiser}</span>
                      <span className="ml-auto text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">{ad.industry}</span>
                    </div>

                    <h3 className="text-[13px] font-semibold text-zinc-200 line-clamp-2 leading-snug mb-2.5">
                      {ad.title}
                    </h3>

                    {/* Dates + views */}
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        First seen {ad.firstSeen}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(ad.views)}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] text-zinc-600">CTA:</span>
                      <span className="text-[11px] text-orange-400 font-semibold">{ad.cta}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1.5 flex-wrap">
                      {ad.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded script panel */}
                  {selectedAd?.id === ad.id && (
                    <div className="mx-3.5 mb-3.5 space-y-2" onClick={e => e.stopPropagation()}>
                      {/* Hook */}
                      <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Lightbulb className="w-3 h-3 text-yellow-400" />
                          <p className="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider">Opening Hook</p>
                        </div>
                        <p className="text-[12px] text-zinc-300 leading-relaxed italic">&ldquo;{ad.hook}&rdquo;</p>
                      </div>

                      {/* Script breakdown */}
                      <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Play className="w-3 h-3 text-orange-400" />
                            <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Script Framework</p>
                          </div>
                          <button
                            onClick={() => copyScript(ad)}
                            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            {copiedScript === ad.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedScript === ad.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {ad.script.map((line, i) => (
                            <p key={i} className="text-[11px] text-zinc-400 leading-relaxed">{line}</p>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSavedAds(prev => new Set(Array.from(prev).concat(ad.id)))}
                          disabled={savedAds.has(ad.id)}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                            savedAds.has(ad.id)
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                              : 'bg-violet-600 hover:bg-violet-500 text-white'
                          )}
                        >
                          <BookMarked className="w-3 h-3" />
                          {savedAds.has(ad.id) ? 'In Swipe File' : 'Save to Swipe File'}
                        </button>
                        <button
                          onClick={() => setModelingAd({
                            id: ad.id,
                            platform: ad.platform.toUpperCase(),
                            ad_copy: ad.hook + '\n\n' + ad.script.join('\n'),
                            competitor: { name: ad.advertiser },
                            days_active: Math.floor((new Date().getTime() - new Date(ad.firstSeen).getTime()) / 86400000),
                          })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          Model Ad
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[11px] transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          Visit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="space-y-2">
              {filteredAds.map((ad, i) => (
                <div
                  key={ad.id}
                  className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-all group cursor-pointer"
                  onClick={() => setSelectedAd(selectedAd?.id === ad.id ? null : ad)}
                >
                  <span className="text-[12px] font-mono text-zinc-700 w-5 text-right flex-shrink-0">#{i + 1}</span>
                  <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.thumbnail} alt="" className="w-full h-full object-cover" />
                    {ad.isActive && <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">{ad.title}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{ad.advertiser} · {ad.industry} · {ad.platform}</p>
                  </div>
                  <div className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12px] font-bold flex-shrink-0', spendColor(ad.estimatedSpend))}>
                    <DollarSign className="w-3 h-3" />
                    {formatSpend(ad.estimatedSpend)}/mo
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 text-[12px] text-zinc-500">
                    <div className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(ad.views)}</div>
                    <div className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" />{formatNumber(ad.viewVelocity)}/day</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSavedAds(prev => new Set(Array.from(prev).concat(ad.id))); }}
                    disabled={savedAds.has(ad.id)}
                    className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all', savedAds.has(ad.id) ? 'bg-emerald-500/10 text-emerald-500 cursor-default' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200')}
                  >
                    <BookMarked className="w-3 h-3" />
                    {savedAds.has(ad.id) ? 'Saved' : 'Save'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── COMPETITOR TRACKER TAB ── */}
      {tab === 'competitors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-zinc-500">{competitors.length} competitors tracked</p>
            <button className="flex items-center gap-2 px-3.5 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-[12px] font-semibold text-white transition-colors">
              + Add Competitor
            </button>
          </div>

          {competitors.map(comp => (
            <div key={comp.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={comp.logo} alt="" className="w-10 h-10 rounded-xl" />
                  <div>
                    <p className="text-[14px] font-semibold text-zinc-200">{comp.name}</p>
                    <p className="text-[11px] text-zinc-500">{comp.industry}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleAlert(comp.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all',
                    comp.alertEnabled
                      ? 'bg-orange-600/20 text-orange-300 border-orange-500/30'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700/50 hover:text-zinc-300'
                  )}
                >
                  <Bell className={cn('w-3.5 h-3.5', comp.alertEnabled && 'animate-none')} />
                  {comp.alertEnabled ? 'Alert On' : 'Alert Off'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-800/60">
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Active Ads</p>
                  <p className="text-[20px] font-bold text-zinc-100">{comp.activeAds}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Est. Monthly Spend</p>
                  <p className="text-[20px] font-bold text-orange-400">{formatSpend(comp.estimatedMonthlySpend)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Last New Ad</p>
                  <p className="text-[14px] font-semibold text-zinc-300">{daysSince(comp.lastNewAd)}</p>
                  <p className="text-[10px] text-zinc-600">{comp.lastNewAd}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 bg-zinc-800/40 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <p className="text-[11px] text-zinc-400">
                  {comp.alertEnabled
                    ? `You'll be notified when ${comp.name} launches a new ad or significantly increases spend.`
                    : `Enable alerts to get notified when ${comp.name} launches new creative.`
                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIVE SEARCH TAB (ScrapeCreators) ── */}
      {tab === 'import' && (
        <div className="space-y-5">
          {/* Search bar */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[14px] font-bold text-zinc-200">Live Content Search</h2>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  Search YouTube, Facebook Ads, and TikTok directly — no copy-paste needed.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Powered by ScrapeCreators
              </div>
            </div>

            {/* Platform selector */}
            <div className="flex gap-2 mb-4">
              {([
                { id: 'youtube' as ScSearchSource, label: 'YouTube', icon: PlayCircle, active: 'bg-red-600/20 border-red-500/40 text-red-300' },
                { id: 'facebook-ads' as ScSearchSource, label: 'Facebook Ads', icon: Globe, active: 'bg-blue-600/20 border-blue-500/40 text-blue-300' },
                { id: 'tiktok' as ScSearchSource, label: 'TikTok', icon: Music2, active: 'bg-zinc-100/10 border-zinc-300/20 text-zinc-200' },
              ]).map(p => (
                <button
                  key={p.id}
                  onClick={() => { setScSource(p.id); setScResults(null); setScError(null); }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all',
                    scSource === p.id ? p.active : 'bg-zinc-800 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  <p.icon className="w-4 h-4" />
                  {p.label}
                </button>
              ))}
            </div>

            {/* Search row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder={
                    scSource === 'youtube' ? 'Search YouTube videos (e.g. "online business", "weight loss")' :
                    scSource === 'facebook-ads' ? 'Search Facebook ads by keyword or brand' :
                    'Search TikTok videos (e.g. "morning routine", "dropshipping")'
                  }
                  value={scQuery}
                  onChange={e => setScQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScSearch()}
                  className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2.5 pl-10 pr-3 text-[13px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60"
                />
              </div>
              {scSource === 'facebook-ads' && (
                <select
                  value={scCountry}
                  onChange={e => setScCountry(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 text-[12px] text-zinc-300 focus:outline-none"
                >
                  {['US', 'GB', 'AU', 'CA', 'IN', 'BR', 'DE', 'FR'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
              <button
                onClick={handleScSearch}
                disabled={scSearching || !scQuery.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[13px] font-semibold text-white transition-colors whitespace-nowrap"
              >
                {scSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
          </div>

          {/* Error */}
          {scError && (
            <div className="bg-red-950/30 border border-red-700/30 rounded-xl px-4 py-3 text-[13px] text-red-300">
              {scError}
            </div>
          )}

          {/* Save all banner */}
          {scResults && scResults.items.length > 0 && (
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-3">
              <span className="text-[13px] text-zinc-300">
                <span className="font-bold text-zinc-100">{scResults.items.length}</span> results for &ldquo;{scQuery}&rdquo;
                {scSaveMsg && (
                  <span className="ml-3 text-emerald-400 font-medium">✓ {scSaveMsg}</span>
                )}
              </span>
              <button
                onClick={saveAllScResults}
                disabled={scSavingAll || scSaved.size === scResults.items.length}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                  scSaved.size === scResults.items.length
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default'
                    : 'bg-violet-600 hover:bg-violet-500 border-transparent text-white disabled:opacity-50'
                )}
              >
                {scSavingAll ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                ) : scSaved.size === scResults.items.length ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> All Saved</>
                ) : (
                  <><Database className="w-3.5 h-3.5" /> Save All to Vault</>
                )}
              </button>
            </div>
          )}

          {/* ── YouTube Results ── */}
          {scResults?.source === 'youtube' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(scResults.items as ScYouTubeVideo[]).map(v => (
                <div key={v.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group">
                  <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 to-transparent" />
                    {v.isShort && (
                      <div className="absolute top-2 left-2 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">SHORT</div>
                    )}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                      <Eye className="w-2.5 h-2.5 text-zinc-400" />
                      <span className="text-[10px] text-zinc-300 font-mono">{formatNumber(v.views)}</span>
                    </div>
                    <div className="absolute bottom-2 left-2 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">YT</div>
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-semibold text-zinc-200 line-clamp-2 leading-snug mb-1.5">{v.title}</p>
                    <p className="text-[11px] text-zinc-500 mb-2.5">{v.channelName} {v.publishedAt ? `· ${v.publishedAt.slice(0,10)}` : ''}</p>
                    {v.description && (
                      <p className="text-[11px] text-zinc-600 line-clamp-2 mb-3 italic">{v.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveScItem(v.id)}
                        disabled={scSaving.has(v.id) || scSaved.has(v.id)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                          scSaved.has(v.id)
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-violet-600 hover:bg-violet-500 text-white'
                        )}
                      >
                        {scSaving.has(v.id) ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         scSaved.has(v.id) ? <><CheckCircle className="w-3 h-3" /> Saved</> :
                         <><Database className="w-3 h-3" /> Save to Vault</>}
                      </button>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Facebook Ads Results ── */}
          {scResults?.source === 'facebook-ads' && (
            <div className="space-y-3">
              {(scResults.items as ScFbAd[]).map(ad => (
                <div key={ad.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700 transition-all">
                  <div className="flex gap-4">
                    {ad.thumbnailUrl && (
                      <div className="w-28 aspect-video rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ad.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[13px] font-bold text-zinc-200">{ad.pageName}</span>
                        {ad.isActive && (
                          <span className="text-[9px] font-bold bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded-full">ACTIVE</span>
                        )}
                        <div className="ml-auto flex gap-1">
                          {ad.platforms.slice(0, 3).map(p => (
                            <span key={p} className="text-[9px] bg-blue-950/50 border border-blue-700/30 text-blue-400 px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                        </div>
                      </div>
                      {ad.adCreativeBody && (
                        <p className="text-[12px] text-zinc-300 leading-relaxed mb-2 line-clamp-3">{ad.adCreativeBody}</p>
                      )}
                      {ad.adCreativeLinkTitle && (
                        <p className="text-[11px] text-blue-400 font-medium mb-1.5">{ad.adCreativeLinkTitle}</p>
                      )}
                      <div className="flex items-center gap-4 text-[11px] text-zinc-500 mb-3">
                        {(ad.spendLower || 0) > 0 && (
                          <span className="text-orange-400 font-medium">${ad.spendLower?.toLocaleString()}–${ad.spendUpper?.toLocaleString()} spend</span>
                        )}
                        {ad.callToAction && <span className="bg-zinc-800 px-1.5 py-0.5 rounded">{ad.callToAction}</span>}
                        {ad.startDate && <span>{ad.startDate}</span>}
                      </div>
                      <button
                        onClick={() => saveScItem(ad.id)}
                        disabled={scSaving.has(ad.id) || scSaved.has(ad.id)}
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                          scSaved.has(ad.id)
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-violet-600 hover:bg-violet-500 text-white'
                        )}
                      >
                        {scSaving.has(ad.id) ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         scSaved.has(ad.id) ? <><CheckCircle className="w-3 h-3" /> Saved to Vault</> :
                         <><Database className="w-3 h-3" /> Save to Vault</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TikTok Results ── */}
          {scResults?.source === 'tiktok' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(scResults.items as ScTikTokVideo[]).map(v => (
                <div key={v.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group">
                  <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumbnail} alt={v.desc} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 to-transparent" />
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                      <Eye className="w-2.5 h-2.5 text-zinc-400" />
                      <span className="text-[10px] text-zinc-300 font-mono">{formatNumber(v.views)}</span>
                    </div>
                    <div className="absolute bottom-2 left-2 text-[9px] font-bold bg-zinc-100 text-zinc-900 px-1.5 py-0.5 rounded">TT</div>
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-semibold text-zinc-200 line-clamp-2 leading-snug mb-1.5">{v.desc || '(No caption)'}</p>
                    <p className="text-[11px] text-zinc-500 mb-2">
                      @{v.author} {v.authorNickname ? `(${v.authorNickname})` : ''}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-3">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{formatNumber(v.likes)} likes</span>
                      <span>{v.shares} shares</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveScItem(v.id)}
                        disabled={scSaving.has(v.id) || scSaved.has(v.id)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                          scSaved.has(v.id)
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-violet-600 hover:bg-violet-500 text-white'
                        )}
                      >
                        {scSaving.has(v.id) ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         scSaved.has(v.id) ? <><CheckCircle className="w-3 h-3" /> Saved</> :
                         <><Database className="w-3 h-3" /> Save to Vault</>}
                      </button>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!scSearching && !scResults && !scError && (
            <div className="text-center py-16">
              <Tv2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm mb-1">Search YouTube, Facebook Ads, or TikTok</p>
              <p className="text-[12px] text-zinc-600">Results appear here — save anything to your Vault with one click.</p>
            </div>
          )}

          {/* Loading skeleton */}
          {scSearching && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-zinc-800" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    <div className="h-7 bg-zinc-800 rounded mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SWIPE FILE TAB ── */}
      {tab === 'swipe' && (
        <div>
          {savedAds.size === 0 ? (
            <div className="text-center py-16">
              <BookMarked className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm mb-1">Your swipe file is empty.</p>
              <p className="text-[12px] text-zinc-600">Save ads from the Ad Library to build your creative swipe file.</p>
              <button onClick={() => setTab('ads')} className="mt-4 text-orange-400 text-[12px] hover:text-orange-300 transition-colors">
                Browse Ad Library →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[12px] text-zinc-500">{savedAds.size} ads saved</p>
              {MOCK_ADS.filter(a => savedAds.has(a.id)).map(ad => (
                <div key={ad.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 flex gap-4">
                  <div className="w-28 aspect-video rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ad.advertiserLogo} alt="" className="w-4 h-4 rounded" />
                      <span className="text-[11px] text-zinc-400">{ad.advertiser}</span>
                      <span className={cn('ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border', spendColor(ad.estimatedSpend))}>
                        {formatSpend(ad.estimatedSpend)}/mo
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-zinc-200 mb-2">{ad.title}</p>
                    <p className="text-[12px] text-zinc-400 italic mb-3 line-clamp-2">&ldquo;{ad.hook}&rdquo;</p>
                    <div className="flex gap-2">
                      <button onClick={() => copyScript(ad)} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors">
                        {copiedScript === ad.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedScript === ad.id ? 'Copied!' : 'Copy Script'}
                      </button>
                      <button
                        onClick={() => setSavedAds(prev => { const s = new Set(prev); s.delete(ad.id); return s; })}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-500 hover:text-red-400 text-[11px] transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Ad Modeler Modal */}
      <AdModelerModal ad={modelingAd} onClose={() => setModelingAd(null)} />
    </div>
  );
}
