import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cost per 1K tokens (GPT-4o)
const INPUT_COST_PER_1K = 0.005;
const OUTPUT_COST_PER_1K = 0.015;

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    sourceTranscript?: string;
    platform?: string;
    productName: string;
    targetAudience?: string;
    usps?: string[];
    sourceAdId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { sourceTranscript, platform, productName, targetAudience, usps = [], sourceAdId } = body;

  if (!productName?.trim()) {
    return NextResponse.json({ error: 'productName is required' }, { status: 400 });
  }

  const uspBlock = usps.length > 0
    ? `\nUnique Selling Propositions:\n${usps.map((u, i) => `${i + 1}. ${u}`).join('\n')}`
    : '';

  const systemPrompt = `You are an elite direct-response copywriter specializing in ${platform ?? 'video'} ads.

Analyze the provided winning ad transcript/copy. Identify its core hook, emotional trigger, pacing structure, proof mechanisms, and call to action pattern.

Then write a brand new video script for the user's product that mimics the exact proven psychological structure, pacing, and emotional journey of the original — but uses completely new, original language tailored to the new product.

Format your output as a clean video script with clear section labels:
[HOOK] — first 3-5 seconds
[PROBLEM] — pain agitation
[SOLUTION] — product reveal
[PROOF] — social proof or demonstration
[CTA] — call to action

Do NOT copy any phrases from the original. Model the framework, not the words.`;

  const userPrompt = `WINNING AD TO MODEL:
${sourceTranscript?.trim() || '(No transcript available — use best practices for ' + (platform ?? 'video') + ' ads)'}

PRODUCT TO CREATE AD FOR:
Product/Brand: ${productName}
Target Audience: ${targetAudience ?? 'Not specified'}${uspBlock}

Write the new video script now:`;

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1200,
    });
  } catch {
    // Log failed attempt
    await supabase.from('api_usage_logs').insert({
      user_id: userId,
      provider: 'OPENAI',
      endpoint: 'gpt-4o',
      units_used: 0,
      cost_usd: 0,
      status: 'FAILED',
    });
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }

  const script = completion.choices[0]?.message?.content ?? '';
  const inputTokens = completion.usage?.prompt_tokens ?? 0;
  const outputTokens = completion.usage?.completion_tokens ?? 0;
  const totalTokens = completion.usage?.total_tokens ?? 0;
  const costUsd = (inputTokens / 1000) * INPUT_COST_PER_1K + (outputTokens / 1000) * OUTPUT_COST_PER_1K;

  // ── Log cost to api_usage_logs ─────────────────────────────────────────────
  await supabase.from('api_usage_logs').insert({
    user_id: userId,
    provider: 'OPENAI',
    endpoint: 'gpt-4o',
    units_used: totalTokens,
    cost_usd: costUsd,
    status: 'SUCCESS',
    metadata: { productName, platform, sourceAdId },
  });

  // ── Save generated script to DB ────────────────────────────────────────────
  await supabase.from('generated_ad_scripts').insert({
    user_id: userId,
    source_ad_id: sourceAdId ?? null,
    product_name: productName,
    target_audience: targetAudience ?? null,
    usps: usps,
    script,
    model_used: 'gpt-4o',
    tokens_used: totalTokens,
    cost_usd: costUsd,
  });

  return NextResponse.json({ script, model: 'gpt-4o', tokensUsed: totalTokens, costUsd });
}
