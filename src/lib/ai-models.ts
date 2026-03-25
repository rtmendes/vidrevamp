/**
 * AI Model Registry — VidRevamp
 *
 * Supports both OpenAI (direct) and OpenRouter (multi-LLM gateway).
 * Models prefixed with a provider slug (e.g. "anthropic/...") route via OpenRouter.
 * OpenAI native model IDs (e.g. "gpt-4o") route directly to OpenAI.
 *
 * OpenRouter docs: https://openrouter.ai/docs
 */

export interface AIModel {
  id: string;           // model ID as sent to the API
  label: string;        // display name
  provider: string;     // badge label
  badge: 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral';
  tier: 'fast' | 'balanced' | 'power';
  input_per_1k: number; // USD cost per 1K input tokens
  output_per_1k: number;
  context_k: number;    // context window in thousands
  supports_vision: boolean;
  via_openrouter: boolean;
  description: string;
}

export const AI_MODELS: AIModel[] = [
  // ── OpenAI (direct) ──────────────────────────────────────────────────────
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
    description: 'Best quality. Fast. Vision-capable.',
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
    description: '100x cheaper than GPT-4o. Great for bulk.',
  },

  // ── Anthropic via OpenRouter ──────────────────────────────────────────────
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
    description: 'Best for long-form scripts & nuanced writing.',
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
    description: 'Cheapest capable model. Massive context.',
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

  // ── Meta via OpenRouter ───────────────────────────────────────────────────
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

  // ── Mistral via OpenRouter ────────────────────────────────────────────────
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
};

export const TIER_LABELS: Record<AIModel['tier'], string> = {
  fast:     'Fast & Cheap',
  balanced: 'Balanced',
  power:    'Max Quality',
};
