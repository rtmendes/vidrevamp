/**
 * Image Generation Model Registry — VidRevamp
 *
 * Supports OpenAI (direct) and OpenRouter (Flux, Ideogram, SD, etc.).
 * Models via OpenAI: dall-e-3, gpt-image-1
 * Models via OpenRouter: Flux 1.1 Pro, Flux Schnell, Ideogram v2, SD 3.5
 */

export interface ImageModel {
  id: string;
  label: string;
  provider: string;
  badge: 'openai' | 'flux' | 'ideogram' | 'stability' | 'google';
  tier: 'fast' | 'balanced' | 'power';
  free?: boolean;
  cost_per_image: number;       // USD per 1024x1024 generation
  via: 'openai' | 'openrouter';
  strengths: string;            // one-liner capability note
  best_for: string;             // use-case guidance
  sizes: {                      // API size strings per aspect
    '16:9': string;
    '9:16': string;
    '1:1': string;
  };
}

export const IMAGE_MODELS: ImageModel[] = [
  // ── OpenAI (direct SDK) ───────────────────────────────────────────────────
  {
    id: 'dall-e-3',
    label: 'DALL·E 3',
    provider: 'OpenAI',
    badge: 'openai',
    tier: 'balanced',
    cost_per_image: 0.040,
    via: 'openai',
    strengths: 'Best prompt adherence, natural text in images',
    best_for: 'Text overlays, cinematic scenes, photorealism',
    sizes: { '16:9': '1792x1024', '9:16': '1024x1792', '1:1': '1024x1024' },
  },
  {
    id: 'gpt-image-1',
    label: 'GPT Image 1',
    provider: 'OpenAI',
    badge: 'openai',
    tier: 'power',
    cost_per_image: 0.011,
    via: 'openai',
    strengths: 'OpenAI\'s newest model — best composition & detail',
    best_for: 'High-quality thumbnails, detailed scenes',
    sizes: { '16:9': '1536x1024', '9:16': '1024x1536', '1:1': '1024x1024' },
  },

  // ── Black Forest Labs via OpenRouter ──────────────────────────────────────
  {
    id: 'black-forest-labs/flux-1.1-pro',
    label: 'Flux 1.1 Pro',
    provider: 'Black Forest Labs',
    badge: 'flux',
    tier: 'power',
    cost_per_image: 0.040,
    via: 'openrouter',
    strengths: 'Photorealistic, incredible detail, accurate anatomy',
    best_for: 'Realistic face shots, professional photography look',
    sizes: { '16:9': '1344x768', '9:16': '768x1344', '1:1': '1024x1024' },
  },
  {
    id: 'black-forest-labs/flux-schnell',
    label: 'Flux Schnell',
    provider: 'Black Forest Labs',
    badge: 'flux',
    tier: 'fast',
    free: true,
    cost_per_image: 0.001,
    via: 'openrouter',
    strengths: 'Extremely fast (1-2s), free tier available',
    best_for: 'Quick drafts, testing concepts, batch generation',
    sizes: { '16:9': '1344x768', '9:16': '768x1344', '1:1': '1024x1024' },
  },
  {
    id: 'black-forest-labs/flux-pro',
    label: 'Flux Pro',
    provider: 'Black Forest Labs',
    badge: 'flux',
    tier: 'balanced',
    cost_per_image: 0.055,
    via: 'openrouter',
    strengths: 'Artistic quality, vibrant colors, creative composition',
    best_for: 'Illustrated, cinematic, and stylized thumbnails',
    sizes: { '16:9': '1344x768', '9:16': '768x1344', '1:1': '1024x1024' },
  },

  // ── Ideogram via OpenRouter ───────────────────────────────────────────────
  {
    id: 'ideogram-ai/ideogram-v2',
    label: 'Ideogram v2',
    provider: 'Ideogram AI',
    badge: 'ideogram',
    tier: 'power',
    cost_per_image: 0.080,
    via: 'openrouter',
    strengths: 'Best text rendering in images — readable overlays',
    best_for: 'Bold text thumbnails, title overlays, graphic design style',
    sizes: { '16:9': '1280x720', '9:16': '720x1280', '1:1': '1024x1024' },
  },
  {
    id: 'ideogram-ai/ideogram-v2-turbo',
    label: 'Ideogram v2 Turbo',
    provider: 'Ideogram AI',
    badge: 'ideogram',
    tier: 'fast',
    cost_per_image: 0.025,
    via: 'openrouter',
    strengths: 'Fast Ideogram with good text rendering',
    best_for: 'Quick text-heavy thumbnails at lower cost',
    sizes: { '16:9': '1280x720', '9:16': '720x1280', '1:1': '1024x1024' },
  },

  // ── Stability AI via OpenRouter ───────────────────────────────────────────
  {
    id: 'stability-ai/stable-diffusion-3-5-large',
    label: 'SD 3.5 Large',
    provider: 'Stability AI',
    badge: 'stability',
    tier: 'balanced',
    cost_per_image: 0.065,
    via: 'openrouter',
    strengths: 'Artistic, flexible styles, strong aesthetics',
    best_for: 'Illustrated, artistic, and stylized thumbnails',
    sizes: { '16:9': '1280x720', '9:16': '720x1280', '1:1': '1024x1024' },
  },
];

export const DEFAULT_IMAGE_MODEL_ID = 'dall-e-3';

export function getImageModel(id: string): ImageModel {
  return IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0];
}

export const IMAGE_BADGE_COLORS: Record<ImageModel['badge'], string> = {
  openai:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  flux:      'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  ideogram:  'bg-violet-500/15 text-violet-400 border-violet-500/25',
  stability: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  google:    'bg-sky-500/15 text-sky-400 border-sky-500/25',
};
