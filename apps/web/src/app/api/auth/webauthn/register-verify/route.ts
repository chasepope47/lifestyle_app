import { NextResponse, type NextRequest } from 'next/server'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAndExtractChallenge, CHALLENGE_COOKIE, CHALLENGE_COOKIE_OPTIONS } from '@/lib/webauthn/challenge'
import { getRpID, getExpectedOrigin } from '@/lib/webauthn/rp'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Retrieve and validate the challenge from the signed cookie
  const signed = request.cookies.get(CHALLENGE_COOKIE)?.value
  if (!signed) {
    return NextResponse.json({ error: 'No challenge found — please try again' }, { status: 400 })
  }
  const challenge = verifyAndExtractChallenge(signed)
  if (!challenge) {
    return NextResponse.json({ error: 'Challenge signature invalid' }, { status: 400 })
  }

  const body = await request.json()
  let origin: string
  let rpID: string
  try {
    origin = getExpectedOrigin()
    rpID = getRpID()
  } catch {
    return NextResponse.json(
      { error: 'Server not configured for passkeys (NEXT_PUBLIC_APP_URL missing). Please contact the app owner.' },
      { status: 500 }
    )
  }

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    })
  } catch (err) {
    return NextResponse.json({ error: `WebAuthn error: ${String(err)}` }, { status: 400 })
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Passkey verification failed' }, { status: 400 })
  }

  const { credential } = verification.registrationInfo

  const { error: insertError } = await supabase.from('webauthn_credentials').insert({
    user_id: user.id,
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString('base64'),
    counter: credential.counter,
    transports: credential.transports ? JSON.stringify(credential.transports) : null,
    backed_up: verification.registrationInfo.credentialBackedUp,
    device_name: body.deviceName ?? 'Unknown device',
  })

  if (insertError) {
    // Most likely cause: migration hasn't been run yet
    return NextResponse.json(
      { error: `Could not save passkey: ${insertError.message}` },
      { status: 500 }
    )
  }

  // Clear the challenge cookie
  const res = NextResponse.json({ verified: true })
  res.cookies.set(CHALLENGE_COOKIE, '', { ...CHALLENGE_COOKIE_OPTIONS, maxAge: 0 })
  return res
}
