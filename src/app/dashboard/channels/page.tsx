'use client';

import { useState } from 'react';
import {
  Plus,
  Users,
  Eye,
  Play,
  Trash2,
} from 'lucide-react';
import { MOCK_WATCHLISTS } from '@/lib/mock-data';
import { formatNumber } from '@/lib/utils';
import type { PlatformType, Watchlist } from '@/types';

function PlatformIcon({ platform }: { platform: PlatformType }) {
  if (platform === 'YOUTUBE') return <span className="text-red-500 font-black text-[10px]">YT</span>;
  if (platform === 'TIKTOK') return <span className="text-zinc-100 font-black text-[10px]">TK</span>;
  return <span className="text-pink-400 font-black text-[10px]">IG</span>;
}

export default function ChannelsPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(MOCK_WATCHLISTS);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string>(MOCK_WATCHLISTS[0]?.id ?? '');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddWatchlist, setShowAddWatchlist] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newChannelHandle, setNewChannelHandle] = useState('');
  const [newChannelPlatform, setNewChannelPlatform] = useState<PlatformType>('YOUTUBE');

  const activeWatchlist = watchlists.find((w) => w.id === selectedWatchlist);

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
          onClick={() => setShowAddWatchlist(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Watchlist
        </button>
      </div>

      <div className="flex gap-5">
        {/* Watchlist sidebar */}
        <div className="w-56 shrink-0 space-y-2">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-3">
            Your Watchlists
          </p>

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
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    if (!newWatchlistName.trim()) return;
                    setWatchlists((prev) => [...prev, {
                      id: `wl-${Date.now()}`,
                      user_id: 'user-1',
                      name: newWatchlistName.trim(),
                      created_at: new Date().toISOString(),
                      channels: [],
                    }]);
                    setNewWatchlistName('');
                    setShowAddWatchlist(false);
                  }}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-[12px] py-1.5 rounded-md transition-colors font-medium"
                >
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
                  onClick={() => setShowAddChannel(true)}
                  className="flex items-center gap-1.5 text-[12px] text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Creator
                </button>
              </div>

              {/* Add channel form */}
              {showAddChannel && (
                <div className="mb-4 p-4 bg-zinc-800/40 border border-zinc-700/40 rounded-xl space-y-3">
                  <p className="text-sm font-medium text-zinc-300">Add a Creator</p>
                  <div className="flex gap-2">
                    <select
                      value={newChannelPlatform}
                      onChange={(e) => setNewChannelPlatform(e.target.value as PlatformType)}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/60"
                    >
                      <option value="YOUTUBE">YouTube</option>
                      <option value="TIKTOK">TikTok</option>
                      <option value="INSTAGRAM">Instagram</option>
                    </select>
                    <input
                      type="text"
                      placeholder="@handle or channel URL"
                      value={newChannelHandle}
                      onChange={(e) => setNewChannelHandle(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddChannel(false)}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Add Creator
                    </button>
                    <button
                      onClick={() => setShowAddChannel(false)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
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
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={channel.avatar_url || ''}
                            alt={channel.display_name || ''}
                            className="w-10 h-10 rounded-full bg-zinc-800"
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                            channel.platform === 'YOUTUBE' ? 'bg-red-600' :
                            channel.platform === 'TIKTOK' ? 'bg-zinc-100' :
                            'bg-gradient-to-r from-purple-600 to-pink-600'
                          }`}>
                            <PlatformIcon platform={channel.platform} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-200 truncate">
                            {channel.display_name}
                          </p>
                          <p className="text-[11px] text-zinc-500">{channel.handle}</p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10">
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
                            {formatNumber(channel.average_views)} avg views
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
                  <p className="text-[12px] mt-1">Add creators to start tracking their content</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-zinc-500">
              <Play className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a watchlist to view creators</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
