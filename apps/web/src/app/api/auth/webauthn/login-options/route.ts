import { NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const admin = createAdminClient()
  const rpID = new URL(request.url).hostname

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    // No allowCredentials = discoverable credential flow (browser picks the right passkey)
  })

  // Clean up expired challenges then store this one (user_id null until we know who's logging in)
  await admin.from('webauthn_challenges').delete().lt('expires_at', new Date().toISOString())
  await admin.from('webauthn_challenges').insert({
    user_id: null,
    challenge: options.challenge,
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  })

  return NextResponse.json(options)
}
