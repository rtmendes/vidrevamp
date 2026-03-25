'use server';

/**
 * YouTube Data API v3 — VidRevamp Research
 * Docs: https://developers.google.com/youtube/v3/docs
 * Free quota: 10,000 units/day
 *
 * Unit costs:
 *   search.list        = 100 units
 *   channels.list      = 1 unit
 *   videos.list        = 1 unit
 *   playlistItems.list = 1 unit
 */

const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = () => process.env.YOUTUBE_API_KEY!;

async function ytFetch(endpoint: string, params: Record<string, string | number>) {
  const qs = new URLSearchParams({
    key: API_KEY(),
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  const res = await fetch(`${YT_BASE}/${endpoint}?${qs}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`YouTube API ${res.status}: ${err?.error?.message ?? 'unknown'}`);
  }
  return res.json();
}

// ── Search channels by keyword ──────────────────────────────────────────────

export async function searchYouTubeChannels(query: string, maxResults = 10): Promise<{
  success: boolean;
  data?: { channelId: string; title: string; description: string; thumbnail: string; subscriberCount?: number }[];
  error?: string;
}> {
  try {
    const searchData = await ytFetch('search', {
      part: 'snippet',
      type: 'channel',
      q: query,
      maxResults,
    });

    const channelIds = searchData.items?.map((i: { id: { channelId: string } }) => i.id.channelId).join(',');
    if (!channelIds) return { success: true, data: [] };

    // Get stats for each channel (1 unit)
    const statsData = await ytFetch('channels', {
      part: 'statistics,snippet',
      id: channelIds,
    });

    const channels = statsData.items?.map((ch: {
      id: string;
      snippet: { title: string; description: string; thumbnails: { default: { url: string } } };
      statistics: { subscriberCount?: string };
    }) => ({
      channelId: ch.id,
      title: ch.snippet.title,
      description: ch.snippet.description,
      thumbnail: ch.snippet.thumbnails?.default?.url ?? '',
      subscriberCount: ch.statistics?.subscriberCount ? parseInt(ch.statistics.subscriberCount, 10) : undefined,
    }));

    return { success: true, data: channels ?? [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to search channels' };
  }
}

// ── Get recent videos for a channel with outlier scoring ───────────────────

export interface YouTubeVideoResult {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;    // ISO 8601
  channelId: string;
  channelTitle: string;
  outlierScore: number; // views / channel avg
}

export async function getChannelVideosWithOutlierScore(
  channelId: string,
  maxResults = 20
): Promise<{ success: boolean; data?: YouTubeVideoResult[]; channelAvgViews?: number; error?: string }> {
  try {
    // Get uploads playlist ID (1 unit)
    const channelData = await ytFetch('channels', {
      part: 'contentDetails,statistics,snippet',
      id: channelId,
    });

    const channel = channelData.items?.[0];
    if (!channel) return { success: false, error: 'Channel not found' };

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    // Get recent uploads (1 unit)
    const playlistData = await ytFetch('playlistItems', {
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults,
    });

    const videoIds = playlistData.items
      ?.map((i: { snippet: { resourceId: { videoId: string } } }) => i.snippet?.resourceId?.videoId)
      .filter(Boolean)
      .join(',');

    if (!videoIds) return { success: true, data: [] };

    // Get full stats for each video (1 unit)
    const videosData = await ytFetch('videos', {
      part: 'statistics,snippet,contentDetails',
      id: videoIds,
    });

    const videos: YouTubeVideoResult[] = videosData.items?.map((v: {
      id: string;
      snippet: {
        title: string;
        thumbnails: { maxres?: { url: string }; high?: { url: string } };
        publishedAt: string;
        channelId: string;
        channelTitle: string;
      };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
    }) => ({
      videoId: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails?.maxres?.url ?? v.snippet.thumbnails?.high?.url ?? '',
      publishedAt: v.snippet.publishedAt,
      viewCount: parseInt(v.statistics?.viewCount ?? '0'),
      likeCount: parseInt(v.statistics?.likeCount ?? '0'),
      commentCount: parseInt(v.statistics?.commentCount ?? '0'),
      duration: v.contentDetails?.duration ?? 'PT0S',
      channelId: v.snippet.channelId,
      channelTitle: v.snippet.channelTitle,
      outlierScore: 0, // calculated below
    })) ?? [];

    // Calculate outlier score = video views / channel average views
    const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
    const avgViews = videos.length > 0 ? totalViews / videos.length : 1;

    const scored = videos.map((v) => ({
      ...v,
      outlierScore: avgViews > 0 ? v.viewCount / avgViews : 0,
    }));

    return { success: true, data: scored, channelAvgViews: avgViews };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch videos' };
  }
}

// ── Search videos by keyword (for ad intel / research) ──────────────────────

export async function searchYouTubeVideos(
  query: string,
  maxResults = 25,
  order: 'viewCount' | 'date' | 'relevance' = 'viewCount'
): Promise<{ success: boolean; data?: YouTubeVideoResult[]; error?: string }> {
  try {
    const searchData = await ytFetch('search', {
      part: 'snippet',
      type: 'video',
      q: query,
      maxResults,
      order,
    });

    const videoIds = searchData.items?.map((i: { id: { videoId: string } }) => i.id.videoId).join(',');
    if (!videoIds) return { success: true, data: [] };

    const videosData = await ytFetch('videos', {
      part: 'statistics,snippet,contentDetails',
      id: videoIds,
    });

    const videos: YouTubeVideoResult[] = videosData.items?.map((v: {
      id: string;
      snippet: {
        title: string;
        thumbnails: { maxres?: { url: string }; high?: { url: string } };
        publishedAt: string;
        channelId: string;
        channelTitle: string;
      };
      statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      contentDetails: { duration: string };
    }) => ({
      videoId: v.id,
      title: v.snippet.title,
      thumbnail: v.snippet.thumbnails?.maxres?.url ?? v.snippet.thumbnails?.high?.url ?? '',
      publishedAt: v.snippet.publishedAt,
      viewCount: parseInt(v.statistics?.viewCount ?? '0'),
      likeCount: parseInt(v.statistics?.likeCount ?? '0'),
      commentCount: parseInt(v.statistics?.commentCount ?? '0'),
      duration: v.contentDetails?.duration ?? 'PT0S',
      channelId: v.snippet.channelId,
      channelTitle: v.snippet.channelTitle,
      outlierScore: 0,
    })) ?? [];

    return { success: true, data: videos };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to search videos' };
  }
}
