'use server';

import OpenAI from 'openai';
import { logUsageEvent } from './log-usage';
import { estimateModelCost, DEFAULT_MODEL_ID } from '@/lib/ai-models';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MessagingPillar {
  name: string;
  description: string;
  hookFormulas: string[];
  avoidPhrases: string[];
}

export interface ToneAttribute {
  trait: string;
  description: string;
  doExample: string;
  dontExample: string;
}

export interface VisualIdentity {
  colorMood: string;
  lightingStyle: string;
  editingPace: string;
  onScreenText: string;
  brollStyle: string;
}

export interface ContentRule {
  rule: string;
  reason: string;
}

export interface BrandOS {
  brandName: string;
  tagline: string;
  brandPersonality: string;           // 2-3 sentence summary
  targetAudience: string;
  uniqueValueProp: string;
  messagingPillars: MessagingPillar[];
  toneAttributes: ToneAttribute[];
  visualIdentity: VisualIdentity;
  contentRules: ContentRule[];
  competitorDifferentiators: string[];
  signatureHookFormula: string;       // Brand's #1 hook template
  forbiddenTopics: string[];
  keyEmotions: string[];              // emotions brand wants to evoke
}

export interface BrandVoiceInput {
  brandName: string;
  niche: string;
  targetAudience: string;
  brandPersonalityWords: string;      // e.g. "bold, direct, inspiring"
  topCompetitors: string;
  uniqueAdvantage: string;
  contentPlatforms: string;           // e.g. "YouTube Shorts, TikTok, Instagram Reels"
  existingHook?: string;              // optional sample hook for style matching
}

export async function generateBrandOS(
  input: BrandVoiceInput,
  modelId: string = DEFAULT_MODEL_ID,
): Promise<{ success: boolean; data?: BrandOS; error?: string }> {
  const t0 = Date.now();
  try {
    const systemPrompt = `You are a world-class brand strategist who builds Brand OS frameworks for viral short-form content creators.

Given brand inputs, generate a complete, actionable Brand OS that the creator can use as their north star for every piece of content they make.

Return ONLY valid JSON:
{
  "brandName": "string",
  "tagline": "Catchy, memorable tagline under 10 words",
  "brandPersonality": "2-3 sentence brand personality description",
  "targetAudience": "Precise psychographic description",
  "uniqueValueProp": "One-sentence UVP",
  "messagingPillars": [
    {
      "name": "Pillar name",
      "description": "What this pillar stands for",
      "hookFormulas": ["Hook template 1 for this pillar", "Hook template 2"],
      "avoidPhrases": ["phrase to never use"]
    }
  ],
  "toneAttributes": [
    {
      "trait": "e.g. Direct",
      "description": "What this means for content",
      "doExample": "Concrete example of doing this right",
      "dontExample": "Concrete example of doing this wrong"
    }
  ],
  "visualIdentity": {
    "colorMood": "Color palette mood and hex suggestions",
    "lightingStyle": "Lighting direction for video",
    "editingPace": "Editing rhythm/pace description",
    "onScreenText": "Text overlay rules",
    "brollStyle": "B-roll visual direction"
  },
  "contentRules": [
    { "rule": "Action rule", "reason": "Why this matters for the brand" }
  ],
  "competitorDifferentiators": ["How this brand is different from each competitor"],
  "signatureHookFormula": "The brand's #1 hook template with [PLACEHOLDER] slots",
  "forbiddenTopics": ["Topics/angles this brand never touches"],
  "keyEmotions": ["Primary emotion 1", "Primary emotion 2", "Primary emotion 3"]
}

Rules:
- Create 3-4 messaging pillars, each with 2-3 hook formulas
- Create 4-5 tone attributes with concrete do/don't examples
- Create 5-8 content rules
- The signatureHookFormula should be a fill-in-the-blank template
- Be extremely specific — generic brand guidelines are useless`;

    const userMessage = `Brand: ${input.brandName}
Niche: ${input.niche}
Target Audience: ${input.targetAudience}
Brand Personality Words: ${input.brandPersonalityWords}
Top Competitors: ${input.topCompetitors}
Our Unique Advantage: ${input.uniqueAdvantage}
Content Platforms: ${input.contentPlatforms}
${input.existingHook ? `Sample Hook: "${input.existingHook}"` : ''}`;

    const completion = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.75,
      max_tokens: 3500,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from AI');

    const parsed = JSON.parse(raw) as BrandOS;
    const usage = completion.usage;

    await logUsageEvent({
      integration: 'openai',
      use_case: 'script_gen',
      model: modelId,
      input_tokens: usage?.prompt_tokens ?? 0,
      output_tokens: usage?.completion_tokens ?? 0,
      total_tokens: usage?.total_tokens ?? 0,
      cost_usd: estimateModelCost(modelId, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { niche: input.niche, brand: input.brandName },
    });

    return { success: true, data: parsed };
  } catch (error) {
    await logUsageEvent({
      integration: 'openai',
      use_case: 'script_gen',
      model: modelId,
      duration_ms: Date.now() - t0,
      status: 'error',
    });
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate Brand OS' };
  }
}
