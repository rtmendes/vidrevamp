'use server';

import OpenAI from 'openai';
import { logUsageEvent } from './log-usage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ResearchBriefParams {
  niche: string;
  organicNotes?: string;
  ytAdNotes?: string;
  fbAdNotes?: string;
  modelId?: string;
}

export async function generateResearchBrief(
  params: ResearchBriefParams,
): Promise<{ success: boolean; brief?: string; error?: string }> {
  const t0 = Date.now();
  const { niche, organicNotes, ytAdNotes, fbAdNotes } = params;

  const signals: string[] = [];
  if (organicNotes?.trim()) {
    signals.push(`## ORGANIC OUTLIERS (1of10 data)\n${organicNotes.trim()}`);
  }
  if (ytAdNotes?.trim()) {
    signals.push(`## YOUTUBE ADS (VidTao data)\n${ytAdNotes.trim()}`);
  }
  if (fbAdNotes?.trim()) {
    signals.push(`## FACEBOOK / INSTAGRAM ADS (Meta Ads Library)\n${fbAdNotes.trim()}`);
  }

  const signalBlock = signals.length > 0
    ? signals.join('\n\n')
    : 'No specific signal data provided — generate based on niche alone.';

  const prompt = `You are a YouTube content strategist. Create a production-ready content brief for:

NICHE: ${niche}

SIGNAL DATA:
${signalBlock}

Generate a structured content brief with these sections:

# CONTENT BRIEF: [Topic Title]

## Core Opportunity
[1-2 sentences on why this topic has high potential based on the signals]

## Dual-Signal Validation
[If both organic outlier AND paid ad data confirm the same angle, note this as "DUAL SIGNAL CONFIRMED — high confidence". Otherwise note which signals support the idea.]

## Recommended Video Angle
[The specific angle to take. Be opinionated.]

## Hook Options (3 variations)
1. [Hook 1 — curiosity gap]
2. [Hook 2 — bold claim]
3. [Hook 3 — relatable problem]

## Thumbnail Direction
[Visual concept, style, text overlay suggestion, emotional trigger]

## Key Talking Points
- [Point 1]
- [Point 2]
- [Point 3]
- [Point 4]
- [Point 5]

## CTA Strategy
[What to ask viewers to do and why]

## Competitive Moat
[What makes this execution different from what advertisers and top organic videos are doing]

## Risk Factors
[1-2 potential weaknesses or things to test]

Be specific, opinionated, and action-oriented. Use the signal data to justify your recommendations.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const brief = response.choices[0]?.message?.content ?? '';

    await logUsageEvent({
      integration: 'openai',
      use_case: 'research',
      model: 'gpt-4o-mini',
      input_tokens: response.usage?.prompt_tokens,
      output_tokens: response.usage?.completion_tokens,
      cost_usd:
        ((response.usage?.prompt_tokens ?? 0) / 1000) * 0.00015 +
        ((response.usage?.completion_tokens ?? 0) / 1000) * 0.0006,
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { niche, hasOrganic: !!organicNotes, hasYtAds: !!ytAdNotes, hasFbAds: !!fbAdNotes },
    });

    return { success: true, brief };
  } catch (err) {
    await logUsageEvent({
      integration: 'openai',
      use_case: 'research',
      model: 'gpt-4o-mini',
      duration_ms: Date.now() - t0,
      status: 'error',
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Brief generation failed',
    };
  }
}
