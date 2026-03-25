import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ============================================================
// Server-side Supabase client — uses cookies for session
// Use in Server Components and Server Actions
// ============================================================

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies can't be set (safe to ignore)
          }
        },
      },
    }
  );
}

// Admin client — uses service role key, bypasses RLS
// ONLY use in trusted server-side code, never expose to client
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ============================================================
// Single-user mode — fixed owner UUID (no login required)
// All data is scoped to this ID. Replace with auth.getUser()
// if multi-user auth is added later.
// ============================================================
export const OWNER_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export async function getEffectiveUserId(): Promise<string> {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch { /* no session */ }
  return OWNER_USER_ID;
}
