/**
 * API Cost Analysis & Optimization Guide — VidRevamp
 *
 * Tracks per-task costs across current vs optimized model routing,
 * OSS self-hosting alternatives, and monthly spend projections.
 */

export interface TaskCostEntry {
  task: string;
  category: 'script' | 'hooks' | 'thumbnail' | 'analysis' | 'research' | 'vault';
  currentModel: string;
  currentCostPer: number;      // USD per call
  optimizedModel: string;
  optimizedCostPer: number;    // USD per call
  savingsPct: number;          // 0–100
  quality: 'same' | 'slightly-lower' | 'higher';
  note: string;
}

export interface OSSAlternative {
  name: string;
  replaces: string;
  githubUrl: string;
  stars: string;
  selfHostCost: string;   // monthly infra cost estimate
  tradeoff: string;
  setupDifficulty: 'easy' | 'medium' | 'hard';
}

export interface SpendTier {
  label: string;
  scriptsPerMonth: number;
  hooksPerMonth: number;
  thumbnailsPerMonth: number;
  currentMonthlyUSD: number;
  optimizedMonthlyUSD: number;
}

// ── Per-task cost breakdown ────────────────────────────────────────────────

export const TASK_COSTS: TaskCostEntry[] = [
  {
    task: 'Full video script (2,000 tokens out)',
    category: 'script',
    currentModel: 'gpt-4o',
    currentCostPer: 0.040,
    optimizedModel: 'deepseek/deepseek-chat-v3-0324',
    optimizedCostPer: 0.003,
    savingsPct: 93,
    quality: 'same',
    note: 'DeepSeek V3 matches GPT-4o on long-form creative writing at 93% lower cost.',
  },
  {
    task: 'Hook generation (500 tokens out)',
    category: 'hooks',
    currentModel: 'gpt-4o',
    currentCostPer: 0.010,
    optimizedModel: 'google/gemini-2.0-flash-001',
    optimizedCostPer: 0.0002,
    savingsPct: 98,
    quality: 'same',
    note: 'Gemini Flash is ideal for short punchy outputs. 98% cheaper per call.',
  },
  {
    task: 'Thumbnail image (1024×1024)',
    category: 'thumbnail',
    currentModel: 'dall-e-3',
    currentCostPer: 0.040,
    optimizedModel: 'black-forest-labs/flux-schnell',
    optimizedCostPer: 0.001,
    savingsPct: 98,
    quality: 'slightly-lower',
    note: 'Flux Schnell is 40x cheaper for drafts. Use DALL-E 3 / Flux Pro for finals.',
  },
  {
    task: 'CTR score analysis (thumbnail)',
    category: 'thumbnail',
    currentModel: 'gpt-4o-mini',
    currentCostPer: 0.0005,
    optimizedModel: 'gpt-4o-mini',
    optimizedCostPer: 0.0005,
    savingsPct: 0,
    quality: 'same',
    note: 'Already optimized — gpt-4o-mini is ideal for structured scoring tasks.',
  },
  {
    task: 'Research brief generation',
    category: 'research',
    currentModel: 'gpt-4o',
    currentCostPer: 0.060,
    optimizedModel: 'anthropic/claude-sonnet-4-5',
    optimizedCostPer: 0.012,
    savingsPct: 80,
    quality: 'higher',
    note: 'Claude Sonnet 4.5 produces better structured briefs at 80% lower cost than GPT-4o.',
  },
  {
    task: 'Ad hook extraction (paste import)',
    category: 'vault',
    currentModel: 'gpt-4o-mini',
    currentCostPer: 0.0008,
    optimizedModel: 'google/gemini-2.0-flash-001',
    optimizedCostPer: 0.0001,
    savingsPct: 88,
    quality: 'same',
    note: 'Extraction tasks are simple — Flash handles them perfectly.',
  },
  {
    task: 'YouTube channel analysis',
    category: 'analysis',
    currentModel: 'gpt-4o',
    currentCostPer: 0.025,
    optimizedModel: 'deepseek/deepseek-chat-v3-0324',
    optimizedCostPer: 0.002,
    savingsPct: 92,
    quality: 'same',
    note: 'DeepSeek V3 at 1/12th the cost for analytical tasks.',
  },
  {
    task: 'Translation / localization',
    category: 'script',
    currentModel: 'gpt-4o',
    currentCostPer: 0.020,
    optimizedModel: 'qwen/qwen-2.5-72b-instruct',
    optimizedCostPer: 0.0006,
    savingsPct: 97,
    quality: 'same',
    note: 'Qwen 2.5 excels at multilingual content — 97% cheaper for translation.',
  },
];

// ── OSS self-hosting alternatives ─────────────────────────────────────────

export const OSS_ALTERNATIVES: OSSAlternative[] = [
  {
    name: 'Ollama',
    replaces: 'OpenAI / OpenRouter (text generation)',
    githubUrl: 'https://github.com/ollama/ollama',
    stars: '100k+',
    selfHostCost: '$0 (local) / ~$50/mo (cloud GPU)',
    tradeoff: 'Quality gap on complex tasks. Ideal for hooks and short extractions.',
    setupDifficulty: 'easy',
  },
  {
    name: 'ComfyUI',
    replaces: 'DALL-E 3 / Flux / image generation APIs',
    githubUrl: 'https://github.com/comfyanonymous/ComfyUI',
    stars: '70k+',
    selfHostCost: '$0 (local GPU) / ~$30–80/mo (RunPod)',
    tradeoff: 'Requires GPU. Unlimited generations once running. Best quality/cost for volume.',
    setupDifficulty: 'medium',
  },
  {
    name: 'LiteLLM',
    replaces: 'Direct OpenAI SDK (unified proxy/router)',
    githubUrl: 'https://github.com/BerriAI/litellm',
    stars: '20k+',
    selfHostCost: '$0 (self-hosted) / $49/mo (cloud)',
    tradeoff: 'Adds latency. Enables automatic fallbacks, spend limits, and cost tracking.',
    setupDifficulty: 'easy',
  },
  {
    name: 'LocalAI',
    replaces: 'OpenAI API (OpenAI-compatible local server)',
    githubUrl: 'https://github.com/mudler/LocalAI',
    stars: '28k+',
    selfHostCost: '$0 (local) / ~$40/mo (VPS)',
    tradeoff: 'Drop-in OpenAI replacement. Works with existing SDK — just swap base URL.',
    setupDifficulty: 'easy',
  },
  {
    name: 'Whisper (OpenAI OSS)',
    replaces: 'OpenAI Whisper API ($0.006/min)',
    githubUrl: 'https://github.com/openai/whisper',
    stars: '80k+',
    selfHostCost: '$0 (local) / ~$20/mo (GPU instance)',
    tradeoff: 'Identical accuracy. Unlimited transcription for $0 after setup.',
    setupDifficulty: 'easy',
  },
  {
    name: 'Stable Diffusion WebUI (AUTOMATIC1111)',
    replaces: 'SD 3.5 API via OpenRouter',
    githubUrl: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
    stars: '145k+',
    selfHostCost: '$0 (local GPU) / ~$30/mo (RunPod A100)',
    tradeoff: 'Massive community, tons of models. Requires 8GB+ VRAM for good results.',
    setupDifficulty: 'medium',
  },
  {
    name: 'OpenWebUI',
    replaces: 'ChatGPT-style UI for Ollama/OpenAI',
    githubUrl: 'https://github.com/open-webui/open-webui',
    stars: '60k+',
    selfHostCost: '$0 (self-hosted)',
    tradeoff: 'Full ChatGPT-like UI. Use alongside VidRevamp for manual research tasks.',
    setupDifficulty: 'easy',
  },
];

// ── Monthly spend projections ──────────────────────────────────────────────

export const SPEND_TIERS: SpendTier[] = [
  {
    label: 'Starter (solo creator)',
    scriptsPerMonth: 8,
    hooksPerMonth: 40,
    thumbnailsPerMonth: 24,
    currentMonthlyUSD: 4.20,
    optimizedMonthlyUSD: 0.31,
  },
  {
    label: 'Growth (2–5 channels)',
    scriptsPerMonth: 40,
    hooksPerMonth: 200,
    thumbnailsPerMonth: 80,
    currentMonthlyUSD: 19.80,
    optimizedMonthlyUSD: 1.24,
  },
  {
    label: 'Agency (10+ channels)',
    scriptsPerMonth: 200,
    hooksPerMonth: 1000,
    thumbnailsPerMonth: 400,
    currentMonthlyUSD: 98.00,
    optimizedMonthlyUSD: 6.10,
  },
];

// ── Cost routing recommendations ──────────────────────────────────────────

export interface RoutingRule {
  task: string;
  use: string;
  why: string;
  freeOption?: string;
}

export const ROUTING_RECOMMENDATIONS: RoutingRule[] = [
  {
    task: 'Scripts & long-form writing',
    use: 'Claude Sonnet 4.5 or DeepSeek V3',
    why: 'Best writing quality per dollar. DeepSeek V3 is 93% cheaper than GPT-4o.',
    freeOption: 'DeepSeek V3 Free (rate-limited)',
  },
  {
    task: 'Hook generation & short copy',
    use: 'Gemini 2.0 Flash or GPT-4.1 Mini',
    why: 'Extremely fast and cheap for short outputs. Gemini Flash is $0.0001/1K in.',
    freeOption: 'Gemini 2.0 Flash Free or Llama 3.1 8B Free',
  },
  {
    task: 'Thumbnail drafts',
    use: 'Flux Schnell (free tier via OpenRouter)',
    why: '1-2s generation, free tier available — perfect for iterating concepts.',
    freeOption: 'Flux Schnell free tier',
  },
  {
    task: 'Final thumbnail (hero image)',
    use: 'Ideogram v2 (text) or Flux 1.1 Pro (photo)',
    why: 'Ideogram has best text rendering for overlays. Flux Pro for photo-real.',
  },
  {
    task: 'Research briefs',
    use: 'Claude Sonnet 4.5 or Gemini 2.5 Pro',
    why: 'Long-context, structured reasoning. Gemini 2.5 Pro has 1M token window.',
  },
  {
    task: 'Translation',
    use: 'Qwen 2.5 72B or Mistral Small 3.1',
    why: 'Purpose-built for multilingual tasks. 97% cheaper than GPT-4o.',
  },
];
