'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Plus,
  Users,
  Eye,
  Play,
  Trash2,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { getWatchlists, createWatchlist, addChannelToWatchlist, removeChannelFromWatchlist } from '@/actions/channels';
import { searchYouTubeChannels } from '@/actions/youtube';
import { formatNumber } from '@/lib/utils';
import type { PlatformType, Watchlist, TrackedChannel } from '@/types';

function PlatformIcon({ platform }: { platform: PlatformType }) {
  if (platform === 'YOUTUBE') return <span className="text-red-500 font-black text-[10px]">YT</span>;
  if (platform === 'TIKTOK') return <span className="text-zinc-100 font-black text-[10px]">TK</span>;
  return <span className="text-pink-400 font-black text-[10px]">IG</span>;
}

function ChannelAvatar({ channel }: { channel: TrackedChannel }) {
  const initials = (channel.display_name ?? channel.handle).slice(0, 2).toUpperCase();
  return (
    <div className="relative">
      {channel.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={channel.avatar_url} alt={channel.display_name ?? ''} className="w-10 h-10 rounded-full bg-zinc-800 object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-bold">
          {initials}
        </div>
      )}
      <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
        channel.platform === 'YOUTUBE' ? 'bg-red-600' :
        channel.platform === 'TIKTOK' ? 'bg-zinc-100' :
        'bg-gradient-to-r from-purple-600 to-pink-600'
      }`}>
        <PlatformIcon platform={channel.platform} />
      </div>
    </div>
  );
}

export default function ChannelsPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Add watchlist form
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [savingWatchlist, setSavingWatchlist] = useState(false);

  // Add channel form
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelQuery, setNewChannelQuery] = useState('');
  const [newChannelPlatform, setNewChannelPlatform] = useState<PlatformType>('YOUTUBE');
  const [searchResults, setSearchResults] = useState<{ channelId: string; title: string; thumbnail: string; subscriberCount?: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingChannelId, setAddingChannelId] = useState<string | null>(null);
  const [addError, setAddError] = useState('');
  const [saveError, setSaveError] = useState('');

  const activeWatchlist = watchlists.find((w) => w.id === selectedWatchlist);

  // Load watchlists from Supabase on mount
  useEffect(() => {
    startTransition(async () => {
      const data = await getWatchlists();
      setWatchlists(data);
      if (data.length > 0) setSelectedWatchlist(data[0].id);
      setLoaded(true);
    });
  }, []);

  async function handleCreateWatchlist() {
    if (!newWatchlistName.trim()) return;
    setSavingWatchlist(true);
    setSaveError('');
    const result = await createWatchlist(newWatchlistName.trim());
    if (result.success && result.id) {
      const newWl: Watchlist = {
        id: result.id,
        user_id: '',
        name: newWatchlistName.trim(),
        created_at: new Date().toISOString(),
        channels: [],
      };
      setWatchlists((prev) => [...prev, newWl]);
      setSelectedWatchlist(result.id);
      setNewWatchlistName('');
      setShowAddWatchlist(false);
    } else {
      setSaveError(result.error ?? 'Failed to create watchlist. Please sign in.');
    }
    setSavingWatchlist(false);
  }

  async function handleSearchChannels() {
    if (!newChannelQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setAddError('');
    if (newChannelPlatform === 'YOUTUBE') {
      const res = await searchYouTubeChannels(newChannelQuery.trim(), 6);
      if (res.success && res.data) {
        setSearchResults(res.data);
      } else {
        setAddError(res.error ?? 'Search failed');
      }
    } else {
      // Non-YouTube: save handle directly
      await handleAddManual();
    }
    setSearching(false);
  }

  async function handleAddManual() {
    if (!selectedWatchlist || !newChannelQuery.trim()) return;
    const result = await addChannelToWatchlist(selectedWatchlist, {
      platform: newChannelPlatform,
      handle: newChannelQuery.trim(),
    });
    if (result.success && result.channelId) {
      const newCh: TrackedChannel = {
        id: result.channelId,
        platform: newChannelPlatform,
        handle: newChannelQuery.trim().startsWith('@') ? newChannelQuery.trim() : `@${newChannelQuery.trim()}`,
        display_name: newChannelQuery.trim(),
        average_views: 0,
        created_at: new Date().toISOString(),
      };
      setWatchlists((prev) => prev.map((wl) =>
        wl.id === selectedWatchlist
          ? { ...wl, channels: [...(wl.channels ?? []), newCh] }
          : wl
      ));
      resetAddForm();
    }
  }

  async function handleAddFromSearch(ch: { channelId: string; title: string; thumbnail: string; subscriberCount?: number }) {
    if (!selectedWatchlist) return;
    setAddingChannelId(ch.channelId);
    const result = await addChannelToWatchlist(selectedWatchlist, {
      platform: 'YOUTUBE',
      handle: `@${ch.title.toLowerCase().replace(/\s+/g, '')}`,
      display_name: ch.title,
      avatar_url: ch.thumbnail,
      subscriber_count: ch.subscriberCount,
    });
    if (result.success && result.channelId) {
      const newCh: TrackedChannel = {
        id: result.channelId,
        platform: 'YOUTUBE',
        handle: `@${ch.title.toLowerCase().replace(/\s+/g, '')}`,
        display_name: ch.title,
        avatar_url: ch.thumbnail,
        subscriber_count: ch.subscriberCount,
        average_views: 0,
        created_at: new Date().toISOString(),
      };
      setWatchlists((prev) => prev.map((wl) =>
        wl.id === selectedWatchlist
          ? { ...wl, channels: [...(wl.channels ?? []), newCh] }
          : wl
      ));
    }
    setAddingChannelId(null);
    resetAddForm();
  }

  async function handleRemoveChannel(channelId: string) {
    if (!selectedWatchlist) return;
    const result = await removeChannelFromWatchlist(selectedWatchlist, channelId);
    if (result.success) {
      setWatchlists((prev) => prev.map((wl) =>
        wl.id === selectedWatchlist
          ? { ...wl, channels: (wl.channels ?? []).filter((c) => c.id !== channelId) }
          : wl
      ));
    }
  }

  function resetAddForm() {
    setShowAddChannel(false);
    setNewChannelQuery('');
    setSearchResults([]);
    setAddError('');
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Channels</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Build watchlists of creators to track and analyze.
          </p>
        </div>
        <button
          onClick={() => { setShowAddWatchlist(true); setSaveError(''); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Watchlist
        </button>
      </div>

      {saveError && (
        <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-[12px] text-red-400">
          <X className="w-3.5 h-3.5 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {isPending && !loaded ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading watchlists…</span>
        </div>
      ) : (
        <div className="flex gap-5">
          {/* Watchlist sidebar */}
          <div className="w-56 shrink-0 space-y-2">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-3">
              Your Watchlists
            </p>

            {watchlists.length === 0 && loaded && (
              <p className="text-[12px] text-zinc-600 px-1">No watchlists yet. Create one to get started.</p>
            )}

            {watchlists.map((wl) => (
              <button
                key={wl.id}
                onClick={() => setSelectedWatchlist(wl.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                  selectedWatchlist === wl.id
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <span className="font-medium truncate">{wl.name}</span>
                <span className="text-[11px] text-zinc-600 shrink-0 ml-2">
                  {wl.channels?.length ?? 0}
                </span>
              </button>
            ))}

            {/* Add watchlist form */}
            {showAddWatchlist ? (
              <div className="mt-2 p-3 bg-zinc-800/60 border border-zinc-700/40 rounded-lg space-y-2">
                <input
                  type="text"
                  placeholder="Watchlist name..."
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWatchlist()}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                  autoFocus
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleCreateWatchlist}
                    disabled={savingWatchlist || !newWatchlistName.trim()}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-[12px] py-1.5 rounded-md transition-colors font-medium flex items-center justify-center gap-1"
                  >
                    {savingWatchlist ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Create
                  </button>
                  <button
                    onClick={() => setShowAddWatchlist(false)}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[12px] py-1.5 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Main content */}
          <div className="flex-1">
            {activeWatchlist ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-400" />
                    <h2 className="text-[15px] font-semibold text-zinc-200">{activeWatchlist.name}</h2>
                    <span className="text-[11px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {activeWatchlist.channels?.length ?? 0} creators
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowAddChannel(true); setSearchResults([]); setAddError(''); }}
                    className="flex items-center gap-1.5 text-[12px] text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Creator
                  </button>
                </div>

                {/* Add channel panel */}
                {showAddChannel && (
                  <div className="mb-4 p-4 bg-zinc-800/40 border border-zinc-700/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-300">Add a Creator</p>
                      <button onClick={resetAddForm} className="text-zinc-500 hover:text-zinc-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={newChannelPlatform}
                        onChange={(e) => { setNewChannelPlatform(e.target.value as PlatformType); setSearchResults([]); }}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/60"
                      >
                        <option value="YOUTUBE">YouTube</option>
                        <option value="TIKTOK">TikTok</option>
                        <option value="INSTAGRAM">Instagram</option>
                      </select>
                      <input
                        type="text"
                        placeholder={newChannelPlatform === 'YOUTUBE' ? 'Search channel name…' : '@handle'}
                        value={newChannelQuery}
                        onChange={(e) => setNewChannelQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchChannels()}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                        autoFocus
                      />
                      <button
                        onClick={handleSearchChannels}
                        disabled={searching || !newChannelQuery.trim()}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        {newChannelPlatform === 'YOUTUBE' ? 'Search' : 'Add'}
                      </button>
                    </div>

                    {addError && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <X className="w-3 h-3" /> {addError}
                      </p>
                    )}

                    {/* YouTube search results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] text-zinc-500">{searchResults.length} channels found — click to add</p>
                        <div className="grid grid-cols-2 gap-2">
                          {searchResults.map((ch) => (
                            <button
                              key={ch.channelId}
                              onClick={() => handleAddFromSearch(ch)}
                              disabled={addingChannelId === ch.channelId}
                              className="flex items-center gap-2.5 p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 hover:border-violet-500/30 rounded-lg transition-all text-left disabled:opacity-60"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={ch.thumbnail} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-zinc-200 truncate">{ch.title}</p>
                                {ch.subscriberCount && (
                                  <p className="text-[10px] text-zinc-500">{formatNumber(ch.subscriberCount)} subs</p>
                                )}
                              </div>
                              {addingChannelId === ch.channelId ? (
                                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin flex-shrink-0" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Channels grid */}
                {activeWatchlist.channels && activeWatchlist.channels.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeWatchlist.channels.map((channel) => (
                      <div
                        key={channel.id}
                        className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700 transition-all group"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <ChannelAvatar channel={channel} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-zinc-200 truncate">
                              {channel.display_name ?? channel.handle}
                            </p>
                            <p className="text-[11px] text-zinc-500">{channel.handle}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveChannel(channel.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-zinc-500" />
                            <span className="text-[11px] text-zinc-400">
                              {formatNumber(channel.subscriber_count ?? 0)} subs
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-zinc-500" />
                            <span className="text-[11px] text-zinc-400">
                              {channel.average_views > 0 ? formatNumber(channel.average_views) + ' avg views' : 'No data yet'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No creators yet</p>
                    <p className="text-[12px] mt-1">Click <span className="text-violet-400">Add Creator</span> to search and track channels</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-zinc-500">
                <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {watchlists.length === 0
                    ? 'Create a watchlist to start tracking creators'
                    : 'Select a watchlist to view creators'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
