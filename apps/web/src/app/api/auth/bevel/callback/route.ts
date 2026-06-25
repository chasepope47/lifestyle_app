import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(`${origin}/settings/integrations?error=bevel_no_code`)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/auth/login`)

  const bevelBase = process.env.BEVEL_API_BASE_URL ?? 'https://api.bevelhq.com/v1'

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${origin}/api/auth/bevel/callback`,
    client_id: process.env.BEVEL_CLIENT_ID!,
    client_secret: process.env.BEVEL_CLIENT_SECRET!,
  })

  const tokenRes = await fetch(`${bevelBase}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  if (!tokenRes.ok) return NextResponse.redirect(`${origin}/settings/integrations?error=bevel_token_exchange`)

  const { access_token, refresh_token, expires_in } = await tokenRes.json() as { access_token: string; refresh_token: string; expires_in: number }

  await supabase.from('integration_tokens').upsert({
    user_id: user.id,
    provider: 'bevel',
    access_token,
    refresh_token: refresh_token ?? null,
    expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
    scope: 'workouts metrics:read',
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect(`${origin}/settings/integrations?connected=bevel`)
}
