'use client'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Heart, Fingerprint } from 'lucide-react'

function LoginPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [passkeyAvailable, setPasskeyAvailable] = useState(false)
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false)
  const [registeringPasskey, setRegisteringPasskey] = useState(false)
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)

  useEffect(() => {
    // Check if the browser supports WebAuthn passkeys
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then(available => setPasskeyAvailable(available))
        .catch(() => setPasskeyAvailable(false))
    }
  }, [])

  const signInWithPasskey = async () => {
    setPasskeyLoading(true)
    setError(null)
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser')

      const optionsRes = await fetch('/api/auth/webauthn/login-options', { method: 'POST' })
      if (!optionsRes.ok) throw new Error('Failed to get passkey options')
      const options = await optionsRes.json()

      const authentication = await startAuthentication({ optionsJSON: options })

      const verifyRes = await fetch('/api/auth/webauthn/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authentication),
      })

      if (!verifyRes.ok) {
        const data = await verifyRes.json()
        throw new Error(data.error ?? 'Passkey verification failed')
      }

      const { email: userEmail, otp } = await verifyRes.json()

      // Exchange the OTP for a Supabase session (no email sent — admin-generated)
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otp,
        type: 'email',
      })

      if (otpError) throw new Error(otpError.message)

      router.push(params.get('redirectTo') ?? '/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // User cancellation is not an error worth surfacing
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('abort')) {
        setError(msg)
      }
    } finally {
      setPasskeyLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // After successful password login, offer passkey registration if not already set up
    if (passkeyAvailable && data.user) {
      setLoggedInEmail(data.user.email ?? null)
      setShowPasskeyPrompt(true)
      setLoading(false)
      return
    }

    router.push(params.get('redirectTo') ?? '/dashboard')
  }

  const registerPasskey = async () => {
    setRegisteringPasskey(true)
    try {
      const { startRegistration } = await import('@simplewebauthn/browser')

      const optionsRes = await fetch('/api/auth/webauthn/register-options', { method: 'POST' })
      if (!optionsRes.ok) throw new Error('Failed to get registration options')
      const options = await optionsRes.json()

      const registration = await startRegistration({ optionsJSON: options })

      // Include a human-readable device name
      const deviceName = navigator.platform || 'Unknown device'

      const verifyRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...registration, deviceName }),
      })

      if (!verifyRes.ok) throw new Error('Failed to register passkey')

      router.push(params.get('redirectTo') ?? '/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('abort')) {
        setError(msg)
      }
      // Still redirect even if passkey registration fails/is cancelled
      router.push(params.get('redirectTo') ?? '/dashboard')
    } finally {
      setRegisteringPasskey(false)
    }
  }

  // ── Passkey registration prompt (shown after successful password sign-in) ──
  if (showPasskeyPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Heart className="w-6 h-6 text-rose-500" />
            <span className="text-xl font-bold text-stone-900 dark:text-stone-50">Together</span>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-rose-500" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 text-center mb-1">
              Sign in faster next time
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-6">
              Save a passkey for {loggedInEmail} so you can sign in with Face ID, Touch ID, or your fingerprint — no password needed.
            </p>

            {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4 text-center">{error}</p>}

            <button
              onClick={registerPasskey}
              disabled={registeringPasskey}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
            >
              {registeringPasskey ? 'Setting up…' : 'Set up passkey'}
            </button>

            <button
              onClick={() => router.push(params.get('redirectTo') ?? '/dashboard')}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main login form ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-6 h-6 text-rose-500" />
          <span className="text-xl font-bold text-stone-900 dark:text-stone-50">Together</span>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">Sign in</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Access your account to continue</p>

          {/* Passkey / biometrics button */}
          {passkeyAvailable && (
            <button
              onClick={signInWithPasskey}
              disabled={passkeyLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-medium text-sm hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              <Fingerprint className="w-4 h-4 text-rose-500" />
              {passkeyLoading ? 'Verifying…' : 'Sign in with Face ID / Fingerprint'}
            </button>
          )}

          {passkeyAvailable && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              <span className="text-xs text-stone-400">or sign in with password</span>
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-rose-500 hover:text-rose-600 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
