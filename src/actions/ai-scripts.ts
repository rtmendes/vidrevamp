'use server';

import OpenAI from 'openai';
import type { ScriptBlueprint, VaultItem } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================
// PIPELINE A: Main Multi-Modal Blueprint Generator (RAG)
// Uses vault items as few-shot examples for proven styles
// ============================================================

export async function generateMultiModalBlueprint(
  subject: string,
  angle: string,
  vaultItems: VaultItem[]
): Promise<{ success: boolean; data?: ScriptBlueprint; error?: string }> {
  try {
    // Build RAG context from vault — hooks and styles as examples
    const vaultContext = vaultItems.length > 0
      ? vaultItems
          .map((item) => `[${item.type}] ${item.content}`)
          .join('\n')
      : 'No vault items provided — use general best practices for viral short-form content.';

    const systemPrompt = `You are an expert content strategist for short-form video (TikTok, Instagram Reels, YouTube Shorts).

Review the following proven viral frameworks from the user's Vault:
---
${vaultContext}
---

Your task: Ignore any URLs in the user's input. Based strictly on the Subject and Angle provided, write a complete 60-second content blueprint.

This blueprint MUST be returned as valid JSON with the following structure:
{
  "hook": "The opening line (first 3 seconds) — the pattern interrupt",
  "estimatedDuration": "~60 seconds",
  "script": "The full spoken script with natural pacing breaks indicated by [PAUSE] or [CUT]",
  "editInstructions": [
    {
      "timestamp": "0:00-0:03",
      "scriptLine": "The exact spoken line for this segment",
      "visualInstruction": "Detailed direction for what to show on screen",
      "cutType": "Hard cut / J-cut / L-cut / Smash cut / Match cut",
      "broll": "Description of B-roll footage to overlay",
      "textOverlay": "Any text/caption to display on screen"
    }
  ]
}

Rules:
1. Match the pacing of highly-edited TikToks and Reels (fast, punchy, no dead air).
2. Each script segment should be 3-8 seconds of content.
3. Visual instructions must be specific — camera angle, motion, subject.
4. Return ONLY valid JSON — no markdown, no explanation outside the JSON.`;

    const userMessage = `Subject: ${subject}\nAngle: ${angle}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI');

    const blueprint = JSON.parse(raw) as ScriptBlueprint;
    return { success: true, data: blueprint };
  } catch (error) {
    console.error('[AI] generateMultiModalBlueprint error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate blueprint',
    };
  }
}

// ============================================================
// PIPELINE B: The Fixer
// Iteratively edits a script blueprint based on user instructions
// ============================================================

export async function fixScript(
  currentBlueprint: ScriptBlueprint,
  userInstructions: string
): Promise<{ success: boolean; data?: ScriptBlueprint; error?: string }> {
  try {
    const systemPrompt = `You are an expert content editor specializing in short-form video scripts.

Apply the user's change request to the current content blueprint. Rules:
1. Maintain the JSON structure exactly — same fields, same format.
2. Ensure the revised script and visual instructions remain highly cohesive and retention-focused.
3. Do not make changes beyond what the user explicitly requested.
4. Return ONLY valid JSON matching the original blueprint structure.`;

    const userMessage = `Change request: ${userInstructions}

Current blueprint:
${JSON.stringify(currentBlueprint, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI');

    const updatedBlueprint = JSON.parse(raw) as ScriptBlueprint;
    return { success: true, data: updatedBlueprint };
  } catch (error) {
    console.error('[AI] fixScript error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fix script',
    };
  }
}

// ============================================================
// PIPELINE C: The Translator
// Translates a blueprint into a target language while
// preserving pacing and social-native tone
// ============================================================

export async function translateBlueprint(
  blueprint: ScriptBlueprint,
  targetLanguage: string
): Promise<{ success: boolean; data?: ScriptBlueprint; error?: string }> {
  try {
    const systemPrompt = `You are a professional translator specializing in social media content.

Translate the following content blueprint into ${targetLanguage}.

Critical rules:
1. Preserve the fast-paced, social-media-native tone — do NOT make it sound formal or literary.
2. Adapt internet slang and idioms to culturally appropriate equivalents in ${targetLanguage}.
3. Keep technical edit instructions (cutType, visual directions) precise and clear.
4. Maintain the exact JSON structure — translate only the text content fields.
5. Return ONLY valid JSON matching the original structure.`;

    const userMessage = `Translate this blueprint to ${targetLanguage}:\n${JSON.stringify(blueprint, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4, // Lower temp for translations — more deterministic
      max_tokens: 2500,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI');

    const translatedBlueprint = JSON.parse(raw) as ScriptBlueprint;
    return { success: true, data: translatedBlueprint };
  } catch (error) {
    console.error('[AI] translateBlueprint error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to translate blueprint',
    };
  }
}

// ============================================================
// PIPELINE D: GPT-4o Vision Analysis
// Analyzes video screenshots to extract visual editing tactics
// ============================================================

export async function analyzeVideoVisuals(
  screenshotUrls: string[],
  videoTitle: string
): Promise<{
  success: boolean;
  data?: {
    visual_hook: string;
    pacing_cuts_per_sec: number;
    broll_usage: string;
    text_overlay_style: string;
    camera_framing: string;
    color_grade: string;
    key_moments: { timestamp: string; description: string }[];
  };
  error?: string;
}> {
  try {
    const imageMessages = screenshotUrls.slice(0, 10).map((url) => ({
      type: 'image_url' as const,
      image_url: { url, detail: 'low' as const },
    }));

    const systemPrompt = `You are an expert video content analyst specializing in short-form video editing techniques.

Analyze these screenshots from a viral video and extract the visual editing tactics. Return a JSON object with:
{
  "visual_hook": "Description of the opening visual hook and why it creates pattern interrupt",
  "pacing_cuts_per_sec": 2.5,
  "broll_usage": "How and what type of B-roll footage is used",
  "text_overlay_style": "Font style, placement, animation style of text overlays",
  "camera_framing": "Camera angles, distances, movement patterns used",
  "color_grade": "Color palette, filter style, overall visual tone",
  "key_moments": [
    {"timestamp": "0:00", "description": "What makes this moment visually compelling"}
  ]
}

Be specific and actionable — a creator should be able to replicate these tactics.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze the visual editing tactics in this video: "${videoTitle}"`,
            },
            ...imageMessages,
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI Vision');

    const analysis = JSON.parse(raw);
    return { success: true, data: analysis };
  } catch (error) {
    console.error('[AI] analyzeVideoVisuals error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze visuals',
    };
  }
}
