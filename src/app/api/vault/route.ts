import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ============================================================
// POST /api/vault — Save a vault item from Chrome Extension
// Requires Authorization: Bearer <supabase_jwt> header
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, content, tags = [], sourceUrl } = body;

    if (!type || !content) {
      return NextResponse.json({ error: 'type and content are required' }, { status: 400 });
    }
    if (!['HOOK', 'STYLE'].includes(type)) {
      return NextResponse.json({ error: 'type must be HOOK or STYLE' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('vault_items')
      .insert({
        user_id: user.id,
        type,
        content,
        tags,
        source_url: sourceUrl ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('[api/vault] insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/vault — Fetch all vault items for the authenticated user
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}
