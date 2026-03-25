'use server';

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// KALLAWAY HOOK INTELLIGENCE SYSTEM
// Based on: Short-Form Hooks Workshop framework
//
// The 4-dimension scoring model:
//  1. On-Target Clarity     — Does viewer know what topic this is in <3 sec?
//  2. Contrast Strength     — How powerful is the stated/implied contrast?
//  3. Component Alignment   — Do spoken/text/visual/audio directives align?
//  4. Curiosity Loop        — Does it open an unanswered question?
// ============================================================

export interface HookAnalysis {
  overallScore: number; // 0-10
  verdict: 'Strong Hook' | 'Needs Work' | 'Weak Hook';
  dimensions: {
    onTargetClarity: { score: number; feedback: string; tactics: string[] };
    contrastStrength: { score: number; type: 'stated' | 'implied' | 'none'; feedback: string };
    componentAlignment: { score: number; feedback: string; misalignments: string[] };
    curiosityLoop: { score: number; feedback: string; loopType: string };
  };
  hookStructure: string; // which of the 8 Kallaway archetypes this matches
  topIssue: string;
  quickFix: string;
  rewrittenVersion: string;
}

export interface HookVariant {
  structure: string;
  structureDescription: string;
  spokenHook: string;
  textHook: string;
  visualHookSuggestion: string;
  audioHookSuggestion: string;
  contrastType: 'stated' | 'implied';
  estimatedStrength: number; // 0-10
  reasoning: string;
}

export interface HookComparison {
  winner: 'A' | 'B' | 'tie';
  marginOfVictory: number;
  hookA: { score: number; topStrength: string; topWeakness: string };
  hookB: { score: number; topStrength: string; topWeakness: string };
  recommendation: string;
}

// ============================================================
// The Kallaway 8 Hook Structures (from the PDF)
// ============================================================
const HOOK_STRUCTURES = `
1. Fortuneteller: Compares existing present to a new future because of something that happened
   Ex: "This backpack is going to change how people hike forever"

2. Experimentation: Frames a pain point being solved through a live example/experiment
   Ex: "You can pack more hiking equipment in your backpack if you just do this…"

3. Educational/Tutorial: Frames a pain point being solved through a method/tool you teach
   Ex: "If you want to fit more in your backpack, use the 2-1-3 method"

4. Secret Reveal: Reveals a secret, hidden truth, or finding you came across
   Ex: "There's a backpack brand nobody knows about but all the celebrities are wearing"

5. Contrarian/Negative: Immediately states a non-obvious belief in the first line
   Ex: "People spend way too much time obsessing over their backpack design"

6. Comparison: Compares many versions of something
   Ex: "These are the top 5 hiking backpack brands…but which one is actually best?"

7. Question: Posts a question the viewer is interested in learning the answer to
   Ex: "Why are so many people wearing this backpack when they go hiking?"

8. Raw Shock: Creates instant scroll-stop with a word/action/sound
   Ex: "See this bag…" + shocking visual
`;

// ============================================================
// PIPELINE 1: Full Hook Analysis (Kallaway 4-dimension scorer)
// ============================================================
export async function analyzeHook(
  spokenHook: string,
  textHook?: string,
  visualDescription?: string,
  audioDescription?: string,
  niche?: string
): Promise<{ success: boolean; data?: HookAnalysis; error?: string }> {
  try {
    const systemPrompt = `You are an expert short-form video hook analyst trained on the Kallaway Hook Framework.

Your job is to analyze hooks against the 4 critical dimensions that determine if a hook will perform or flop.

THE KALLAWAY FRAMEWORK:
---
DIMENSION 1 - ON-TARGET CLARITY (0-10)
The viewer must understand what this video is about within 3 seconds. Test: Can someone who has never heard of you immediately identify the topic?
- Tactics that improve this: Use "you/your" (not "me/I"), give rapid context in sentence 1, minimize ambiguity, use fewest words possible
- Common failure: "This story blew my mind" (zero context) vs "If you struggle with back pain, this stretch changed my life" (immediate context)

DIMENSION 2 - CONTRAST STRENGTH (0-10)
The distance between what viewers believe (common baseline) and what you're presenting (contrarian reality). Bigger contrast = more curiosity.
- Stated Contrast: You explicitly name both sides (baseline vs reality)
- Implied Contrast: You only present the contrarian reality, viewer fills in baseline
- Zero Contrast: No contrarian angle, just stating facts with no surprise element

DIMENSION 3 - COMPONENT ALIGNMENT (0-10)
The spoken hook, text hook, visual hook, and audio hook must all reinforce the same message. Misalignment = comprehension loss = viewer bounces.
- Good: Spoken "This headband helps you sleep faster" + Text "Magical Sleep Headband" + Visual of person sleeping with headband = perfect alignment
- Bad: Spoken "This company shoots containers into space" + Visual of rockets = slight disconnect because no containers shown

DIMENSION 4 - CURIOSITY LOOP (0-10)
Does the hook open an unanswered question in the viewer's mind that forces them to keep watching to get the answer?
- Strong loop: Creates a "but wait, what happens next?" moment
- Weak loop: States a conclusion with nothing left to discover

THE 8 HOOK STRUCTURES:
${HOOK_STRUCTURES}

Return your analysis as valid JSON ONLY with this exact structure:
{
  "overallScore": 7.4,
  "verdict": "Needs Work",
  "dimensions": {
    "onTargetClarity": {
      "score": 8,
      "feedback": "Clear explanation of feedback",
      "tactics": ["specific tactic 1", "specific tactic 2"]
    },
    "contrastStrength": {
      "score": 5,
      "type": "implied",
      "feedback": "Clear explanation"
    },
    "componentAlignment": {
      "score": 9,
      "feedback": "Clear explanation",
      "misalignments": ["any specific misalignments, or empty array"]
    },
    "curiosityLoop": {
      "score": 7,
      "feedback": "Clear explanation",
      "loopType": "Question/Unknown outcome/Secret reveal/etc"
    }
  },
  "hookStructure": "Contrarian/Negative",
  "topIssue": "Single sentence describing the #1 problem",
  "quickFix": "Specific actionable fix for the top issue",
  "rewrittenVersion": "A fully rewritten version of the spoken hook that scores higher on all dimensions"
}`;

    const components = [
      `Spoken Hook: "${spokenHook}"`,
      textHook ? `Text Hook (on screen): "${textHook}"` : 'Text Hook: Not provided',
      visualDescription ? `Visual Hook description: "${visualDescription}"` : 'Visual Hook: Not described',
      audioDescription ? `Audio Hook: "${audioDescription}"` : 'Audio Hook: Not described',
      niche ? `Creator niche/topic area: ${niche}` : '',
    ].filter(Boolean).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this hook:\n\n${components}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI');

    const analysis = JSON.parse(raw) as HookAnalysis;
    return { success: true, data: analysis };
  } catch (error) {
    console.error('[HookIntelligence] analyzeHook error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Analysis failed' };
  }
}

// ============================================================
// PIPELINE 2: Hook Variant Generator
// Generates 5 variants using different Kallaway structures
// ============================================================
export async function generateHookVariants(
  subject: string,
  angle: string,
  niche: string,
  targetAudience: string
): Promise<{ success: boolean; data?: HookVariant[]; error?: string }> {
  try {
    const systemPrompt = `You are an expert short-form video hook writer trained on the Kallaway Hook Framework.

THE 8 HOOK STRUCTURES you must use:
${HOOK_STRUCTURES}

RULES FOR STRONG HOOKS:
1. On-Target: Use "you/your" not "me/I". Communicate topic in sentence 1. Short simple words.
2. Contrast: Build the biggest possible gap between common belief (baseline) and your contrarian reality
3. Curiosity Loop: End the hook with an open question in the viewer's mind
4. Alignment: Each variant must specify matching text hook + visual suggestion that PERFECTLY reinforce the spoken hook

Generate exactly 5 hook variants — one for each of these structures: Fortuneteller, Secret Reveal, Contrarian/Negative, Question, and Educational/Tutorial.

Return valid JSON ONLY:
{
  "variants": [
    {
      "structure": "Fortuneteller",
      "structureDescription": "One sentence explaining what this structure does",
      "spokenHook": "The full 1-4 line spoken hook text",
      "textHook": "Short punchy text to show on screen (5-8 words max)",
      "visualHookSuggestion": "Specific visual to show — what exactly should be on screen?",
      "audioHookSuggestion": "Music energy level and any SFX",
      "contrastType": "stated",
      "estimatedStrength": 8.2,
      "reasoning": "Why this structure works for this subject/angle"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate 5 hook variants for:\nSubject: ${subject}\nAngle: ${angle}\nNiche: ${niche}\nTarget Audience: ${targetAudience}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI');

    const parsed = JSON.parse(raw) as { variants: HookVariant[] };
    return { success: true, data: parsed.variants };
  } catch (error) {
    console.error('[HookIntelligence] generateHookVariants error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Generation failed' };
  }
}

// ============================================================
// PIPELINE 3: Hook A/B Comparator
// ============================================================
export async function compareHooks(
  hookA: string,
  hookB: string,
  niche?: string
): Promise<{ success: boolean; data?: HookComparison; error?: string }> {
  try {
    const systemPrompt = `You are an expert short-form video hook analyst using the Kallaway Framework.

Compare two hooks head-to-head across all 4 dimensions:
1. On-Target Clarity (does viewer know the topic instantly?)
2. Contrast Strength (how big is the baseline vs reality gap?)
3. Curiosity Loop (how strong is the open question?)
4. Simplicity/Comprehension (fewest words, clearest meaning)

Return valid JSON ONLY:
{
  "winner": "A",
  "marginOfVictory": 2.3,
  "hookA": {
    "score": 7.8,
    "topStrength": "Single strongest element",
    "topWeakness": "Single biggest problem"
  },
  "hookB": {
    "score": 5.5,
    "topStrength": "Single strongest element",
    "topWeakness": "Single biggest problem"
  },
  "recommendation": "2-3 sentence explanation of why winner wins and what the loser should steal from the winner"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Compare these two hooks${niche ? ` (niche: ${niche})` : ''}:\n\nHook A: "${hookA}"\n\nHook B: "${hookB}"`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI');

    const comparison = JSON.parse(raw) as HookComparison;
    return { success: true, data: comparison };
  } catch (error) {
    console.error('[HookIntelligence] compareHooks error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Comparison failed' };
  }
}
