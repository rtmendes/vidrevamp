'use server';

/**
 * HeyGen API — VidRevamp UGC Studio
 * Docs: https://docs.heygen.com/reference/
 */

const HEYGEN_BASE = 'https://api.heygen.com';

async function heygenFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...options,
    headers: {
      'X-Api-Key': process.env.HEYGEN_API_KEY!,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HeyGen ${res.status}: ${err}`);
  }
  return res.json();
}

// ── List available avatars ──────────────────────────────────────────────────

export async function listHeyGenAvatars(): Promise<{
  success: boolean;
  data?: { avatar_id: string; avatar_name: string; preview_image_url: string; preview_video_url?: string }[];
  error?: string;
}> {
  try {
    const data = await heygenFetch('/v2/avatars');
    return { success: true, data: data.data?.avatars ?? [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to list avatars' };
  }
}

// ── List available voices ───────────────────────────────────────────────────

export async function listHeyGenVoices(): Promise<{
  success: boolean;
  data?: { voice_id: string; language: string; gender: string; name: string; preview_audio?: string }[];
  error?: string;
}> {
  try {
    const data = await heygenFetch('/v2/voices');
    return { success: true, data: data.data?.voices ?? [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to list voices' };
  }
}

// ── Generate avatar video ───────────────────────────────────────────────────

export interface GenerateAvatarVideoPayload {
  avatar_id: string;
  voice_id: string;
  script: string;           // spoken text (max ~2500 chars)
  background_color?: string; // e.g. '#ffffff'
  width?: number;
  height?: number;
  title?: string;
}

export async function generateAvatarVideo(payload: GenerateAvatarVideoPayload): Promise<{
  success: boolean;
  data?: { video_id: string; status: string };
  error?: string;
}> {
  try {
    const body = {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: payload.avatar_id,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: payload.script,
            voice_id: payload.voice_id,
          },
          background: payload.background_color
            ? { type: 'color', value: payload.background_color }
            : { type: 'color', value: '#1a1a2e' },
        },
      ],
      dimension: {
        width: payload.width ?? 1080,
        height: payload.height ?? 1920, // portrait for Reels/TikTok
      },
      title: payload.title ?? 'VidRevamp UGC',
    };

    const data = await heygenFetch('/v2/video/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return { success: true, data: { video_id: data.data?.video_id, status: 'processing' } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate video' };
  }
}

// ── Poll video status ───────────────────────────────────────────────────────

export async function getVideoStatus(videoId: string): Promise<{
  success: boolean;
  data?: { status: 'processing' | 'completed' | 'failed'; video_url?: string; thumbnail_url?: string };
  error?: string;
}> {
  try {
    const data = await heygenFetch(`/v1/video_status.get?video_id=${videoId}`);
    return {
      success: true,
      data: {
        status: data.data?.status ?? 'processing',
        video_url: data.data?.video_url,
        thumbnail_url: data.data?.thumbnail_url,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get video status' };
  }
}

// ── Get remaining credits ───────────────────────────────────────────────────

export async function getHeyGenCredits(): Promise<{
  success: boolean;
  data?: { remaining: number; total: number };
  error?: string;
}> {
  try {
    const data = await heygenFetch('/v2/user/remaining_quota');
    return {
      success: true,
      data: {
        remaining: data.data?.remaining_quota ?? 0,
        total: data.data?.total_quota ?? 0,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get credits' };
  }
}
