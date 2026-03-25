'use server';

import { generateFrameImage } from './storyboard';
import { logUsageEvent } from './log-usage';

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
  { name: 'Face + Emotion', angle: 'extreme close-up of a person with a shocked/excited facial expression, looking directly at camera' },
  { name: 'Before / After', angle: 'dramatic split-screen transformation, left side dull and grey, right side vibrant and successful' },
  { name: 'Bold Headline', angle: 'clean dark background with massive bold white text overlay, minimalist graphic design' },
  { name: 'Curiosity Gap', angle: 'mysterious partially-revealed subject, one element blurred or cut off, creating visual tension' },
];

const STYLE_MODIFIERS: Record<ThumbnailStyle, string> = {
  'Photo-real':     'photorealistic DSLR photography, 85mm lens, shallow depth of field, studio lighting',
  'Illustrated':    'digital illustration, bold graphic design, flat vector art, clean lines',
  'Bold Text':      'graphic design, large bold typography, high contrast text layout, poster style',
  'Minimalist':     'minimal clean design, lots of white/dark space, single focal point, elegant composition',
  'High Contrast':  'extreme high contrast, deep blacks and bright highlights, punchy saturated colors',
  'Cinematic':      'cinematic widescreen look, anamorphic lens flare, dramatic color grade, film still',
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

  return [
    `YouTube thumbnail, ${formula.name} formula.`,
    subject,
    faceInstruction,
    `${styleModifier}.`,
    colorHint,
    `Text overlay area: bold readable text saying "${title.slice(0, 40)}".`,
    'Ultra sharp, high detail, professional thumbnail quality. No watermarks.',
  ].join(' ');
}

export async function generateThumbnails(params: {
  title: string;
  hook: string;
  style: ThumbnailStyle;
  brandColor: string;
  includeFace: boolean;
  platform: Platform;
  count: number;
}): Promise<ThumbnailResult> {
  const t0 = Date.now();
  const { title, hook, style, brandColor, includeFace, platform, count } = params;

  if (!title.trim()) return { success: false, error: 'Title is required' };

  const aspect = ASPECT_MAP[platform];
  const clampedCount = Math.min(Math.max(count, 1), 4);

  try {
    const jobs = Array.from({ length: clampedCount }, (_, i) => {
      const prompt = buildPrompt(title, hook, style, brandColor, includeFace, i);
      return generateFrameImage(prompt, aspect).then((res) => ({
        index: i,
        url: res.url ?? null,
        prompt,
        formulaName: FORMULAS[i % FORMULAS.length].name,
        error: res.success ? undefined : res.error,
      }));
    });

    const variants = await Promise.all(jobs);

    await logUsageEvent({
      integration: 'openai',
      use_case: 'image_gen',
      model: 'dall-e-3',
      cost_usd: clampedCount * 0.04,
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { platform, style, count: clampedCount },
    });

    return { success: true, variants };
  } catch (error) {
    await logUsageEvent({
      integration: 'openai',
      use_case: 'image_gen',
      model: 'dall-e-3',
      duration_ms: Date.now() - t0,
      status: 'error',
    });
    return { success: false, error: error instanceof Error ? error.message : 'Generation failed' };
  }
}
