'use client'
import { createClient } from '@supabase/supabase-js'

// Browser client — anon key, safe to ship. RLS keeps it read-only on `pieces`;
// all writes go through the security-definer RPCs.
// Fallbacks keep build/prerender from crashing before .env.local is set; the app
// just shows an empty grid until the real Supabase project is configured.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && typeof window !== 'undefined') {
  console.warn('[MOGI] Supabase env not set — copy .env.example to .env.local and fill it in.')
}

export const supabase = createClient(url, anon)
