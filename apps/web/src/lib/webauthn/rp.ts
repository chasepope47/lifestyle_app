// The WebAuthn Relying Party ID must be a fixed, stable value — a passkey is
// cryptographically bound to it at registration and rejected by the browser
// if a later ceremony computes a different one. Deriving it from the
// incoming request's host is NOT safe on Vercel: request.url/host can reflect
// the per-deployment internal URL rather than the public domain the user's
// browser is actually on, so it silently changes on every deploy.
function getAppUrl(): URL {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) throw new Error('NEXT_PUBLIC_APP_URL is not set')
  return new URL(url)
}

export function getRpID(): string {
  return getAppUrl().hostname
}

export function getExpectedOrigin(): string {
  return getAppUrl().origin
}
