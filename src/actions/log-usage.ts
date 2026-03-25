'use server';

/**
 * Usage Event Logger — VidRevamp
 *
 * Inspired by Stoneforge's operation_log + provider_metrics tables.
 * Writes to Supabase usage_events table (run migration SQL from /dashboard/ops).
 * Non-blocking: never throws — a logging failure never breaks a user request.
 *
 * Cost model (USD per 1K tokens):
 *   gpt-4o         input $0.005  output $0.015
 *   gpt-4o-mini    input $0.00015  output $0.0006
 *   gpt-4-turbo    input $0.01   output $0.03
 *   gpt-3.5-turbo  input $0.0005  output $0.0015
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface UsageEventPayload {
  integration: 'openai' | 'supabase' | 'youtube_api' | 'ad_intel' | 'internal';
  use_case: 'script_gen' | 'script_fix' | 'translate' | 'vision' | 'hook_lab' | 'vault_read' | 'research' | 'ad_sync' | 'split_test' | 'hook_score' | 'storyboard' | 'image_gen' | 'weekly_report' | 'daily_brief';
  brand_id?: string;
  project_id?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  cost_usd?: number;
  duration_ms?: number;
  status?: 'success' | 'error';
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget usage logger.
 * Inserts one row into usage_events. Never throws.
 */
export async function logUsageEvent(payload: UsageEventPayload): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    const { error } = await supabase.from('usage_events').insert({
      user_id:       authData?.user?.id ?? null,
      integration:   payload.integration,
      use_case:      payload.use_case,
      brand_id:      payload.brand_id ?? null,
      project_id:    payload.project_id ?? null,
      model:         payload.model ?? null,
      input_tokens:  payload.input_tokens ?? 0,
      output_tokens: payload.output_tokens ?? 0,
      total_tokens:  payload.total_tokens ?? 0,
      cost_usd:      payload.cost_usd ?? 0,
      duration_ms:   payload.duration_ms ?? null,
      status:        payload.status ?? 'success',
      metadata:      payload.metadata ?? {},
    });

    if (error) {
      // Table may not exist yet — remind but don't throw
      console.warn('[usage] Insert failed (run migration from /dashboard/ops):', error.message);
    }
  } catch (err) {
    // Supabase not configured, network error, etc. — always non-blocking
    console.warn('[usage] logUsageEvent non-critical error:', err instanceof Error ? err.message : err);
  }
}
