import { createClient } from '@supabase/supabase-js'

// Server-only client — service-role key bypasses RLS. NEVER import this from a
// client component; it must only run in route handlers (app/api/**).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key',
  { auth: { persistSession: false } }
)
