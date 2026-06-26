import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.json()
  const admin = createAdminClient()
  const origin = new URL(request.url).origin
  const rpID = new URL(request.url).hostname

  const credentialId: string = body.id

  // Look up the stored credential
  const { data: cred } = await admin
    .from('webauthn_credentials')
    .select('*')
    .eq('credential_id', credentialId)
    .single()

  if (!cred) return NextResponse.json({ error: 'Credential not found' }, { status: 400 })

  // Find the most recent unexpired challenge (user_id is null for login challenges)
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('id, challenge, expires_at')
    .is('user_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!challengeRow || new Date(challengeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 })
  }

  const publicKeyBytes = Buffer.from(cred.public_key, 'base64')

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challengeRow.challenge,
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
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  if (!verification.verified) {
    return NextResponse.json({ verified: false }, { status: 401 })
  }

  // Update counter and last_used_at
  await admin
    .from('webauthn_credentials')
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('credential_id', credentialId)

  // Clean up the used challenge
  await admin.from('webauthn_challenges').delete().eq('id', challengeRow.id)

  // Generate a magic link OTP for the user — admin.generateLink does NOT send an email
  const { data: { user } } = await admin.auth.admin.getUserById(cred.user_id)
  if (!user?.email) return NextResponse.json({ error: 'User not found' }, { status: 500 })

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  })

  if (linkError || !linkData?.properties?.email_otp) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({
    verified: true,
    email: user.email,
    otp: linkData.properties.email_otp,
  })
}
