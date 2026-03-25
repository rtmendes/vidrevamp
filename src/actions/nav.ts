'use server';

import { createSupabaseAdminClient, getEffectiveUserId } from '@/lib/supabase/server';

export type NavFolder = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  is_open: boolean;
  created_at: string;
};

export type NavState = {
  folders: NavFolder[];
  placements: Record<string, string | null>;
};

export async function getNavState(): Promise<NavState> {
  try {
    const supabase = createSupabaseAdminClient();
    const userId = await getEffectiveUserId();

    const [{ data: folders, error: fe }, { data: placements, error: pe }] = await Promise.all([
      supabase
        .from('nav_folders')
        .select('id, name, parent_id, sort_order, is_open, created_at')
        .eq('user_id', userId)
        .order('sort_order'),
      supabase
        .from('nav_item_placements')
        .select('item_id, folder_id')
        .eq('user_id', userId),
    ]);

    if (fe || pe) return { folders: [], placements: {} };

    const placementMap: Record<string, string | null> = {};
    for (const p of placements ?? []) placementMap[p.item_id] = p.folder_id;

    return {
      folders: (folders ?? []) as NavFolder[],
      placements: placementMap,
    };
  } catch {
    return { folders: [], placements: {} };
  }
}

export async function createNavFolder(
  name: string,
  parentId: string | null
): Promise<{ id?: string; error?: string }> {
  try {
    const supabase = createSupabaseAdminClient();
    const userId = await getEffectiveUserId();

    let siblingsQuery = supabase
      .from('nav_folders')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);
    if (parentId) siblingsQuery = siblingsQuery.eq('parent_id', parentId);
    else siblingsQuery = siblingsQuery.is('parent_id', null);

    const { data: sib } = await siblingsQuery;
    const sortOrder = (sib?.[0]?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('nav_folders')
      .insert({ user_id: userId, name: name.trim(), parent_id: parentId, sort_order: sortOrder, is_open: true })
      .select('id')
      .single();

    if (error) return { error: error.message };
    return { id: data.id };
  } catch {
    return { error: 'Database unavailable' };
  }
}

export async function updateNavFolder(
  id: string,
  updates: { name?: string; isOpen?: boolean; sortOrder?: number }
): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const userId = await getEffectiveUserId();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.isOpen !== undefined) dbUpdates.is_open = updates.isOpen;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

    await supabase.from('nav_folders').update(dbUpdates).eq('id', id).eq('user_id', userId);
  } catch { /* silently fail */ }
}

export async function deleteNavFolder(id: string): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const userId = await getEffectiveUserId();

    await supabase.from('nav_item_placements').delete().eq('folder_id', id).eq('user_id', userId);
    await supabase.from('nav_folders').delete().eq('id', id).eq('user_id', userId);
  } catch { /* silently fail */ }
}

export async function moveNavItem(itemId: string, folderId: string | null): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    const userId = await getEffectiveUserId();

    if (folderId === null) {
      await supabase.from('nav_item_placements').delete().eq('user_id', userId).eq('item_id', itemId);
    } else {
      await supabase.from('nav_item_placements').upsert(
        { user_id: userId, item_id: itemId, folder_id: folderId, sort_order: 0 },
        { onConflict: 'user_id,item_id' }
      );
    }
  } catch { /* silently fail */ }
}
