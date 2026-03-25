'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { VaultItem, VaultItemType } from '@/types';

// ============================================================
// Vault Server Actions — persistent storage via Supabase
// All operations are user-scoped via RLS (auth.uid() = user_id)
// ============================================================

export async function getVaultItems(): Promise<VaultItem[]> {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[vault] getVaultItems error:', error.message);
    return [];
  }

  return data as VaultItem[];
}

export async function addVaultItem(
  type: VaultItemType,
  content: string,
  tags: string[] = []
): Promise<{ success: boolean; item?: VaultItem; error?: string }> {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      user_id: user.id,
      type,
      content,
      tags,
    })
    .select()
    .single();

  if (error) {
    console.error('[vault] addVaultItem error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true, item: data as VaultItem };
}

export async function deleteVaultItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // RLS double-check

  if (error) {
    console.error('[vault] deleteVaultItem error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateVaultItemTags(
  id: string,
  tags: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('vault_items')
    .update({ tags, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
