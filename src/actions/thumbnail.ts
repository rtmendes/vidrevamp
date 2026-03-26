'use server';

import OpenAI from 'openai';
import { logUsageEvent } from './log-usage';
import { getImageModel, DEFAULT_IMAGE_MODEL_ID } from '@/lib/image-models';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ThumbnailVariant {
  index: number;
  url: string | null;
  prompt: string;
  formulaName: string;
  error?: string;
}

export interface ThumbnailResult {
  success: boolean;
  variants?: ThumbnailVariant[];
  error?: string;
}

type ThumbnailStyle = 'Photo-real' | 'Illustrated' | 'Bold Text' | 'Minimalist' | 'High Contrast' | 'Cinematic';
type Platform = 'YouTube' | 'TikTok' | 'Instagram';

const FORMULAS = [
  { name: 'Face + Emotion', angle: 'extreme close-up of a person with a shocked/excited facial expression, looking directly at camera, highly expressive' },
  { name: 'Before / After', angle: 'dramatic split-screen transformation, left side dull and grey labelled BEFORE, right side vibrant and successful labelled AFTER' },
  { name: 'Bold Headline', angle: 'clean dark background with massive bold white text overlay, minimalist graphic design, strong typography' },
  { name: 'Curiosity Gap', angle: 'mysterious partially-revealed subject, one element blurred or cut off, creating visual tension and suspense' },
];

const STYLE_MODIFIERS: Record<ThumbnailStyle, string> = {
  'Photo-real':     'photorealistic DSLR photography, 85mm lens, shallow depth of field, studio lighting, highly detailed',
  'Illustrated':    'digital illustration, bold graphic design, flat vector art, clean lines, vibrant colors',
  'Bold Text':      'graphic design, large bold typography, high contrast text layout, poster style, strong visual hierarchy',
  'Minimalist':     'minimal clean design, lots of negative space, single focal point, elegant composition, muted palette',
  'High Contrast':  'extreme high contrast, deep blacks and bright highlights, punchy saturated neon colors, dramatic lighting',
  'Cinematic':      'cinematic widescreen composition, anamorphic lens flare, dramatic color grade, film still quality',
};

const ASPECT_MAP: Record<Platform, '9:16' | '16:9' | '1:1'> = {
  YouTube:   '16:9',
  TikTok:    '9:16',
  Instagram: '1:1',
};

function buildPrompt(
  title: string,
  hook: string,
  style: ThumbnailStyle,
  brandColor: string,
  includeFace: boolean,
  formulaIndex: number,
  inspirationNote?: string,
): string {
  const formula = FORMULAS[formulaIndex % FORMULAS.length];
  const styleModifier = STYLE_MODIFIERS[style];

  const faceInstruction = includeFace
    ? `${formula.angle},`
    : 'no people, object/concept focused composition,';

  const colorHint = `dominant accent color matching hex ${brandColor},`;

  const subject = hook.trim()
    ? `Visual concept: "${hook}".`
    : `Video topic: "${title}".`;

  const inspiration = inspirationNote ? `Style reference: ${inspirationNote}.` : '';

  return [
    `YouTube thumbnail image, ${formula.name} formula.`,
    subject,
    faceInstruction,
    `${styleModifier}.`,
    colorHint,
    inspiration,
    `Text overlay says: "${title.slice(0, 40)}".`,
    'Ultra sharp, high detail, professional thumbnail quality. No watermarks. No borders.',
  ].filter(Boolean).join(' ');
}

// ── Image generation routing ──────────────────────────────────────────────────

async function generateViaOpenAI(
  prompt: string,
  sizeStr: string,
  modelId: string,
): Promise<{ url?: string; error?: string }> {
  try {
    if (modelId === 'gpt-image-1') {
      // gpt-image-1 uses responses API
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: sizeStr as '1024x1024' | '1536x1024' | '1024x1536',
        n: 1,
      });
      const url = response.data?.[0]?.url;
      if (!url) throw new Error('No image URL returned');
      return { url };
    } else {
      // dall-e-3
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size: sizeStr as '1024x1024' | '1792x1024' | '1024x1792',
        quality: 'standard',
        n: 1,
      });
      const url = response.data?.[0]?.url;
      if (!url) throw new Error('No image URL returned');
      return { url };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'OpenAI image generation failed' };
  }
}

async function generateViaOpenRouter(
  prompt: string,
  sizeStr: string,
  modelId: string,
): Promise<{ url?: string; error?: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { error: 'OPENROUTER_API_KEY not configured. Add it in Settings.' };

  try {
    const res = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vidrevamp.app',
        'X-Title': 'VidRevamp Thumbnail Generator',
      },
      body: JSON.stringify({
        model: modelId,
        prompt,
        n: 1,
        size: sizeStr,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { error: (err as { error?: { message?: string } }).error?.message ?? `OpenRouter error ${res.status}` };
    }

    const data = await res.json() as { data?: { url?: string }[] };
    const url = data.data?.[0]?.url;
    if (!url) throw new Error('No image URL in response');
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'OpenRouter image generation failed' };
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateThumbnails(params: {
  title: string;
  hook: string;
  style: ThumbnailStyle;
  brandColor: string;
  includeFace: boolean;
  platform: Platform;
  count: number;
  imageModelId?: string;
  inspirationNote?: string;
}): Promise<ThumbnailResult> {
  const t0 = Date.now();
  const {
    title, hook, style, brandColor, includeFace, platform, count,
    imageModelId = DEFAULT_IMAGE_MODEL_ID,
    inspirationNote,
  } = params;

  if (!title.trim()) return { success: false, error: 'Title is required' };

  const imageModel = getImageModel(imageModelId);
  const aspect = ASPECT_MAP[platform];
  const sizeStr = imageModel.sizes[aspect];
  const clampedCount = Math.min(Math.max(count, 1), 4);

  try {
    const jobs = Array.from({ length: clampedCount }, async (_, i) => {
      const prompt = buildPrompt(title, hook, style, brandColor, includeFace, i, inspirationNote);

      const result = imageModel.via === 'openai'
        ? await generateViaOpenAI(prompt, sizeStr, imageModelId)
        : await generateViaOpenRouter(prompt, sizeStr, imageModelId);

      return {
        index: i,
        url: result.url ?? null,
        prompt,
        formulaName: FORMULAS[i % FORMULAS.length].name,
        error: result.error,
      };
    });

    const variants = await Promise.all(jobs);

    await logUsageEvent({
      integration: 'openai',
      use_case: 'image_gen',
      model: imageModelId,
      cost_usd: clampedCount * imageModel.cost_per_image,
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { platform, style, count: clampedCount, model: imageModelId },
    });

    return { success: true, variants };
  } catch (error) {
    await logUsageEvent({
      integration: 'openai',
      use_case: 'image_gen',
      model: imageModelId,
      duration_ms: Date.now() - t0,
      status: 'error',
    });
    return { success: false, error: error instanceof Error ? error.message : 'Generation failed' };
  }
}

// ── CTR Score analysis ────────────────────────────────────────────────────────

export interface CTRScore {
  overall: number;
  virality: number;
  clarity: number;
  curiosity: number;
  emotion: number;
  design: number;
  tips: string[];
}

export async function analyzeThumbnailCTR(params: {
  title: string;
  formulaName: string;
  style: ThumbnailStyle;
  includeFace: boolean;
  platform: Platform;
}): Promise<{ success: boolean; score?: CTRScore; error?: string }> {
  try {
    const { title, formulaName, style, includeFace, platform } = params;

    const prompt = `You are a YouTube CTR optimization expert. Analyze this thumbnail concept and score it.

Title: "${title}"
Visual formula: ${formulaName}
Style: ${style}
Has face: ${includeFace}
Platform: ${platform}

Return ONLY valid JSON (no markdown) with this structure:
{
  "overall": <0-100>,
  "virality": <0-100>,
  "clarity": <0-100>,
  "curiosity": <0-100>,
  "emotion": <0-100>,
  "design": <0-100>,
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Be realistic and specific. Score based on YouTube CTR research and best practices.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const json = raw.replace(/```json\n?|\n?```/g, '').trim();
    const score = JSON.parse(json) as CTRScore;
    return { success: true, score };
  } catch {
    return { success: false, error: 'Score analysis failed' };
  }
}
