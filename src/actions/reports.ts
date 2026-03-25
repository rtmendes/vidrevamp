'use server';

import OpenAI from 'openai';
import { logUsageEvent } from './log-usage';
import { estimateModelCost, DEFAULT_MODEL_ID } from '@/lib/ai-models';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface WeeklyReport {
  week: string;
  generatedAt: string;
  executiveSummary: string;
  topInsights: string[];
  topPerformingContent: {
    title: string;
    views: string;
    outlierScore: string;
    hook: string;
    why: string;
  }[];
  winningPatterns: {
    pattern: string;
    evidence: string;
    recommendation: string;
  }[];
  contentGaps: string[];
  nextWeekBriefs: {
    topic: string;
    angle: string;
    estimatedOutlierPotential: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  costAnalysis: {
    totalSpend: string;
    contentGenerated: number;
    costPerPiece: string;
    roi: string;
  };
  actionItems: string[];
}

export async function generateWeeklyReport(
  niche: string,
  trackedChannels: string[],
  recentOutliers: string[],
  modelId: string = DEFAULT_MODEL_ID
): Promise<{ success: boolean; data?: WeeklyReport; error?: string }> {
  const start = Date.now();

  const systemPrompt = `You are a Chief Content Strategist writing a weekly performance intelligence report for a content creator in the ${niche} niche. Your job is to analyze the provided outlier videos and channels, identify winning patterns, create content briefs for next week, and provide actionable recommendations. Be specific, data-driven, and direct. Return a single valid JSON object matching the WeeklyReport schema exactly.`;

  const userPrompt = `Generate a comprehensive weekly performance intelligence report for a ${niche} content creator.

Tracked Channels: ${trackedChannels.length > 0 ? trackedChannels.join(', ') : 'Not specified — use relevant industry examples'}
Recent Outlier Videos: ${recentOutliers.length > 0 ? recentOutliers.join('\n- ') : 'Not specified — analyze hypothetical top performers in ' + niche}

Return a JSON object with EXACTLY these fields:
{
  "week": "Week of March 25, 2026",
  "generatedAt": "<ISO timestamp>",
  "executiveSummary": "<2-3 paragraph strategic overview of the week>",
  "topInsights": ["<insight 1>", "<insight 2>", "<insight 3>", "<insight 4>", "<insight 5>"],
  "topPerformingContent": [
    {
      "title": "<video title>",
      "views": "<e.g. 2.4M>",
      "outlierScore": "<e.g. 8.7x>",
      "hook": "<the opening hook used>",
      "why": "<why this outperformed>"
    }
  ],
  "winningPatterns": [
    {
      "pattern": "<pattern name>",
      "evidence": "<specific examples supporting this>",
      "recommendation": "<how to apply this>"
    }
  ],
  "contentGaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "nextWeekBriefs": [
    {
      "topic": "<video topic>",
      "angle": "<unique angle>",
      "estimatedOutlierPotential": "<e.g. High — 5-10x>",
      "priority": "high"
    }
  ],
  "costAnalysis": {
    "totalSpend": "<e.g. $47.20>",
    "contentGenerated": 12,
    "costPerPiece": "<e.g. $3.93>",
    "roi": "<e.g. 340% estimated>>"
  },
  "actionItems": ["<action 1>", "<action 2>", "<action 3>", "<action 4>", "<action 5>"]
}

Include at least 3 topPerformingContent items, 3 winningPatterns, 4 nextWeekBriefs, 3 contentGaps, and 5 actionItems.`;

  try {
    const response = await client.chat.completions.create({
      model: modelId,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const durationMs = Date.now() - start;
    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const cost = estimateModelCost(modelId, inputTokens, outputTokens);

    await logUsageEvent({
      integration: 'openai',
      use_case: 'research',
      model: modelId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: response.usage?.total_tokens ?? 0,
      cost_usd: cost,
      duration_ms: durationMs,
      status: 'success',
      metadata: { use_case: 'weekly_report', niche },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: 'No content returned from AI.' };
    }

    const parsed = JSON.parse(content) as WeeklyReport;
    return { success: true, data: parsed };
  } catch (err) {
    await logUsageEvent({
      integration: 'openai',
      use_case: 'research',
      model: modelId,
      status: 'error',
      metadata: {
        use_case: 'weekly_report',
        niche,
        error: err instanceof Error ? err.message : String(err),
      },
    });

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error generating weekly report.',
    };
  }
}

export async function generateDailyBrief(
  niche: string,
  modelId: string = DEFAULT_MODEL_ID
): Promise<{
  success: boolean;
  data?: { brief: string; topicIdeas: string[]; hookFormula: string; urgentAction: string };
  error?: string;
}> {
  const start = Date.now();

  const systemPrompt = `You are a morning creative director. Generate a focused daily brief for a content creator in the ${niche} niche. Be energizing, specific, and actionable. Return only valid JSON.`;

  const userPrompt = `Generate a daily creative brief for a ${niche} content creator. Return a JSON object with EXACTLY these fields:
{
  "brief": "<2-sentence overview of today's creative focus>",
  "topicIdeas": ["<idea 1>", "<idea 2>", "<idea 3>"],
  "hookFormula": "<one specific hook formula to focus on today>",
  "urgentAction": "<one specific, immediately actionable thing to do today>"
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const durationMs = Date.now() - start;
    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const cost = estimateModelCost('gpt-4o-mini', inputTokens, outputTokens);

    await logUsageEvent({
      integration: 'openai',
      use_case: 'research',
      model: 'gpt-4o-mini',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: response.usage?.total_tokens ?? 0,
      cost_usd: cost,
      duration_ms: durationMs,
      status: 'success',
      metadata: { use_case: 'daily_brief', niche },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: 'No content returned from AI.' };
    }

    const parsed = JSON.parse(content) as {
      brief: string;
      topicIdeas: string[];
      hookFormula: string;
      urgentAction: string;
    };

    return { success: true, data: parsed };
  } catch (err) {
    await logUsageEvent({
      integration: 'openai',
      use_case: 'research',
      model: modelId,
      status: 'error',
      metadata: {
        use_case: 'daily_brief',
        niche,
        error: err instanceof Error ? err.message : String(err),
      },
    });

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error generating daily brief.',
    };
  }
}
