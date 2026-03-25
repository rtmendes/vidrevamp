'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Plus,
  Zap,
  Star,
  TrendingUp,
  Play,
  Copy,
  Check,
  Trash2,
  X,
  Sparkles,
  Mic,
  Camera,
  Heart,
  Briefcase,
  GraduationCap,
  Laugh,
  ShieldCheck,
  Video,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listHeyGenAvatars, listHeyGenVoices, generateAvatarVideo, getVideoStatus } from '@/actions/heygen';

// ── Types ────────────────────────────────────────────────────────────────────

type AvatarTone = 'Professional' | 'Casual' | 'Energetic' | 'Calm' | 'Authoritative' | 'Relatable';
type AvatarNiche = 'Business' | 'Health & Wellness' | 'Finance' | 'Tech & AI' | 'Lifestyle' | 'Education' | 'E-Commerce' | 'Fitness';
type AvatarStyle = 'Talking Head' | 'Over Shoulder' | 'Outdoor' | 'Studio' | 'Documentary';

interface UGCAvatar {
  id: string;
  name: string;
  role: string;
  niche: AvatarNiche;
  tone: AvatarTone;
  style: AvatarStyle;
  age: string;
  avatar: string;
  bio: string;
  brandId?: string;
  brandColor: string;
  videosGenerated: number;
  avgPerformance: number;
  topHook: string;
  platforms: string[];
  isCustom: boolean;
}

// ── Mock Avatars ──────────────────────────────────────────────────────────────

const INITIAL_AVATARS: UGCAvatar[] = [
  {
    id: 'av1',
    name: 'Marcus Chen',
    role: 'Serial Entrepreneur',
    niche: 'Business',
    tone: 'Authoritative',
    style: 'Talking Head',
    age: '38',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus&backgroundColor=7c3aed',
    bio: 'Built and sold 3 companies. Straight-talking, data-driven. No fluff.',
    brandColor: '#7c3aed',
    videosGenerated: 47,
    avgPerformance: 12.4,
    topHook: 'I made this mistake for 5 years before I finally figured it out.',
    platforms: ['YouTube', 'TikTok'],
    isCustom: false,
  },
  {
    id: 'av2',
    name: 'Sofia Reyes',
    role: 'Financial Coach',
    niche: 'Finance',
    tone: 'Relatable',
    style: 'Talking Head',
    age: '31',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia&backgroundColor=0891b2',
    bio: 'Paid off $80K in debt in 2 years. Now teaching others to do the same.',
    brandColor: '#0891b2',
    videosGenerated: 63,
    avgPerformance: 9.8,
    topHook: 'Nobody told me this about money when I was broke.',
    platforms: ['TikTok', 'Instagram'],
    isCustom: false,
  },
  {
    id: 'av3',
    name: 'Jake Torres',
    role: 'Fitness Transformation Coach',
    niche: 'Fitness',
    tone: 'Energetic',
    style: 'Outdoor',
    age: '27',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jake&backgroundColor=059669',
    bio: 'Lost 60 lbs in 8 months. Now helps busy professionals get in the best shape of their lives.',
    brandColor: '#059669',
    videosGenerated: 89,
    avgPerformance: 14.2,
    topHook: 'I ate 3,500 calories every day for 90 days and lost 30 pounds. Here\'s how.',
    platforms: ['TikTok', 'YouTube', 'Instagram'],
    isCustom: false,
  },
  {
    id: 'av4',
    name: 'Dr. Priya Sharma',
    role: 'Productivity Scientist',
    niche: 'Education',
    tone: 'Professional',
    style: 'Studio',
    age: '42',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=d97706',
    bio: 'PhD in Behavioral Psychology. Translates research into actionable productivity systems.',
    brandColor: '#d97706',
    videosGenerated: 34,
    avgPerformance: 8.7,
    topHook: 'Scientists just discovered why your to-do list is making you less productive.',
    platforms: ['YouTube', 'LinkedIn'],
    isCustom: false,
  },
  {
    id: 'av5',
    name: 'Tyler Walsh',
    role: 'E-Com Store Owner',
    niche: 'E-Commerce',
    tone: 'Casual',
    style: 'Over Shoulder',
    age: '24',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tyler&backgroundColor=dc2626',
    bio: 'Runs 4 Shopify stores from his apartment. Transparent about the real numbers.',
    brandColor: '#dc2626',
    videosGenerated: 112,
    avgPerformance: 11.1,
    topHook: 'This is my Shopify dashboard. I\'m showing you everything.',
    platforms: ['TikTok', 'YouTube'],
    isCustom: false,
  },
  {
    id: 'av6',
    name: 'Aisha Johnson',
    role: 'Health & Wellness Creator',
    niche: 'Health & Wellness',
    tone: 'Calm',
    style: 'Documentary',
    age: '35',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aisha&backgroundColor=7c3aed',
    bio: 'Reversed autoimmune disease through lifestyle changes. Shares what doctors won\'t tell you.',
    brandColor: '#7c3aed',
    videosGenerated: 58,
    avgPerformance: 10.3,
    topHook: 'My doctor told me I\'d be on medication for life. I\'m not.',
    platforms: ['YouTube', 'Instagram'],
    isCustom: false,
  },
];

const TONE_ICONS: Record<AvatarTone, React.FC<{ className?: string }>> = {
  Professional: Briefcase,
  Casual: Heart,
  Energetic: Zap,
  Calm: Star,
  Authoritative: ShieldCheck,
  Relatable: Laugh,
};

const NICHES: AvatarNiche[] = ['Business', 'Health & Wellness', 'Finance', 'Tech & AI', 'Lifestyle', 'Education', 'E-Commerce', 'Fitness'];
const TONES: AvatarTone[] = ['Professional', 'Casual', 'Energetic', 'Calm', 'Authoritative', 'Relatable'];
const STYLES: AvatarStyle[] = ['Talking Head', 'Over Shoulder', 'Outdoor', 'Studio', 'Documentary'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [avatars, setAvatars] = useState<UGCAvatar[]>(INITIAL_AVATARS);
  const [selectedAvatar, setSelectedAvatar] = useState<UGCAvatar | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [filterNiche, setFilterNiche] = useState<AvatarNiche | 'All'>('All');

  // Create form state
  const [form, setForm] = useState({
    name: '', role: '', niche: 'Business' as AvatarNiche, tone: 'Casual' as AvatarTone,
    style: 'Talking Head' as AvatarStyle, age: '', bio: '',
  });

  // HeyGen state
  const [hgAvatars, setHgAvatars] = useState<{ avatar_id: string; avatar_name: string; preview_image_url: string }[]>([]);
  const [hgVoices, setHgVoices] = useState<{ voice_id: string; name: string; language: string; gender: string }[]>([]);
  const [hgLoading, setHgLoading] = useState(false);
  const [hgGenLoading, setHgGenLoading] = useState(false);
  const [hgVideoUrl, setHgVideoUrl] = useState('');
  const [hgStatus, setHgStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [hgScript, setHgScript] = useState('');
  const [hgAvatarId, setHgAvatarId] = useState('');
  const [hgVoiceId, setHgVoiceId] = useState('');
  const [hgError, setHgError] = useState('');
  const [showHgPanel, setShowHgPanel] = useState(false);

  useEffect(() => {
    if (!showHgPanel || hgAvatars.length > 0) return;
    setHgLoading(true);
    Promise.all([listHeyGenAvatars(), listHeyGenVoices()]).then(([av, vo]) => {
      if (av.success && av.data) {
        setHgAvatars(av.data);
        setHgAvatarId(av.data[0]?.avatar_id ?? '');
      }
      if (vo.success && vo.data) {
        const en = vo.data.filter(v => v.language?.startsWith('en'));
        setHgVoices(en.length > 0 ? en : vo.data);
        setHgVoiceId((en.length > 0 ? en : vo.data)[0]?.voice_id ?? '');
      }
      setHgLoading(false);
    });
  }, [showHgPanel, hgAvatars.length]);

  async function generateHeyGenVideo() {
    if (!hgScript.trim() || !hgAvatarId || !hgVoiceId) return;
    setHgGenLoading(true);
    setHgError('');
    setHgVideoUrl('');
    setHgStatus('processing');
    try {
      const res = await generateAvatarVideo({ avatar_id: hgAvatarId, voice_id: hgVoiceId, script: hgScript });
      if (!res.success || !res.data?.video_id) throw new Error(res.error ?? 'Failed to start generation');
      const vid = res.data.video_id;
      // Poll every 5 seconds
      const poll = setInterval(async () => {
        const status = await getVideoStatus(vid);
        if (status.data?.status === 'completed') {
          clearInterval(poll);
          setHgVideoUrl(status.data.video_url ?? '');
          setHgStatus('completed');
          setHgGenLoading(false);
        } else if (status.data?.status === 'failed') {
          clearInterval(poll);
          setHgStatus('failed');
          setHgError('Video generation failed');
          setHgGenLoading(false);
        }
      }, 5000);
    } catch (err) {
      setHgError(err instanceof Error ? err.message : 'HeyGen error');
      setHgStatus('failed');
      setHgGenLoading(false);
    }
  }

  function copyHook(id: string, hook: string) {
    navigator.clipboard.writeText(hook).catch(() => {});
    setCopiedHook(id);
    setTimeout(() => setCopiedHook(null), 2000);
  }

  function createAvatar() {
    if (!form.name.trim() || !form.role.trim()) return;
    const newAvatar: UGCAvatar = {
      id: `av${Date.now()}`,
      name: form.name,
      role: form.role,
      niche: form.niche,
      tone: form.tone,
      style: form.style,
      age: form.age || '30',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name.toLowerCase().replace(' ', '')}&backgroundColor=7c3aed`,
      bio: form.bio || `${form.role} sharing authentic content.`,
      brandColor: '#7c3aed',
      videosGenerated: 0,
      avgPerformance: 0,
      topHook: '',
      platforms: ['TikTok', 'YouTube'],
      isCustom: true,
    };
    setAvatars(prev => [...prev, newAvatar]);
    setShowCreate(false);
    setForm({ name: '', role: '', niche: 'Business', tone: 'Casual', style: 'Talking Head', age: '', bio: '' });
  }

  function deleteAvatar(id: string) {
    setAvatars(prev => prev.filter(a => a.id !== id));
    if (selectedAvatar?.id === id) setSelectedAvatar(null);
  }

  const filtered = filterNiche === 'All' ? avatars : avatars.filter(a => a.niche === filterNiche);
  const ToneIcon = selectedAvatar ? TONE_ICONS[selectedAvatar.tone] : Zap;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">UGC Studio</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-9.5">
            Create AI UGC personas, assign scripts, and scale authentic content across brands.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-[13px] font-semibold rounded-lg transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Avatar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Avatars', value: avatars.length.toString(), color: 'text-pink-400' },
          { label: 'Videos Generated', value: avatars.reduce((s, a) => s + a.videosGenerated, 0).toString(), color: 'text-violet-400' },
          { label: 'Avg Performance', value: (avatars.filter(a => a.avgPerformance > 0).reduce((s, a) => s + a.avgPerformance, 0) / Math.max(avatars.filter(a => a.avgPerformance > 0).length, 1)).toFixed(1) + 'x', color: 'text-emerald-400' },
          { label: 'Custom Avatars', value: avatars.filter(a => a.isCustom).length.toString(), color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
            <p className="text-[11px] text-zinc-500 mb-2">{s.label}</p>
            <p className={cn('text-[22px] font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Niche filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['All', ...NICHES] as (AvatarNiche | 'All')[]).map(n => (
          <button
            key={n}
            onClick={() => setFilterNiche(n)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
              filterNiche === n
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-5">
        {/* Avatar grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 content-start">
          {filtered.map(avatar => {
            const Icon = TONE_ICONS[avatar.tone];
            const isSelected = selectedAvatar?.id === avatar.id;
            return (
              <div
                key={avatar.id}
                onClick={() => setSelectedAvatar(isSelected ? null : avatar)}
                className={cn(
                  'bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all group',
                  isSelected
                    ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
                    : 'border-zinc-800/60 hover:border-zinc-700'
                )}
              >
                {/* Avatar header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar.avatar} alt="" className="w-12 h-12 rounded-xl" />
                    {avatar.isCustom && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Star className="w-2.5 h-2.5 text-yellow-900" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-200 truncate">{avatar.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{avatar.role}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-medium text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                        {avatar.niche}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteAvatar(avatar.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-950 hover:text-red-400 text-zinc-600 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tone + Style */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg px-2 py-1">
                    <Icon className="w-3 h-3 text-violet-400" />
                    <span className="text-[10px] text-zinc-400">{avatar.tone}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg px-2 py-1">
                    <Camera className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-zinc-400">{avatar.style}</span>
                  </div>
                </div>

                {/* Stats */}
                {avatar.videosGenerated > 0 && (
                  <div className="flex items-center justify-between text-[11px] mb-3">
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Play className="w-3 h-3" />
                      {avatar.videosGenerated} videos
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      {avatar.avgPerformance.toFixed(1)}x avg
                    </div>
                  </div>
                )}

                {/* Top hook preview */}
                {avatar.topHook && (
                  <div className="bg-zinc-800/40 rounded-lg p-2.5">
                    <p className="text-[10px] text-zinc-600 mb-1">Top Hook</p>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 italic">&ldquo;{avatar.topHook}&rdquo;</p>
                  </div>
                )}

                {/* Platforms */}
                <div className="flex gap-1.5 mt-3">
                  {avatar.platforms.map(p => (
                    <span
                      key={p}
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded',
                        p === 'YouTube' ? 'bg-red-600/20 text-red-400' :
                        p === 'TikTok' ? 'bg-zinc-700 text-zinc-300' :
                        p === 'Instagram' ? 'bg-purple-600/20 text-purple-400' :
                        'bg-blue-600/20 text-blue-400'
                      )}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add placeholder */}
          <div
            onClick={() => setShowCreate(true)}
            className="bg-zinc-900/40 border border-zinc-800/40 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-zinc-600 transition-colors min-h-[200px]"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
              <Plus className="w-5 h-5 text-zinc-500" />
            </div>
            <p className="text-[12px] text-zinc-600 text-center">Create Custom Avatar</p>
          </div>
        </div>

        {/* Detail panel */}
        {selectedAvatar ? (
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-5 h-fit sticky top-4 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedAvatar.avatar} alt="" className="w-14 h-14 rounded-xl" />
                <div>
                  <p className="text-[15px] font-bold text-zinc-100">{selectedAvatar.name}</p>
                  <p className="text-[12px] text-zinc-500">{selectedAvatar.role}</p>
                  <p className="text-[11px] text-zinc-600">Age {selectedAvatar.age}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAvatar(null)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bio */}
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Bio</p>
              <p className="text-[12px] text-zinc-400 leading-relaxed">{selectedAvatar.bio}</p>
            </div>

            {/* Attributes */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Tone', value: selectedAvatar.tone, icon: ToneIcon },
                { label: 'Style', value: selectedAvatar.style, icon: Camera },
                { label: 'Niche', value: selectedAvatar.niche, icon: GraduationCap },
                { label: 'Platform', value: selectedAvatar.platforms.join(', '), icon: Mic },
              ].map(attr => (
                <div key={attr.label} className="bg-zinc-800/50 rounded-lg p-2.5">
                  <p className="text-[9px] text-zinc-600 mb-1">{attr.label}</p>
                  <p className="text-[11px] text-zinc-300 font-medium">{attr.value}</p>
                </div>
              ))}
            </div>

            {/* Performance */}
            {selectedAvatar.videosGenerated > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Performance</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-[18px] font-bold text-violet-400">{selectedAvatar.videosGenerated}</p>
                    <p className="text-[9px] text-zinc-600">Videos</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-[18px] font-bold text-emerald-400">{selectedAvatar.avgPerformance.toFixed(1)}x</p>
                    <p className="text-[9px] text-zinc-600">Avg Score</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top hook */}
            {selectedAvatar.topHook && (
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Top Performing Hook</p>
                <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-lg p-3">
                  <p className="text-[12px] text-zinc-300 italic leading-relaxed mb-2">&ldquo;{selectedAvatar.topHook}&rdquo;</p>
                  <button
                    onClick={() => copyHook(selectedAvatar.id, selectedAvatar.topHook)}
                    className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {copiedHook === selectedAvatar.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedHook === selectedAvatar.id ? 'Copied!' : 'Copy hook'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <a
                href="/dashboard/script"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[12px] font-semibold rounded-lg transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                Generate Script for {selectedAvatar.name.split(' ')[0]}
              </a>
              <button
                onClick={() => { setShowHgPanel(p => !p); setHgStatus('idle'); setHgVideoUrl(''); setHgError(''); }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[12px] font-medium rounded-lg transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                {showHgPanel ? 'Close' : 'Generate HeyGen Video'}
              </button>
            </div>

            {/* HeyGen Video Generator */}
            {showHgPanel && (
              <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3 h-3" /> HeyGen Video Generator
                </p>
                {hgLoading ? (
                  <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading avatars & voices…
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Avatar</label>
                      <select
                        value={hgAvatarId}
                        onChange={e => setHgAvatarId(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-pink-500/60"
                      >
                        {hgAvatars.map(a => <option key={a.avatar_id} value={a.avatar_id}>{a.avatar_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Voice (English)</label>
                      <select
                        value={hgVoiceId}
                        onChange={e => setHgVoiceId(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-pink-500/60"
                      >
                        {hgVoices.map(v => <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.gender})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 mb-1 block">Script</label>
                      <textarea
                        value={hgScript}
                        onChange={e => setHgScript(e.target.value)}
                        placeholder="Paste your video script here (max ~2500 chars)…"
                        rows={4}
                        className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-2.5 py-2 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/60 resize-none"
                      />
                      <p className="text-[10px] text-zinc-600 text-right">{hgScript.length}/2500</p>
                    </div>
                    {hgError && <p className="text-[11px] text-red-400">{hgError}</p>}
                    {hgStatus === 'processing' && (
                      <div className="flex items-center gap-2 text-[11px] text-yellow-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating video… (1–3 min)
                      </div>
                    )}
                    {hgStatus === 'completed' && hgVideoUrl && (
                      <a href={hgVideoUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Download / View Video
                      </a>
                    )}
                    <button
                      onClick={generateHeyGenVideo}
                      disabled={hgGenLoading || !hgScript.trim() || !hgAvatarId || !hgVoiceId}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white text-[12px] font-semibold rounded-lg transition-all"
                    >
                      {hgGenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                      {hgGenLoading ? 'Generating…' : 'Generate Video'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800/40 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <User className="w-10 h-10 text-zinc-700 mb-3" />
            <p className="text-[13px] text-zinc-500 mb-1">Select an avatar</p>
            <p className="text-[11px] text-zinc-700">to view details, copy hooks, and generate scripts</p>
          </div>
        )}
      </div>

      {/* Create Avatar Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <h2 className="text-[16px] font-bold text-zinc-100">Create New Avatar</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Alex Rivera"
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Role / Title *</label>
                  <input
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    placeholder="Startup Founder"
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Niche</label>
                  <select
                    value={form.niche}
                    onChange={e => setForm(f => ({ ...f, niche: e.target.value as AvatarNiche }))}
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
                  >
                    {NICHES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Age</label>
                  <input
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="28"
                    type="number"
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Tone</label>
                  <select
                    value={form.tone}
                    onChange={e => setForm(f => ({ ...f, tone: e.target.value as AvatarTone }))}
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
                  >
                    {TONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Visual Style</label>
                  <select
                    value={form.style}
                    onChange={e => setForm(f => ({ ...f, style: e.target.value as AvatarStyle }))}
                    className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
                  >
                    {STYLES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 mb-1.5 block">Bio / Backstory</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="What's their story? What makes them authentic and credible?"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={createAvatar}
                disabled={!form.name.trim() || !form.role.trim()}
                className="flex-1 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-white text-[13px] font-semibold py-2.5 rounded-lg transition-all"
              >
                Create Avatar
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[13px] rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
