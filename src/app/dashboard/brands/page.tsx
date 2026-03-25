'use client';

import { useState } from 'react';
import {
  Plus,
  Briefcase,
  BookMarked,
  FileText,
  User,
  TrendingUp,
  Copy,
  Check,
  Trash2,
  X,
  Layers,
  Tag,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type AssetType = 'Hook' | 'Script' | 'Avatar' | 'Visual Style' | 'Ad Creative';

interface BrandAsset {
  id: string;
  type: AssetType;
  title: string;
  content: string;
  tags: string[];
  performance?: number;
  clonedFrom?: string;
  addedAt: string;
}

interface Brand {
  id: string;
  name: string;
  niche: string;
  primaryColor: string;
  logo: string;
  assets: BrandAsset[];
  activeAvatars: number;
  activeCampaigns: number;
  totalAdsRunning: number;
  monthlySpend: number;
  topScore: number;
  createdAt: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_BRANDS: Brand[] = [
  {
    id: 'b1',
    name: 'EduLaunch',
    niche: 'Online Education',
    primaryColor: '#7c3aed',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=EL&backgroundColor=7c3aed',
    activeAvatars: 3,
    activeCampaigns: 7,
    totalAdsRunning: 14,
    monthlySpend: 22000,
    topScore: 18.3,
    createdAt: '2025-01-05',
    assets: [
      { id: 'a1', type: 'Hook', title: 'Curiosity Gap Hook', content: 'What nobody tells you about learning online — until now.', tags: ['curiosity', 'education'], performance: 14.2, addedAt: '2025-02-01' },
      { id: 'a2', type: 'Script', title: 'Founder Story Script', content: 'Full 60s founder story for course launch...', tags: ['founder', 'story'], performance: 18.3, addedAt: '2025-02-14' },
      { id: 'a3', type: 'Visual Style', title: 'Clean Desk Aesthetic', content: 'White desk, minimal background, ring light. Professional but approachable. Text overlays in brand purple.', tags: ['clean', 'professional'], addedAt: '2025-01-20' },
    ],
  },
  {
    id: 'b2',
    name: 'FitPulse',
    niche: 'Fitness & Health',
    primaryColor: '#059669',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=FP&backgroundColor=059669',
    activeAvatars: 4,
    activeCampaigns: 12,
    totalAdsRunning: 28,
    monthlySpend: 47000,
    topScore: 22.1,
    createdAt: '2024-11-18',
    assets: [
      { id: 'a4', type: 'Hook', title: 'Before/After Hook', content: 'I was 230 lbs and couldn\'t walk up stairs. Here\'s what happened next.', tags: ['transformation', 'relatable'], performance: 22.1, addedAt: '2025-01-08' },
      { id: 'a5', type: 'Avatar', title: 'Jake Torres (Fitness)', content: 'Outdoor transformation coach. Energetic, results-focused, 27yo.', tags: ['fitness', 'outdoor'], performance: 14.2, addedAt: '2024-12-01' },
      { id: 'a6', type: 'Ad Creative', title: 'Gym POV TikTok', content: 'POV workout shot, fast cuts, upbeat music, before/after split screen overlay.', tags: ['POV', 'gym', 'TikTok'], addedAt: '2025-01-15' },
    ],
  },
  {
    id: 'b3',
    name: 'WealthPath',
    niche: 'Personal Finance',
    primaryColor: '#d97706',
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=WP&backgroundColor=d97706',
    activeAvatars: 2,
    activeCampaigns: 5,
    totalAdsRunning: 9,
    monthlySpend: 15000,
    topScore: 11.7,
    createdAt: '2025-02-02',
    assets: [
      { id: 'a7', type: 'Hook', title: 'Debt Confession Hook', content: 'I was $80,000 in debt and too embarrassed to tell anyone. Here\'s how I got out.', tags: ['debt', 'confession', 'relatable'], performance: 11.7, addedAt: '2025-02-10' },
      { id: 'a8', type: 'Script', title: 'Objection Handler: "Investing is risky"', content: '"Investing is too risky." Here\'s why that mindset is the biggest risk of all...', tags: ['objection', 'investing'], performance: 9.4, addedAt: '2025-03-01' },
    ],
  },
];

const ASSET_ICONS: Record<AssetType, React.FC<{ className?: string }>> = {
  Hook: BookMarked,
  Script: FileText,
  Avatar: User,
  'Visual Style': Palette,
  'Ad Creative': Layers,
};

const ASSET_COLORS: Record<AssetType, string> = {
  Hook: 'text-yellow-400 bg-yellow-950/60 border-yellow-700/30',
  Script: 'text-violet-400 bg-violet-950/60 border-violet-700/30',
  Avatar: 'text-pink-400 bg-pink-950/60 border-pink-700/30',
  'Visual Style': 'text-blue-400 bg-blue-950/60 border-blue-700/30',
  'Ad Creative': 'text-orange-400 bg-orange-950/60 border-orange-700/30',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(INITIAL_BRANDS[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [filterAsset, setFilterAsset] = useState<AssetType | 'All'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', niche: '', primaryColor: '#7c3aed' });

  function copyAsset(id: string, content: string) {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function deleteAsset(brandId: string, assetId: string) {
    setBrands(prev => prev.map(b => b.id === brandId
      ? { ...b, assets: b.assets.filter(a => a.id !== assetId) }
      : b
    ));
    if (selectedBrand?.id === brandId) {
      setSelectedBrand(prev => prev ? { ...prev, assets: prev.assets.filter(a => a.id !== assetId) } : null);
    }
  }

  function createBrand() {
    if (!form.name.trim()) return;
    const newBrand: Brand = {
      id: `b${Date.now()}`,
      name: form.name,
      niche: form.niche || 'General',
      primaryColor: form.primaryColor,
      logo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name)}&backgroundColor=${form.primaryColor.replace('#', '')}`,
      activeAvatars: 0,
      activeCampaigns: 0,
      totalAdsRunning: 0,
      monthlySpend: 0,
      topScore: 0,
      createdAt: new Date().toISOString().split('T')[0],
      assets: [],
    };
    setBrands(prev => [...prev, newBrand]);
    setSelectedBrand(newBrand);
    setShowCreate(false);
    setForm({ name: '', niche: '', primaryColor: '#7c3aed' });
  }

  const filteredAssets = selectedBrand
    ? (filterAsset === 'All' ? selectedBrand.assets : selectedBrand.assets.filter(a => a.type === filterAsset))
    : [];

  const totalAssets = brands.reduce((s, b) => s + b.assets.length, 0);
  const totalSpend = brands.reduce((s, b) => s + b.monthlySpend, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Brand Catalog</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">
            Manage assets, avatars, and creative across all your brands at scale.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Brand
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Brands', value: brands.length.toString(), color: 'text-blue-400' },
          { label: 'Total Assets', value: totalAssets.toString(), color: 'text-violet-400' },
          { label: 'Active Campaigns', value: brands.reduce((s, b) => s + b.activeCampaigns, 0).toString(), color: 'text-emerald-400' },
          { label: 'Combined Monthly Spend', value: `$${(totalSpend / 1000).toFixed(0)}K`, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
            <p className="text-[11px] text-zinc-500 mb-2">{s.label}</p>
            <p className={cn('text-[22px] font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-5">
        {/* Brand list sidebar */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-1 mb-3">Your Brands</p>
          {brands.map(brand => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrand(brand)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                selectedBrand?.id === brand.id
                  ? 'bg-zinc-800 border border-zinc-700/50'
                  : 'hover:bg-zinc-900 border border-transparent'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logo} alt="" className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-zinc-200 truncate">{brand.name}</p>
                <p className="text-[10px] text-zinc-600">{brand.niche}</p>
              </div>
              <span className="text-[10px] text-zinc-600 flex-shrink-0">{brand.assets.length}</span>
            </button>
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-zinc-800/60 hover:border-zinc-600 text-zinc-600 hover:text-zinc-400 transition-all text-[12px]"
          >
            <Plus className="w-4 h-4" />
            Add Brand
          </button>
        </div>

        {/* Brand detail */}
        {selectedBrand ? (
          <div className="space-y-5">
            {/* Brand header */}
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedBrand.logo} alt="" className="w-14 h-14 rounded-xl" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-[18px] font-bold text-zinc-100">{selectedBrand.name}</h2>
                    <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{selectedBrand.niche}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {[
                      { label: 'Avatars', value: selectedBrand.activeAvatars, color: 'text-pink-400' },
                      { label: 'Campaigns', value: selectedBrand.activeCampaigns, color: 'text-violet-400' },
                      { label: 'Active Ads', value: selectedBrand.totalAdsRunning, color: 'text-blue-400' },
                      { label: 'Top Score', value: selectedBrand.topScore > 0 ? `${selectedBrand.topScore}x` : '—', color: 'text-emerald-400' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                        <p className={cn('text-[16px] font-bold', stat.color)}>{stat.value}</p>
                        <p className="text-[9px] text-zinc-600">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Asset catalog */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-zinc-300">Asset Catalog</h3>
                <button className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                  <Plus className="w-3 h-3" />
                  Add Asset
                </button>
              </div>

              {/* Asset type filter */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {(['All', 'Hook', 'Script', 'Avatar', 'Visual Style', 'Ad Creative'] as (AssetType | 'All')[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterAsset(type)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-[11px] font-medium transition-all',
                      filterAsset === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {filteredAssets.length > 0 ? (
                <div className="space-y-3">
                  {filteredAssets.map(asset => {
                    const AssetIcon = ASSET_ICONS[asset.type];
                    return (
                      <div key={asset.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 group">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', ASSET_COLORS[asset.type])}>
                              <AssetIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-zinc-200">{asset.title}</p>
                              <p className="text-[10px] text-zinc-600">{asset.addedAt}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {asset.performance && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                <TrendingUp className="w-3 h-3" />
                                {asset.performance.toFixed(1)}x
                              </div>
                            )}
                            <button
                              onClick={() => copyAsset(asset.id, asset.content)}
                              className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
                            >
                              {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => deleteAsset(selectedBrand.id, asset.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[12px] text-zinc-400 leading-relaxed line-clamp-2 ml-9.5">
                          {asset.content}
                        </p>

                        <div className="flex gap-1.5 mt-2.5 ml-9.5 flex-wrap">
                          {asset.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                              <Tag className="w-2 h-2" />
                              {tag}
                            </span>
                          ))}
                          {asset.clonedFrom && (
                            <span className="flex items-center gap-1 text-[9px] bg-blue-950/60 text-blue-400 border border-blue-700/30 px-1.5 py-0.5 rounded">
                              <ExternalLink className="w-2 h-2" />
                              cloned from {asset.clonedFrom}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-900/40 border border-dashed border-zinc-800/60 rounded-xl">
                  <Layers className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-[12px] text-zinc-600">No {filterAsset !== 'All' ? filterAsset.toLowerCase() + ' ' : ''}assets yet.</p>
                  <p className="text-[11px] text-zinc-700 mt-1">Save hooks from Research, scripts from the Script Engine, or ads from Ad Intel.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-center">
            <div>
              <Briefcase className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Select a brand to manage its asset catalog.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Brand Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-bold text-zinc-100">Create New Brand</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-600 hover:text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Brand Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="My Brand"
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/60"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Niche / Industry</label>
                <input
                  value={form.niche}
                  onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
                  placeholder="e.g. SaaS, Fitness, Real Estate"
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/60"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                    className="w-10 h-9 rounded-lg border border-zinc-700/50 bg-zinc-800 cursor-pointer"
                  />
                  <span className="text-[12px] text-zinc-400 font-mono">{form.primaryColor}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={createBrand}
                disabled={!form.name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-[13px] font-semibold py-2.5 rounded-lg transition-all"
              >
                Create Brand
              </button>
              <button onClick={() => setShowCreate(false)} className="px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[13px] rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
