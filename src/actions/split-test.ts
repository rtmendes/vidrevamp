'use server';

import OpenAI from 'openai';
import { logUsageEvent } from './log-usage';
import { estimateModelCost, DEFAULT_MODEL_ID } from '@/lib/ai-models';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface HookVariant {
  id: string;
  hook: string;
  angle: string;
  formula: string;
  predictedCtr: number;   // 0–100 AI prediction
  emotionTrigger: string;
  patternInterrupt: string;
  wordCount: number;
}

export interface SplitTestResult {
  topic: string;
  niche: string;
  variants: HookVariant[];
  winner: string;           // variant id with highest predicted CTR
  analysis: string;
  bestFormula: string;
}

export async function generateHookVariants(
  topic: string,
  niche: string,
  targetAudience: string,
  count: number = 4,
  modelId: string = DEFAULT_MODEL_ID
): Promise<{ success: boolean; data?: SplitTestResult; error?: string }> {
  const t0 = Date.now();
  try {
    const systemPrompt = `You are a world-class viral content strategist specializing in short-form video hooks.

Your task: Generate ${count} DISTINCT hook variants for the same topic using different proven formulas.

Hook formulas to draw from:
- PATTERN INTERRUPT: Start with something shocking or counterintuitive
- CURIOSITY GAP: Tease information without revealing it
- SOCIAL PROOF: Numbers, results, credentials
- DIRECT CHALLENGE: Call out the viewer's belief or behavior
- STORY OPEN: Drop into the middle of a story
- BOLD CLAIM: Make a controversial or surprising statement
- QUESTION HOOK: Ask a question that demands an answer
- HOW-TO PROMISE: Specific outcome with specific method

For each variant, return JSON matching this EXACT structure:
{
  "topic": "string",
  "niche": "string",
  "variants": [
    {
      "id": "v1",
      "hook": "The exact opening line (under 15 words)",
      "angle": "One sentence describing the strategic angle",
      "formula": "Which hook formula this uses",
      "predictedCtr": 78,
      "emotionTrigger": "Primary emotion activated (curiosity/fear/desire/anger/hope)",
      "patternInterrupt": "What makes this stop the scroll"
    }
  ],
  "winner": "v2",
  "analysis": "2-3 sentences explaining why the winning variant is strongest",
  "bestFormula": "Formula name that tends to win in this niche"
}

Rules:
- Each hook must use a DIFFERENT formula
- All hooks for same topic but radically different angles
- predictedCtr: 1-100 based on viral potential, scroll-stop power, and niche fit
- Hooks must feel native to short-form video (TikTok/Reels/Shorts)
- Return ONLY valid JSON`;

    const completion = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Topic: ${topic}\nNiche: ${niche}\nTarget audience: ${targetAudience}\nGenerate ${count} hook variants.` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from AI');

    const parsed = JSON.parse(raw) as SplitTestResult;
    // Inject word counts
    parsed.variants = parsed.variants.map(v => ({ ...v, wordCount: v.hook.split(' ').length }));

    const usage = completion.usage;
    await logUsageEvent({
      integration: 'openai',
      use_case: 'split_test',
      model: modelId,
      input_tokens: usage?.prompt_tokens ?? 0,
      output_tokens: usage?.completion_tokens ?? 0,
      total_tokens: usage?.total_tokens ?? 0,
      cost_usd: estimateModelCost(modelId, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
      duration_ms: Date.now() - t0,
      status: 'success',
      metadata: { topic, niche, count },
    });

    return { success: true, data: parsed };
  } catch (error) {
    await logUsageEvent({ integration: 'openai', use_case: 'split_test', model: modelId, duration_ms: Date.now() - t0, status: 'error' });
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate variants' };
  }
}

export interface ScoreResult {
  hookId: string;
  hook: string;
  scores: {
    clarity: number;
    curiosity: number;
    urgency: number;
    specificity: number;
    emotionalPull: number;
    overall: number;
  };
  feedback: string;
  improvements: string[];
}

export async function scoreHooks(
  hooks: { id: string; hook: string }[],
  niche: string
): Promise<{ success: boolean; data?: ScoreResult[]; error?: string }> {
  const t0 = Date.now();
  try {
    const systemPrompt = `You are an expert hook analyst. Score each hook on 5 dimensions (1-100) and provide specific improvement suggestions.

Return JSON:
{
  "scores": [
    {
      "hookId": "v1",
      "hook": "...",
      "scores": {
        "clarity": 85,
        "curiosity": 92,
        "urgency": 70,
        "specificity": 65,
        "emotionalPull": 88,
        "overall": 80
      },
      "feedback": "One sentence overall assessment",
      "improvements": ["Specific suggestion 1", "Specific suggestion 2"]
    }
  ]
}

Return ONLY valid JSON.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Niche: ${niche}\n\nHooks to score:\n${hooks.map(h => `${h.id}: "${h.hook}"`).join('\n')}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response');
    const parsed = JSON.parse(raw);
    await logUsageEvent({ integration: 'openai', use_case: 'hook_score', model: 'gpt-4o-mini', duration_ms: Date.now() - t0, status: 'success' });
    return { success: true, data: parsed.scores as ScoreResult[] };
  } catch (error) {
    await logUsageEvent({ integration: 'openai', use_case: 'hook_score', model: 'gpt-4o-mini', duration_ms: Date.now() - t0, status: 'error' });
    return { success: false, error: error instanceof Error ? error.message : 'Failed to score hooks' };
  }
}
