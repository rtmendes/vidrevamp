/**
 * AI Model Registry — VidRevamp
 *
 * Supports both OpenAI (direct) and OpenRouter (multi-LLM gateway).
 * Models prefixed with a provider slug (e.g. "anthropic/...") route via OpenRouter.
 * OpenAI native model IDs (e.g. "gpt-4o") route directly to OpenAI.
 * Models with ":free" suffix are free via OpenRouter.
 *
 * OpenRouter docs: https://openrouter.ai/docs
 */

export interface AIModel {
  id: string;           // model ID as sent to the API
  label: string;        // display name
  provider: string;     // badge label
  badge: 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral' | 'deepseek' | 'qwen' | 'xai' | 'cohere';
  tier: 'fast' | 'balanced' | 'power';
  free?: boolean;       // true = $0/request via OpenRouter free tier
  input_per_1k: number; // USD cost per 1K input tokens (0 if free)
  output_per_1k: number;
  context_k: number;    // context window in thousands
  supports_vision: boolean;
  via_openrouter: boolean;
  description: string;
}

export const AI_MODELS: AIModel[] = [
  // ── OpenAI (direct) ──────────────────────────────────────────────────────
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    provider: 'OpenAI',
    badge: 'openai',
    tier: 'power',
    input_per_1k: 0.002,
    output_per_1k: 0.008,
    context_k: 1000,
    supports_vision: true,
    via_openrouter: false,
    description: 'Newest OpenAI flagship. Best coding & instruction following.',
  },
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'OpenAI',
    badge: 'openai',
    tier: 'power',
    input_per_1k: 0.005,
    output_per_1k: 0.015,
    context_k: 128,
    supports_vision: true,
    via_openrouter: false,
    description: 'Best for multimodal tasks and reasoning.',
  },
  {
    id: 'gpt-4.1-mini',
    label: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    badge: 'openai',
    tier: 'fast',
    input_per_1k: 0.0004,
    output_per_1k: 0.0016,
    context_k: 1000,
    supports_vision: true,
    via_openrouter: false,
    description: 'Fast & cheap GPT-4.1. Great for bulk generation.',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'OpenAI',
    badge: 'openai',
    tier: 'fast',
    input_per_1k: 0.00015,
    output_per_1k: 0.0006,
    context_k: 128,
    supports_vision: true,
    via_openrouter: false,
    description: '100x cheaper than GPT-4o. Great for high-volume tasks.',
  },

  // ── Anthropic via OpenRouter ──────────────────────────────────────────────
  {
    id: 'anthropic/claude-opus-4-5',
    label: 'Claude Opus 4.5',
    provider: 'Anthropic',
    badge: 'anthropic',
    tier: 'power',
    input_per_1k: 0.015,
    output_per_1k: 0.075,
    context_k: 200,
    supports_vision: true,
    via_openrouter: true,
    description: 'Most powerful Claude. Best long-form writing & nuance.',
  },
  {
    id: 'anthropic/claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    badge: 'anthropic',
    tier: 'power',
    input_per_1k: 0.003,
    output_per_1k: 0.015,
    context_k: 200,
    supports_vision: true,
    via_openrouter: true,
    description: 'Best Claude for scripts — long-form, nuanced, creative.',
  },
  {
    id: 'anthropic/claude-3-5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    badge: 'anthropic',
    tier: 'balanced',
    input_per_1k: 0.003,
    output_per_1k: 0.015,
    context_k: 200,
    supports_vision: true,
    via_openrouter: true,
    description: 'Excellent writing quality at a moderate price.',
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    label: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    badge: 'anthropic',
    tier: 'fast',
    input_per_1k: 0.0008,
    output_per_1k: 0.004,
    context_k: 200,
    supports_vision: false,
    via_openrouter: true,
    description: 'Fastest Claude. Great for quick scripts.',
  },
  {
    id: 'anthropic/claude-3-haiku',
    label: 'Claude 3 Haiku',
    provider: 'Anthropic',
    badge: 'anthropic',
    tier: 'fast',
    input_per_1k: 0.00025,
    output_per_1k: 0.00125,
    context_k: 200,
    supports_vision: false,
    via_openrouter: true,
    description: 'Ultra-fast, very affordable Claude.',
  },

  // ── Google via OpenRouter ─────────────────────────────────────────────────
  {
    id: 'google/gemini-2.5-pro-preview-06-05',
    label: 'Gemini 2.5 Pro',
    provider: 'Google',
    badge: 'google',
    tier: 'power',
    input_per_1k: 0.00125,
    output_per_1k: 0.01,
    context_k: 1000,
    supports_vision: true,
    via_openrouter: true,
    description: 'Google\'s best. Huge context, strong reasoning.',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    label: 'Gemini 2.0 Flash',
    provider: 'Google',
    badge: 'google',
    tier: 'fast',
    input_per_1k: 0.0001,
    output_per_1k: 0.0004,
    context_k: 1000,
    supports_vision: true,
    via_openrouter: true,
    description: 'Lightning fast. Best speed-quality tradeoff.',
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    label: 'Gemini 2.0 Flash (FREE)',
    provider: 'Google',
    badge: 'google',
    tier: 'fast',
    free: true,
    input_per_1k: 0,
    output_per_1k: 0,
    context_k: 1000,
    supports_vision: true,
    via_openrouter: true,
    description: 'FREE Gemini 2.0 Flash via OpenRouter. Rate limited.',
  },
  {
    id: 'google/gemini-flash-1.5',
    label: 'Gemini Flash 1.5',
    provider: 'Google',
    badge: 'google',
    tier: 'fast',
    input_per_1k: 0.000075,
    output_per_1k: 0.0003,
    context_k: 1000,
    supports_vision: true,
    via_openrouter: true,
    description: 'Cheapest capable model. Massive 1M context.',
  },
  {
    id: 'google/gemini-pro-1.5',
    label: 'Gemini Pro 1.5',
    provider: 'Google',
    badge: 'google',
    tier: 'balanced',
    input_per_1k: 0.00125,
    output_per_1k: 0.005,
    context_k: 2000,
    supports_vision: true,
    via_openrouter: true,
    description: 'Strong for scripts, 2M context window.',
  },

  // ── DeepSeek via OpenRouter ───────────────────────────────────────────────
  {
    id: 'deepseek/deepseek-chat-v3-0324',
    label: 'DeepSeek V3',
    provider: 'DeepSeek',
    badge: 'deepseek',
    tier: 'power',
    input_per_1k: 0.00027,
    output_per_1k: 0.0011,
    context_k: 64,
    supports_vision: false,
    via_openrouter: true,
    description: 'GPT-4o quality at fraction of cost. Excellent writing.',
  },
  {
    id: 'deepseek/deepseek-r1',
    label: 'DeepSeek R1 (Reasoning)',
    provider: 'DeepSeek',
    badge: 'deepseek',
    tier: 'power',
    input_per_1k: 0.00055,
    output_per_1k: 0.00219,
    context_k: 64,
    supports_vision: false,
    via_openrouter: true,
    description: 'Chain-of-thought reasoning model. Best for complex scripts.',
  },
  {
    id: 'deepseek/deepseek-chat:free',
    label: 'DeepSeek V3 (FREE)',
    provider: 'DeepSeek',
    badge: 'deepseek',
    tier: 'balanced',
    free: true,
    input_per_1k: 0,
    output_per_1k: 0,
    context_k: 64,
    supports_vision: false,
    via_openrouter: true,
    description: 'FREE DeepSeek V3 via OpenRouter. Rate limited.',
  },

  // ── Meta via OpenRouter ───────────────────────────────────────────────────
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B',
    provider: 'Meta',
    badge: 'meta',
    tier: 'balanced',
    input_per_1k: 0.00012,
    output_per_1k: 0.00030,
    context_k: 128,
    supports_vision: false,
    via_openrouter: true,
    description: 'Open source. Excellent quality per dollar.',
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    label: 'Llama 3.1 70B',
    provider: 'Meta',
    badge: 'meta',
    tier: 'balanced',
    input_per_1k: 0.00035,
    output_per_1k: 0.0004,
    context_k: 128,
    supports_vision: false,
    via_openrouter: true,
    description: 'Open source. Very affordable. Strong output.',
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    label: 'Llama 3.1 8B (FREE)',
    provider: 'Meta',
    badge: 'meta',
    tier: 'fast',
    free: true,
    input_per_1k: 0,
    output_per_1k: 0,
    context_k: 128,
    supports_vision: false,
    via_openrouter: true,
    description: 'FREE open-source model. Rate limited. Good for drafts.',
  },

  // ── Qwen via OpenRouter ───────────────────────────────────────────────────
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    label: 'Qwen 2.5 72B',
    provider: 'Qwen',
    badge: 'qwen',
    tier: 'balanced',
    input_per_1k: 0.00013,
    output_per_1k: 0.0004,
    context_k: 128,
    supports_vision: false,
    via_openrouter: true,
    description: 'Strong multilingual model. Great for international content.',
  },

  // ── Mistral via OpenRouter ────────────────────────────────────────────────
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct',
    label: 'Mistral Small 3.1',
    provider: 'Mistral',
    badge: 'mistral',
    tier: 'fast',
    input_per_1k: 0.0001,
    output_per_1k: 0.0003,
    context_k: 128,
    supports_vision: true,
    via_openrouter: true,
    description: 'EU-based. Fast, vision-capable, multilingual.',
  },
  {
    id: 'mistralai/mistral-large',
    label: 'Mistral Large',
    provider: 'Mistral',
    badge: 'mistral',
    tier: 'balanced',
    input_per_1k: 0.003,
    output_per_1k: 0.009,
    context_k: 128,
    supports_vision: false,
    via_openrouter: true,
    description: 'EU-based. Good multilingual support.',
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    label: 'Mistral 7B (FREE)',
    provider: 'Mistral',
    badge: 'mistral',
    tier: 'fast',
    free: true,
    input_per_1k: 0,
    output_per_1k: 0,
    context_k: 32,
    supports_vision: false,
    via_openrouter: true,
    description: 'FREE Mistral via OpenRouter. Rate limited. Great for simple drafts.',
  },

  // ── xAI via OpenRouter ────────────────────────────────────────────────────
  {
    id: 'x-ai/grok-3-beta',
    label: 'Grok 3',
    provider: 'xAI',
    badge: 'xai',
    tier: 'power',
    input_per_1k: 0.003,
    output_per_1k: 0.015,
    context_k: 131,
    supports_vision: false,
    via_openrouter: true,
    description: 'xAI\'s latest. Strong reasoning and creative writing.',
  },
  {
    id: 'x-ai/grok-2-1212',
    label: 'Grok 2',
    provider: 'xAI',
    badge: 'xai',
    tier: 'balanced',
    input_per_1k: 0.002,
    output_per_1k: 0.010,
    context_k: 131,
    supports_vision: false,
    via_openrouter: true,
    description: 'xAI\'s fast model. Real-time knowledge, witty tone.',
  },
];

export const DEFAULT_MODEL_ID = 'gpt-4o';

export function getModel(id: string): AIModel {
  return AI_MODELS.find((m) => m.id === id) ?? AI_MODELS[0];
}

/** Cost estimate for a model */
export function estimateModelCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const m = getModel(modelId);
  return (inputTokens / 1000) * m.input_per_1k + (outputTokens / 1000) * m.output_per_1k;
}

export const BADGE_COLORS: Record<AIModel['badge'], string> = {
  openai:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  anthropic: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  google:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  meta:      'bg-purple-500/15 text-purple-400 border-purple-500/25',
  mistral:   'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  deepseek:  'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  qwen:      'bg-teal-500/15 text-teal-400 border-teal-500/25',
  xai:       'bg-zinc-400/15 text-zinc-300 border-zinc-400/25',
  cohere:    'bg-rose-500/15 text-rose-400 border-rose-500/25',
};

export const TIER_LABELS: Record<AIModel['tier'], string> = {
  fast:     'Fast & Cheap',
  balanced: 'Balanced',
  power:    'Max Quality',
};
