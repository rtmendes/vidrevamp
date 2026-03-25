'use server';

import OpenAI from 'openai';
import { logUsageEvent } from './log-usage';
import { estimateModelCost, DEFAULT_MODEL_ID } from '@/lib/ai-models';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface StoryboardFrame {
  id: string;
  timestamp: string;
  duration: number;       // seconds
  scriptLine: string;
  shotType: string;       // 'ECU' | 'CU' | 'MCU' | 'MS' | 'WS' | 'OTS' | 'POV'
  cameraMotion: string;   // 'Static' | 'Handheld' | 'Push in' | 'Pull out' | 'Pan' | 'Tilt'
  broll: string;
  textOverlay: string;
  imagePrompt: string;    // DALL-E / Midjourney prompt
  cutType: string;
  mood: string;
  colorPalette: string;
  voNotes: string;        // voiceover/pacing notes
}

export interface Storyboard {
  title: string;
  totalDuration: string;
  aspect: '9:16' | '16:9' | '1:1';
  colorGrade: string;
  musicMood: string;
  frames: StoryboardFrame[];
  productionNotes: string;
}

export async function generateStoryboard(
  script: string,
  hook: string,
  niche: string,
  aspect: '9:16' | '16:9' | '1:1' = '9:16',
  modelId: string = DEFAULT_MODEL_ID
): Promise<{ success: boolean; data?: Storyboard; error?: string }> {
  const t0 = Date.now();
  try {
    const systemPrompt = `You are a world-class video director specializing in viral short-form content. You think visually — every word maps to a shot.

Create a frame-by-frame storyboard from the script. Each frame = one distinct shot/cut.

Return JSON ONLY:
{
  "title": "Video title from hook",
  "totalDuration": "~60 seconds",
  "aspect": "${aspect}",
  "colorGrade": "Overall color tone (e.g. Warm cinematic, Cold desaturated, Bright and punchy)",
  "musicMood": "Music style description",
  "frames": [
    {
      "id": "f1",
      "timestamp": "0:00-0:03",
      "duration": 3,
      "scriptLine": "Exact spoken words in this frame",
      "shotType": "ECU (face) | CU | MCU | MS | WS | OTS | POV | Insert",
      "cameraMotion": "Static | Handheld shake | Push in | Pull out | Pan left | Pan right | Tilt up | Tilt down | Orbit",
      "broll": "Specific B-roll to cut to or overlay — be visual and specific",
      "textOverlay": "Text to show on screen (or empty string)",
      "imagePrompt": "Midjourney/DALL-E prompt for this frame's visual — lighting, angle, subject, mood. Ultra specific.",
      "cutType": "Hard cut | J-cut | L-cut | Smash cut | Match cut | Jump cut",
      "mood": "Emotional tone of this frame",
      "colorPalette": "Dominant colors in this frame",
      "voNotes": "Pacing/delivery note for the speaker"
    }
  ],
  "productionNotes": "Key production notes for the editor"
}

Rules:
- First frame ALWAYS opens with the hook — make it visually explosive
- Create one frame per 3-8 seconds of content
- Image prompts must be extremely specific — lens, lighting, subject position, color
- For ${aspect} aspect ratio: frame everything accordingly
- Think like a TikTok/Reels director — fast cuts, dynamic angles, no dead air
- Return ONLY valid JSON`;

    const completion = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Hook: "${hook}"\nNiche: ${niche}\nAspect: ${aspect}\n\nFull Script:\n${script}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from AI');

    const parsed = JSON.parse(raw) as Storyboard;
    const usage = completion.usage;
    await logUsageEvent({
      integration: 'openai',
      use_case: 'storyboard',
      model: modelId,
      input_tokens: usage?.prompt_tokens ?? 0,
      output_tokens: usage?.completion_tokens ?? 0,
      total_tokens: usage?.total_tokens ?? 0,
      cost_usd: estimateModelCost(modelId, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { niche, aspect, frame_count: parsed.frames?.length },
    });

    return { success: true, data: parsed };
  } catch (error) {
    await logUsageEvent({ integration: 'openai', use_case: 'storyboard', model: modelId, duration_ms: Date.now() - t0, status: 'error' });
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate storyboard' };
  }
}

export async function generateFrameImage(
  imagePrompt: string,
  aspect: '9:16' | '16:9' | '1:1' = '9:16'
): Promise<{ success: boolean; url?: string; error?: string }> {
  const t0 = Date.now();
  try {
    const size = aspect === '9:16' ? '1024x1792' : aspect === '16:9' ? '1792x1024' : '1024x1024';
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: `${imagePrompt}. Cinematic quality, high detail, no text overlays.`,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: 'standard',
      n: 1,
    });
    const url = response.data?.[0]?.url;
    if (!url) throw new Error('No image URL returned');
    await logUsageEvent({ integration: 'openai', use_case: 'image_gen', model: 'dall-e-3', duration_ms: Date.now() - t0, status: 'success', cost_usd: 0.04 });
    return { success: true, url };
  } catch (error) {
    await logUsageEvent({ integration: 'openai', use_case: 'image_gen', model: 'dall-e-3', duration_ms: Date.now() - t0, status: 'error' });
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate image' };
  }
}
