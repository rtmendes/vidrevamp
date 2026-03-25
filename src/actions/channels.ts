'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Watchlist, TrackedChannel, PlatformType } from '@/types';

// ============================================================
// Channels & Watchlists — Supabase server actions
// Security: watchlists are RLS-scoped to auth.uid()
//           tracked_channels is shared (no RLS) — access via watchlists
// ============================================================

export async function getWatchlists(): Promise<Watchlist[]> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: wlRows, error } = await supabase
    .from('watchlists')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at');

  if (error || !wlRows?.length) return [];

  // Fetch channels for each watchlist
  const watchlists = await Promise.all(
    wlRows.map(async (wl) => {
      const { data: joinRows } = await supabase
        .from('watchlist_channels')
        .select('channel_id')
        .eq('watchlist_id', wl.id);

      const channelIds = joinRows?.map((r) => r.channel_id) ?? [];

      let channels: TrackedChannel[] = [];
      if (channelIds.length > 0) {
        const { data: chData } = await supabase
          .from('tracked_channels')
          .select('*')
          .in('id', channelIds);
        channels = (chData ?? []) as TrackedChannel[];
      }

      return {
        id: wl.id,
        user_id: user.id,
        name: wl.name,
        created_at: wl.created_at,
        channels,
      } as Watchlist;
    })
  );

  return watchlists;
}

export async function createWatchlist(
  name: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('watchlists')
    .insert({ user_id: user.id, name: name.trim() })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}

export async function addChannelToWatchlist(
  watchlistId: string,
  channel: {
    platform: PlatformType;
    handle: string;
    display_name?: string;
    avatar_url?: string;
    subscriber_count?: number;
    average_views?: number;
  }
): Promise<{ success: boolean; channelId?: string; error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const handle = channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`;

  // Upsert channel by platform+handle (shared table)
  const { data: chData, error: chErr } = await supabase
    .from('tracked_channels')
    .upsert(
      {
        platform: channel.platform,
        handle,
        display_name: channel.display_name ?? handle,
        avatar_url: channel.avatar_url ?? null,
        subscriber_count: channel.subscriber_count ?? 0,
        average_views: channel.average_views ?? 0,
      },
      { onConflict: 'platform,handle' }
    )
    .select('id')
    .single();

  if (chErr || !chData) {
    return { success: false, error: chErr?.message ?? 'Failed to save channel' };
  }

  // Add to watchlist join (ignore duplicate)
  const { error: joinErr } = await supabase
    .from('watchlist_channels')
    .upsert(
      { watchlist_id: watchlistId, channel_id: chData.id },
      { onConflict: 'watchlist_id,channel_id' }
    );

  if (joinErr) return { success: false, error: joinErr.message };
  return { success: true, channelId: chData.id };
}

export async function removeChannelFromWatchlist(
  watchlistId: string,
  channelId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('watchlist_channels')
    .delete()
    .eq('watchlist_id', watchlistId)
    .eq('channel_id', channelId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getTrackedChannels(): Promise<TrackedChannel[]> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: wlData } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', user.id);

  const watchlistIds = wlData?.map((w) => w.id) ?? [];
  if (!watchlistIds.length) return [];

  const { data: joinData } = await supabase
    .from('watchlist_channels')
    .select('channel_id')
    .in('watchlist_id', watchlistIds);

  const channelIds = Array.from(new Set(joinData?.map((r) => r.channel_id) ?? []));
  if (!channelIds.length) return [];

  const { data } = await supabase
    .from('tracked_channels')
    .select('*')
    .in('id', channelIds)
    .order('created_at', { ascending: false });

  return (data ?? []) as TrackedChannel[];
}

// Ensures a default watchlist exists, returns its ID
export async function getOrCreateDefaultWatchlist(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from('watchlists')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (existing?.id) return existing.id;

  const result = await createWatchlist('My Channels');
  return result.id ?? null;
}
