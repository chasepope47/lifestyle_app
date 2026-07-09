import { NextResponse, type NextRequest } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAndExtractChallenge, CHALLENGE_COOKIE, CHALLENGE_COOKIE_OPTIONS } from '@/lib/webauthn/challenge'
import { getRpID, getExpectedOrigin } from '@/lib/webauthn/rp'

export async function POST(request: NextRequest) {
  // Retrieve and validate the challenge
  const signed = request.cookies.get(CHALLENGE_COOKIE)?.value
  if (!signed) {
    return NextResponse.json({ error: 'No challenge found — please try again' }, { status: 400 })
  }
  const challenge = verifyAndExtractChallenge(signed)
  if (!challenge) {
    return NextResponse.json({ error: 'Challenge signature invalid' }, { status: 400 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json(
      { error: 'Server not configured for passkey login. Please contact the app owner.' },
      { status: 500 }
    )
  }

  const body = await request.json()
  const credentialId: string = body.id
  const origin = getExpectedOrigin()
  const rpID = getRpID()

  // Look up the stored credential by credential_id
  const { data: cred, error: credError } = await admin
    .from('webauthn_credentials')
    .select('*')
    .eq('credential_id', credentialId)
    .single()

  if (credError || !cred) {
    return NextResponse.json({ error: 'Passkey not recognized on this device' }, { status: 400 })
  }

  const publicKeyBytes = Buffer.from(cred.public_key, 'base64')

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: new Uint8Array(publicKeyBytes),
        counter: cred.counter,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: `WebAuthn error: ${String(err)}` }, { status: 400 })
  }

  if (!verification.verified) {
    return NextResponse.json({ error: 'Passkey verification failed' }, { status: 401 })
  }

  // Update counter and last used timestamp
  await admin
    .from('webauthn_credentials')
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('credential_id', credentialId)

  // Get the user's email so we can sign them in
  const { data: { user }, error: userError } = await admin.auth.admin.getUserById(cred.user_id)
  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Could not find user account' }, { status: 500 })
  }

  // Generate a magic link OTP — admin.generateLink does NOT send an email
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  })

  if (linkError || !linkData?.properties?.email_otp) {
    return NextResponse.json({ error: 'Could not create login session' }, { status: 500 })
  }

  const res = NextResponse.json({
    verified: true,
    email: user.email,
    otp: linkData.properties.email_otp,
  })
  // Clear the challenge cookie
  res.cookies.set(CHALLENGE_COOKIE, '', { ...CHALLENGE_COOKIE_OPTIONS, maxAge: 0 })
  return res
}
