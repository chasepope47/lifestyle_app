import { NextResponse } from 'next/server'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { signChallenge, CHALLENGE_COOKIE, CHALLENGE_COOKIE_OPTIONS } from '@/lib/webauthn/challenge'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch existing credentials so the browser excludes already-registered devices
  const { data: existing } = await supabase
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', user.id)

  const rpID = new URL(request.url).hostname

  const options = await generateRegistrationOptions({
    rpName: 'Together',
    rpID,
    userName: user.email!,
    userDisplayName: user.email!,
    attestationType: 'none',
    excludeCredentials: (existing ?? []).map(c => ({
      id: c.credential_id,
      transports: c.transports ? JSON.parse(c.transports) : undefined,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  // Store challenge in a signed HTTP-only cookie — no DB table needed
  const signed = signChallenge(options.challenge)
  const res = NextResponse.json(options)
  res.cookies.set(CHALLENGE_COOKIE, signed, CHALLENGE_COOKIE_OPTIONS)
  return res
}
