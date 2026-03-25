'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { VideoInsight } from '@/types';

// ============================================================
// Video Insights — Supabase server actions
// Videos are scoped by which channels the user tracks
// ============================================================

export async function getVideoInsights(): Promise<VideoInsight[]> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get channel IDs from user's watchlists
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

  const { data, error } = await supabase
    .from('video_insights')
    .select('*, channel:tracked_channels(*)')
    .in('channel_id', channelIds)
    .order('outlier_score', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[videos] getVideoInsights:', error.message);
    return [];
  }

  return (data ?? []) as VideoInsight[];
}

export async function saveVideoInsight(video: {
  channel_id: string;
  url: string;
  title?: string;
  thumbnail_url?: string;
  views: number;
  likes?: number;
  comments?: number;
  duration_seconds?: number;
  outlier_score: number;
  published_at?: string;
  language?: string;
  country?: string;
  tags?: string[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('video_insights')
    .upsert(
      {
        channel_id: video.channel_id,
        url: video.url,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        views: video.views,
        likes: video.likes ?? 0,
        comments: video.comments ?? 0,
        duration_seconds: video.duration_seconds ?? 0,
        outlier_score: video.outlier_score,
        published_at: video.published_at,
        analyzed_at: new Date().toISOString(),
      },
      { onConflict: 'url' }
    )
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}
