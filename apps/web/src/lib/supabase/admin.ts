import { createClient } from '@supabase/supabase-js'
import type { Database } from '@lifestyle/db'

// Server-only admin client — bypasses RLS. Never expose to the browser.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
