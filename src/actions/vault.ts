'use server';

import { createSupabaseAdminClient, getEffectiveUserId } from '@/lib/supabase/server';
import type { VaultItem, VaultItemType } from '@/types';

export async function getVaultItems(): Promise<VaultItem[]> {
  const supabase = createSupabaseAdminClient();
  const userId = await getEffectiveUserId();

  const { data, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('user_id', userId)
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
  const supabase = createSupabaseAdminClient();
  const userId = await getEffectiveUserId();

  const { data, error } = await supabase
    .from('vault_items')
    .insert({ user_id: userId, type, content, tags })
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
  const supabase = createSupabaseAdminClient();
  const userId = await getEffectiveUserId();

  const { error } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

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
  const supabase = createSupabaseAdminClient();
  const userId = await getEffectiveUserId();

  const { error } = await supabase
    .from('vault_items')
    .update({ tags, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
