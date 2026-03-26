'use client';

import { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import {
  Plus, Users, Eye, Play, Trash2, Search, Loader2, X,
  LayoutGrid, List, ChevronUp, ChevronDown, Filter, Check,
  GripVertical, ListChecks, Tag, AlignJustify,
} from 'lucide-react';
import { getWatchlists, createWatchlist, addChannelToWatchlist, removeChannelFromWatchlist } from '@/actions/channels';
import { searchYouTubeChannels, bulkLookupYouTubeChannels } from '@/actions/youtube';
import { formatNumber } from '@/lib/utils';
import type { PlatformType, Watchlist, TrackedChannel } from '@/types';

// ─── types ────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'platform' | 'subscribers' | 'avg_views' | 'lists';
type SortDir = 'asc' | 'desc';

interface EnrichedChannel extends TrackedChannel {
  watchlistIds: string[];
  watchlistNames: string[];
}

// ─── small components ─────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: PlatformType }) {
  const map: Record<PlatformType, string> = {
    YOUTUBE:   'bg-red-500/15 text-red-400 border-red-500/20',
    TIKTOK:    'bg-zinc-700/60 text-zinc-300 border-zinc-600/30',
    INSTAGRAM: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  };
  const label: Record<PlatformType, string> = { YOUTUBE: 'YouTube', TIKTOK: 'TikTok', INSTAGRAM: 'Instagram' };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${map[platform]}`}>
      {label[platform]}
    </span>
  );
}

function ChannelAvatar({ channel, size = 10 }: { channel: TrackedChannel; size?: number }) {
  const initials = (channel.display_name ?? channel.handle).slice(0, 2).toUpperCase();
  const sz = `w-${size} h-${size}`;
  const badge = size >= 10 ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="relative shrink-0">
      {channel.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={channel.avatar_url} alt="" className={`${sz} rounded-full bg-zinc-800 object-cover`} />
      ) : (
        <div className={`${sz} rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold`}>
          {initials}
        </div>
      )}
      <div className={`absolute -bottom-0.5 -right-0.5 ${badge} rounded-full flex items-center justify-center ${
        channel.platform === 'YOUTUBE' ? 'bg-red-600' :
        channel.platform === 'TIKTOK' ? 'bg-zinc-200' :
        'bg-gradient-to-r from-purple-600 to-pink-600'
      }`}>
        <span className="font-black text-white" style={{ fontSize: 7 }}>
          {channel.platform === 'YOUTUBE' ? 'YT' : channel.platform === 'TIKTOK' ? 'TK' : 'IG'}
        </span>
      </div>
    </div>
  );
}

function SortBtn({ col, active, dir, onClick }: { col: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-0.5 hover:text-zinc-200 transition-colors">
      {col}
      {active
        ? dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        : <ChevronDown className="w-3 h-3 opacity-30" />}
    </button>
  );
}

// Popover to manage which watchlists a channel belongs to
function ManageListsPopover({
  channel,
  watchlists,
  onClose,
  onToggle,
  busy,
}: {
  channel: EnrichedChannel;
  watchlists: Watchlist[];
  onClose: () => void;
  onToggle: (wlId: string, inList: boolean) => void;
  busy: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-50 w-52 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-xl shadow-black/40 p-3 space-y-1"
    >
      <p className="text-[11px] font-semibold text-zinc-400 mb-2">Move / copy to watchlist</p>
      {watchlists.map((wl) => {
        const inList = channel.watchlistIds.includes(wl.id);
        return (
          <button
            key={wl.id}
            onClick={() => onToggle(wl.id, inList)}
            disabled={busy === wl.id}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] transition-all ${
              inList
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
              inList ? 'bg-violet-500 border-violet-500' : 'border-zinc-600'
            }`}>
              {busy === wl.id
                ? <Loader2 className="w-2.5 h-2.5 animate-spin text-white" />
                : inList ? <Check className="w-2.5 h-2.5 text-white" /> : null}
            </div>
            <span className="truncate">{wl.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isPending, startTransition] = useTransition();

  // new watchlist form
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [savingWatchlist, setSavingWatchlist] = useState(false);
  const [saveError, setSaveError] = useState('');

  // add creator panel
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [newChannelQuery, setNewChannelQuery] = useState('');
  const [newChannelPlatform, setNewChannelPlatform] = useState<PlatformType>('YOUTUBE');
  const [searchResults, setSearchResults] = useState<{ channelId: string; title: string; thumbnail: string; subscriberCount?: number; avgViews?: number; topicCategory?: string }[]>([]);
  const [srSortKey, setSrSortKey] = useState<'name' | 'subscribers' | 'avgViews'>('subscribers');
  const [srSortDir, setSrSortDir] = useState<SortDir>('desc');
  const [searching, setSearching] = useState(false);
  const [addingChannelId, setAddingChannelId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const [targetWatchlistIds, setTargetWatchlistIds] = useState<string[]>([]);
  // bulk mode
  const [bulkText, setBulkText] = useState('');
  const [bulkPreviewing, setBulkPreviewing] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ channelId: string; title: string; thumbnail: string; subscriberCount?: number; avgViews?: number; topicCategory?: string }[]>([]);
  const [bulkAddingAll, setBulkAddingAll] = useState(false);

  // table filters & sort
  const [filterPlatform, setFilterPlatform] = useState<PlatformType | 'ALL'>('ALL');
  const [filterWatchlist, setFilterWatchlist] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // manage-lists popover
  const [managingChannel, setManagingChannel] = useState<EnrichedChannel | null>(null);
  const [manageBusy, setManageBusy] = useState<string | null>(null);

  // drag-and-drop
  const [draggingChannelId, setDraggingChannelId] = useState<string | null>(null);
  const [dragOverWatchlistId, setDragOverWatchlistId] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const data = await getWatchlists();
      setWatchlists(data);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (watchlists.length > 0 && targetWatchlistIds.length === 0) {
      setTargetWatchlistIds([watchlists[0].id]);
    }
  }, [watchlists, targetWatchlistIds.length]);

  const allChannels = useMemo<EnrichedChannel[]>(() => {
    const map = new Map<string, EnrichedChannel>();
    for (const wl of watchlists) {
      for (const ch of wl.channels ?? []) {
        if (map.has(ch.id)) {
          map.get(ch.id)!.watchlistIds.push(wl.id);
          map.get(ch.id)!.watchlistNames.push(wl.name);
        } else {
          map.set(ch.id, { ...ch, watchlistIds: [wl.id], watchlistNames: [wl.name] });
        }
      }
    }
    return Array.from(map.values());
  }, [watchlists]);

  const displayChannels = useMemo<EnrichedChannel[]>(() => {
    let list = allChannels;
    const wlFilter = selectedWatchlist !== 'all' ? selectedWatchlist : filterWatchlist;
    if (wlFilter !== 'all') list = list.filter((c) => c.watchlistIds.includes(wlFilter));
    if (filterPlatform !== 'ALL') list = list.filter((c) => c.platform === filterPlatform);
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase();
      list = list.filter((c) => (c.display_name ?? c.handle).toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.display_name ?? a.handle).localeCompare(b.display_name ?? b.handle);
      else if (sortKey === 'platform') cmp = a.platform.localeCompare(b.platform);
      else if (sortKey === 'subscribers') cmp = (a.subscriber_count ?? 0) - (b.subscriber_count ?? 0);
      else if (sortKey === 'avg_views') cmp = a.average_views - b.average_views;
      else if (sortKey === 'lists') cmp = a.watchlistIds.length - b.watchlistIds.length;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [allChannels, selectedWatchlist, filterWatchlist, filterPlatform, filterSearch, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function toggleSrSort(key: typeof srSortKey) {
    if (srSortKey === key) setSrSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSrSortKey(key); setSrSortDir('desc'); }
  }

  const sortedSearchResults = useMemo(() => {
    const list = addMode === 'bulk' ? bulkResults : searchResults;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (srSortKey === 'name') cmp = a.title.localeCompare(b.title);
      else if (srSortKey === 'subscribers') cmp = (a.subscriberCount ?? 0) - (b.subscriberCount ?? 0);
      else if (srSortKey === 'avgViews') cmp = (a.avgViews ?? 0) - (b.avgViews ?? 0);
      return srSortDir === 'asc' ? cmp : -cmp;
    });
  }, [searchResults, bulkResults, srSortKey, srSortDir, addMode]);

  // ── watchlist CRUD ───────────────────────────────────────────────────────────

  async function handleCreateWatchlist() {
    if (!newWatchlistName.trim()) return;
    setSavingWatchlist(true);
    setSaveError('');
    const result = await createWatchlist(newWatchlistName.trim());
    if (result.success && result.id) {
      const newWl: Watchlist = { id: result.id, user_id: '', name: newWatchlistName.trim(), created_at: new Date().toISOString(), channels: [] };
      setWatchlists((prev) => [...prev, newWl]);
      setNewWatchlistName('');
      setShowAddWatchlist(false);
    } else {
      setSaveError(result.error ?? 'Failed to create watchlist');
    }
    setSavingWatchlist(false);
  }

  async function handleRemoveChannel(channelId: string, watchlistId: string) {
    await removeChannelFromWatchlist(watchlistId, channelId);
    setWatchlists((prev) => prev.map((wl) =>
      wl.id === watchlistId ? { ...wl, channels: (wl.channels ?? []).filter((c) => c.id !== channelId) } : wl
    ));
    if (managingChannel?.id === channelId) setManagingChannel(null);
  }

  // ── manage-lists popover toggle ──────────────────────────────────────────────

  async function handleManageToggle(channel: EnrichedChannel, wlId: string, inList: boolean) {
    setManageBusy(wlId);
    const wl = watchlists.find((w) => w.id === wlId);
    if (inList) {
      await removeChannelFromWatchlist(wlId, channel.id);
      setWatchlists((prev) => prev.map((w) =>
        w.id === wlId ? { ...w, channels: (w.channels ?? []).filter((c) => c.id !== channel.id) } : w
      ));
    } else if (wl) {
      await addChannelToWatchlist(wlId, {
        platform: channel.platform,
        handle: channel.handle,
        display_name: channel.display_name,
        avatar_url: channel.avatar_url,
        subscriber_count: channel.subscriber_count,
        average_views: channel.average_views,
      });
      const newCh: TrackedChannel = { ...channel };
      setWatchlists((prev) => prev.map((w) =>
        w.id === wlId ? { ...w, channels: [...(w.channels ?? []), newCh] } : w
      ));
    }
    setManageBusy(null);
    // Update the managing channel to reflect new state
    setManagingChannel((prev) => {
      if (!prev || prev.id !== channel.id) return prev;
      const newIds = inList ? prev.watchlistIds.filter((id) => id !== wlId) : [...prev.watchlistIds, wlId];
      const newNames = inList
        ? prev.watchlistNames.filter((_, i) => prev.watchlistIds[i] !== wlId)
        : [...prev.watchlistNames, wl?.name ?? ''];
      return { ...prev, watchlistIds: newIds, watchlistNames: newNames };
    });
  }

  // ── drag and drop ────────────────────────────────────────────────────────────

  async function handleDrop(wlId: string) {
    setDragOverWatchlistId(null);
    if (!draggingChannelId) return;
    const channel = allChannels.find((c) => c.id === draggingChannelId);
    if (!channel || channel.watchlistIds.includes(wlId)) return; // already in this list
    await addChannelToWatchlist(wlId, {
      platform: channel.platform,
      handle: channel.handle,
      display_name: channel.display_name,
      avatar_url: channel.avatar_url,
      subscriber_count: channel.subscriber_count,
      average_views: channel.average_views,
    });
    const newCh: TrackedChannel = { ...channel };
    setWatchlists((prev) => prev.map((w) =>
      w.id === wlId ? { ...w, channels: [...(w.channels ?? []), newCh] } : w
    ));
    setDraggingChannelId(null);
  }

  // ── add creator ──────────────────────────────────────────────────────────────

  async function handleSearchChannels() {
    if (!newChannelQuery.trim()) return;
    setSearching(true); setSearchResults([]); setAddError('');
    if (newChannelPlatform === 'YOUTUBE') {
      const res = await searchYouTubeChannels(newChannelQuery.trim(), 6);
      if (res.success && res.data) setSearchResults(res.data);
      else setAddError(res.error ?? 'Search failed');
    } else {
      await handleAddManual();
    }
    setSearching(false);
  }

  async function handleBulkPreview() {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBulkPreviewing(true); setBulkResults([]); setAddError('');
    if (newChannelPlatform === 'YOUTUBE') {
      const res = await bulkLookupYouTubeChannels(lines);
      if (res.success && res.data) setBulkResults(res.data);
      else setAddError(res.error ?? 'Lookup failed');
    } else {
      // For non-YouTube platforms, convert lines to placeholder results
      setBulkResults(lines.map((l, i) => ({ channelId: `manual-${i}`, title: l, thumbnail: '' })));
    }
    setBulkPreviewing(false);
  }

  async function handleBulkAddAll() {
    if (!bulkResults.length || targetWatchlistIds.length === 0) return;
    setBulkAddingAll(true);
    if (newChannelPlatform === 'YOUTUBE') {
      await Promise.all(bulkResults.flatMap((ch) =>
        targetWatchlistIds.map((wlId) =>
          addChannelToWatchlist(wlId, {
            platform: 'YOUTUBE',
            handle: `@${ch.title.toLowerCase().replace(/\s+/g, '')}`,
            display_name: ch.title,
            avatar_url: ch.thumbnail,
            subscriber_count: ch.subscriberCount,
            average_views: ch.avgViews ?? 0,
          })
        )
      ));
    } else {
      await Promise.all(bulkResults.flatMap((ch) =>
        targetWatchlistIds.map((wlId) =>
          addChannelToWatchlist(wlId, { platform: newChannelPlatform, handle: ch.title })
        )
      ));
    }
    const data = await getWatchlists(); setWatchlists(data);
    setBulkAddingAll(false);
    resetAddForm();
  }

  async function handleAddManual() {
    if (targetWatchlistIds.length === 0 || !newChannelQuery.trim()) return;
    await Promise.all(targetWatchlistIds.map((wlId) =>
      addChannelToWatchlist(wlId, { platform: newChannelPlatform, handle: newChannelQuery.trim() })
    ));
    const data = await getWatchlists(); setWatchlists(data); resetAddForm();
  }

  async function handleAddFromSearch(ch: { channelId: string; title: string; thumbnail: string; subscriberCount?: number; avgViews?: number }) {
    if (targetWatchlistIds.length === 0) return;
    setAddingChannelId(ch.channelId);
    await Promise.all(targetWatchlistIds.map((wlId) =>
      addChannelToWatchlist(wlId, {
        platform: 'YOUTUBE',
        handle: `@${ch.title.toLowerCase().replace(/\s+/g, '')}`,
        display_name: ch.title,
        avatar_url: ch.thumbnail,
        subscriber_count: ch.subscriberCount,
        average_views: ch.avgViews ?? 0,
      })
    ));
    const data = await getWatchlists(); setWatchlists(data);
    setAddingChannelId(null); resetAddForm();
  }

  function resetAddForm() {
    setShowAddChannel(false); setNewChannelQuery(''); setSearchResults([]);
    setBulkText(''); setBulkResults([]); setAddError(''); setAddMode('single');
  }

  function toggleTargetWatchlist(id: string) {
    setTargetWatchlistIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const activeWatchlistName = selectedWatchlist === 'all'
    ? 'All Channels'
    : (watchlists.find((w) => w.id === selectedWatchlist)?.name ?? '');

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto" onClick={() => setManagingChannel(null)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Channels</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track creators across watchlists. Drag cards onto a list or use ☰ to move.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-800 border border-zinc-700/50 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}><List className="w-3.5 h-3.5" /></button>
          </div>
          <button onClick={() => { setShowAddChannel(true); setSearchResults([]); setAddError(''); }}
            className="flex items-center gap-1.5 text-[12px] text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/50 px-3 py-1.5 rounded-lg transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Creator
          </button>
          <button onClick={() => { setShowAddWatchlist(true); setSaveError(''); }}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Watchlist
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-[12px] text-red-400">
          <X className="w-3.5 h-3.5 flex-shrink-0" /> {saveError}
        </div>
      )}

      {isPending && !loaded ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /><span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="flex gap-5">
          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="w-52 shrink-0 space-y-1">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-2">
              Watchlists
              {draggingChannelId && <span className="ml-1 text-violet-400 normal-case font-normal">— drop here</span>}
            </p>

            {/* All Channels (not a drop target) */}
            <button onClick={() => setSelectedWatchlist('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left ${
                selectedWatchlist === 'all'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}>
              <span className="font-medium">All Channels</span>
              <span className="text-[11px] text-zinc-500">{allChannels.length}</span>
            </button>

            {watchlists.map((wl) => {
              const isOver = dragOverWatchlistId === wl.id;
              const draggingChannel = draggingChannelId ? allChannels.find(c => c.id === draggingChannelId) : null;
              const alreadyIn = draggingChannel?.watchlistIds.includes(wl.id);
              return (
                <button key={wl.id}
                  onClick={() => setSelectedWatchlist(wl.id)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverWatchlistId(wl.id); }}
                  onDragLeave={() => setDragOverWatchlistId(null)}
                  onDrop={(e) => { e.preventDefault(); handleDrop(wl.id); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    isOver && !alreadyIn
                      ? 'bg-violet-500/30 text-violet-200 border border-violet-400/50 scale-[1.02]'
                      : isOver && alreadyIn
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50'
                      : selectedWatchlist === wl.id
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}>
                  <span className="font-medium truncate">{wl.name}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isOver && !alreadyIn && <Plus className="w-3 h-3 text-violet-400" />}
                    {isOver && alreadyIn && <Check className="w-3 h-3 text-zinc-500" />}
                    <span className="text-[11px] text-zinc-500">{wl.channels?.length ?? 0}</span>
                  </div>
                </button>
              );
            })}

            {watchlists.length === 0 && loaded && (
              <p className="text-[11px] text-zinc-600 px-1 pt-1">No watchlists yet.</p>
            )}

            {showAddWatchlist && (
              <div className="mt-2 p-3 bg-zinc-800/60 border border-zinc-700/40 rounded-lg space-y-2">
                <input type="text" placeholder="Watchlist name..." value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWatchlist()}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                  autoFocus />
                <div className="flex gap-1.5">
                  <button onClick={handleCreateWatchlist} disabled={savingWatchlist || !newWatchlistName.trim()}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[12px] py-1.5 rounded-md font-medium flex items-center justify-center gap-1">
                    {savingWatchlist ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Create
                  </button>
                  <button onClick={() => setShowAddWatchlist(false)}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[12px] py-1.5 rounded-md">Cancel</button>
                </div>
              </div>
            )}

            {draggingChannelId && (
              <p className="text-[10px] text-zinc-600 px-1 pt-1 text-center">Drop on a list above to add</p>
            )}
          </div>

          {/* ── Main ────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Add Creator panel */}
            {showAddChannel && (
              <div className="mb-4 p-4 bg-zinc-800/40 border border-zinc-700/40 rounded-xl space-y-3" onClick={(e) => e.stopPropagation()}>
                {/* Header + mode tabs */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-300">Add Creators</p>
                    <div className="flex bg-zinc-800 border border-zinc-700/50 rounded-md p-0.5">
                      <button onClick={() => { setAddMode('single'); setBulkResults([]); }}
                        className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition-colors font-medium ${addMode === 'single' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <Search className="w-3 h-3" />Single
                      </button>
                      <button onClick={() => { setAddMode('bulk'); setSearchResults([]); }}
                        className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition-colors font-medium ${addMode === 'bulk' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        <AlignJustify className="w-3 h-3" />Bulk
                      </button>
                    </div>
                  </div>
                  <button onClick={resetAddForm} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
                </div>

                {/* Platform selector (shared) */}
                <select value={newChannelPlatform} onChange={(e) => { setNewChannelPlatform(e.target.value as PlatformType); setSearchResults([]); setBulkResults([]); }}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/60">
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="INSTAGRAM">Instagram</option>
                </select>

                {/* Single mode */}
                {addMode === 'single' && (
                  <div className="flex gap-2">
                    <input type="text" placeholder={newChannelPlatform === 'YOUTUBE' ? 'Search channel name…' : '@handle'}
                      value={newChannelQuery} onChange={(e) => setNewChannelQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchChannels()}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                      autoFocus />
                    <button onClick={handleSearchChannels} disabled={searching || !newChannelQuery.trim()}
                      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                      {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      {newChannelPlatform === 'YOUTUBE' ? 'Search' : 'Add'}
                    </button>
                  </div>
                )}

                {/* Bulk mode */}
                {addMode === 'bulk' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-zinc-500">Paste handles, URLs, or channel IDs — one per line</p>
                    <textarea
                      placeholder={"@mkbhd\n@linustechtips\nhttps://youtube.com/@veritasium\nUCXXXXXXX"}
                      value={bulkText}
                      onChange={(e) => { setBulkText(e.target.value); setBulkResults([]); }}
                      rows={5}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none font-mono"
                      autoFocus
                    />
                    <button onClick={handleBulkPreview} disabled={bulkPreviewing || !bulkText.trim()}
                      className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                      {bulkPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      Preview ({bulkText.split('\n').filter((l) => l.trim()).length} entries)
                    </button>
                  </div>
                )}

                {/* Watchlist selector (shared) */}
                {watchlists.length > 0 && (
                  <div>
                    <p className="text-[11px] text-zinc-500 mb-1.5">Add to watchlist(s):</p>
                    <div className="flex flex-wrap gap-2">
                      {watchlists.map((wl) => {
                        const on = targetWatchlistIds.includes(wl.id);
                        return (
                          <button key={wl.id} onClick={() => toggleTargetWatchlist(wl.id)}
                            className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                              on ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:text-zinc-200'
                            }`}>
                            {on && <Check className="w-3 h-3" />}{wl.name}
                          </button>
                        );
                      })}
                    </div>
                    {targetWatchlistIds.length === 0 && <p className="text-[11px] text-amber-400 mt-1">Select at least one watchlist</p>}
                  </div>
                )}

                {addError && <p className="text-[11px] text-red-400 flex items-center gap-1"><X className="w-3 h-3" />{addError}</p>}

                {/* Search / bulk results */}
                {sortedSearchResults.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500">
                        {sortedSearchResults.length} {addMode === 'bulk' ? 'found' : 'results'} — {addMode === 'single' ? 'click to add' : 'add individually or import all'}
                      </p>
                      {/* Sort pills */}
                      <div className="flex items-center gap-1">
                        {(['subscribers', 'avgViews', 'name'] as const).map((k) => {
                          const labels = { subscribers: 'Subs', avgViews: 'Avg Views', name: 'Name' };
                          const active = srSortKey === k;
                          return (
                            <button key={k} onClick={() => toggleSrSort(k)}
                              className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded border transition-colors ${active ? 'bg-zinc-700 text-zinc-200 border-zinc-600' : 'text-zinc-500 border-zinc-700/50 hover:text-zinc-300'}`}>
                              {labels[k]}
                              {active ? (srSortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />) : null}
                            </button>
                          );
                        })}
                        {addMode === 'bulk' && (
                          <button onClick={handleBulkAddAll} disabled={bulkAddingAll || targetWatchlistIds.length === 0}
                            className="ml-2 flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-colors">
                            {bulkAddingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Import All
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {sortedSearchResults.map((ch) => (
                        <button key={ch.channelId} onClick={() => handleAddFromSearch(ch)}
                          disabled={addingChannelId === ch.channelId || targetWatchlistIds.length === 0}
                          className="flex items-center gap-2.5 p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 hover:border-violet-500/30 rounded-lg transition-all text-left disabled:opacity-60">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {ch.thumbnail ? <img src={ch.thumbnail} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" /> : <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-zinc-200 truncate">{ch.title}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {ch.subscriberCount && <p className="text-[10px] text-zinc-500">{formatNumber(ch.subscriberCount)} subs</p>}
                              {ch.avgViews && <p className="text-[10px] text-zinc-500">{formatNumber(ch.avgViews)} avg</p>}
                            </div>
                            {ch.topicCategory && (
                              <span className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50">
                                <Tag className="w-2 h-2" />{ch.topicCategory}
                              </span>
                            )}
                          </div>
                          {addingChannelId === ch.channelId
                            ? <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin flex-shrink-0" />
                            : <Plus className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filter bar (table) */}
            {viewMode === 'table' && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <input type="text" placeholder="Search name…" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
                  className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-[12px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/40 w-40" />
                <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as PlatformType | 'ALL')}
                  className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/40">
                  <option value="ALL">All Platforms</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="INSTAGRAM">Instagram</option>
                </select>
                {selectedWatchlist === 'all' && (
                  <select value={filterWatchlist} onChange={(e) => setFilterWatchlist(e.target.value)}
                    className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-300 focus:outline-none focus:border-violet-500/40">
                    <option value="all">All Watchlists</option>
                    {watchlists.map((wl) => <option key={wl.id} value={wl.id}>{wl.name}</option>)}
                  </select>
                )}
                <span className="ml-auto text-[11px] text-zinc-500">{displayChannels.length} creator{displayChannels.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Grid heading */}
            {viewMode === 'grid' && (
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-violet-400" />
                <h2 className="text-[15px] font-semibold text-zinc-200">{activeWatchlistName}</h2>
                <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{displayChannels.length}</span>
              </div>
            )}

            {/* ── GRID VIEW ── */}
            {viewMode === 'grid' && (
              displayChannels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayChannels.map((channel) => (
                    <div key={channel.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('channelId', channel.id);
                        setDraggingChannelId(channel.id);
                      }}
                      onDragEnd={() => { setDraggingChannelId(null); setDragOverWatchlistId(null); }}
                      className={`bg-zinc-900 border rounded-xl p-4 hover:border-zinc-700 transition-all group relative cursor-grab active:cursor-grabbing ${
                        draggingChannelId === channel.id ? 'opacity-50 border-violet-500/40' : 'border-zinc-800/60'
                      }`}
                    >
                      {/* drag handle hint */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity">
                        <GripVertical className="w-4 h-4 text-zinc-400" />
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <ChannelAvatar channel={channel} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate">{channel.display_name ?? channel.handle}</p>
                          <p className="text-[11px] text-zinc-500">{channel.handle}</p>
                        </div>
                        <PlatformBadge platform={channel.platform} />
                      </div>

                      {channel.watchlistNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {channel.watchlistNames.map((name, i) => (
                            <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{name}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-zinc-500" />
                          <span className="text-[11px] text-zinc-400">{formatNumber(channel.subscriber_count ?? 0)} subs</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3 h-3 text-zinc-500" />
                          <span className="text-[11px] text-zinc-400">
                            {channel.average_views > 0 ? formatNumber(channel.average_views) + ' avg' : '—'}
                          </span>
                        </div>
                        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {/* Manage lists */}
                          <div className="relative">
                            <button
                              onClick={() => setManagingChannel((prev) => prev?.id === channel.id ? null : channel)}
                              title="Move / add to watchlists"
                              className="p-1.5 rounded-lg hover:bg-violet-500/10 text-zinc-500 hover:text-violet-400 transition-colors">
                              <ListChecks className="w-3.5 h-3.5" />
                            </button>
                            {managingChannel?.id === channel.id && (
                              <ManageListsPopover
                                channel={managingChannel}
                                watchlists={watchlists}
                                onClose={() => setManagingChannel(null)}
                                onToggle={(wlId, inList) => handleManageToggle(managingChannel, wlId, inList)}
                                busy={manageBusy}
                              />
                            )}
                          </div>
                          {/* Remove per watchlist */}
                          {channel.watchlistIds.map((wlId, i) => (
                            <button key={wlId} onClick={() => handleRemoveChannel(channel.id, wlId)}
                              title={`Remove from ${channel.watchlistNames[i]}`}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-500">
                  <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No creators yet</p>
                  <p className="text-[12px] mt-1">Click <span className="text-violet-400">Add Creator</span> to search and track channels</p>
                </div>
              )
            )}

            {/* ── TABLE VIEW ── */}
            {viewMode === 'table' && (
              displayChannels.length > 0 ? (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/60">
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-zinc-500 w-[35%]">
                          <SortBtn col="Channel" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
                        </th>
                        <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-zinc-500">
                          <SortBtn col="Platform" active={sortKey === 'platform'} dir={sortDir} onClick={() => toggleSort('platform')} />
                        </th>
                        <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-zinc-500">
                          <SortBtn col="Subscribers" active={sortKey === 'subscribers'} dir={sortDir} onClick={() => toggleSort('subscribers')} />
                        </th>
                        <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-zinc-500">
                          <SortBtn col="Avg Views" active={sortKey === 'avg_views'} dir={sortDir} onClick={() => toggleSort('avg_views')} />
                        </th>
                        <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-zinc-500">
                          <SortBtn col="Lists" active={sortKey === 'lists'} dir={sortDir} onClick={() => toggleSort('lists')} />
                        </th>
                        <th className="w-16 px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {displayChannels.map((channel, i) => (
                        <tr key={channel.id}
                          className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group ${i % 2 === 0 ? '' : 'bg-zinc-900/20'}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <ChannelAvatar channel={channel} size={8} />
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-zinc-200 truncate">{channel.display_name ?? channel.handle}</p>
                                <p className="text-[11px] text-zinc-500 truncate">{channel.handle}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><PlatformBadge platform={channel.platform} /></td>
                          <td className="px-3 py-3 text-right text-[12px] text-zinc-300">
                            {channel.subscriber_count ? formatNumber(channel.subscriber_count) : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-3 py-3 text-right text-[12px] text-zinc-300">
                            {channel.average_views > 0 ? formatNumber(channel.average_views) : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {channel.watchlistNames.map((name, j) => (
                                <span key={j} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{name}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <div className="relative">
                                <button onClick={() => setManagingChannel((prev) => prev?.id === channel.id ? null : channel)}
                                  title="Move / add to watchlists"
                                  className="p-1 rounded hover:bg-violet-500/10 text-zinc-500 hover:text-violet-400 transition-colors">
                                  <ListChecks className="w-3.5 h-3.5" />
                                </button>
                                {managingChannel?.id === channel.id && (
                                  <ManageListsPopover
                                    channel={managingChannel}
                                    watchlists={watchlists}
                                    onClose={() => setManagingChannel(null)}
                                    onToggle={(wlId, inList) => handleManageToggle(managingChannel, wlId, inList)}
                                    busy={manageBusy}
                                  />
                                )}
                              </div>
                              {channel.watchlistIds.map((wlId, j) => (
                                <button key={wlId} onClick={() => handleRemoveChannel(channel.id, wlId)}
                                  title={`Remove from ${channel.watchlistNames[j]}`}
                                  className="p-1 rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-500 border border-zinc-800 rounded-xl">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No channels match your filters</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
