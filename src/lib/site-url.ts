const DEFAULT_SITE_URL = 'http://localhost:3040'

const MANAGED_DEPLOYMENT_ENV_VARS = ['NETLIFY', 'VERCEL', 'CF_PAGES'] as const

function normalizeSiteUrl(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  const parsed = new URL(withProtocol)
  return parsed.origin
}

function isLocalUrl(value: string): boolean {
  const hostname = new URL(value).hostname
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

/**
 * The canonical site URL. Users configure this with the framework-agnostic
 * `THALLY_SITE_URL` env var — they never need to know Next.js is underneath.
 *
 * Falls back to the legacy `NEXT_PUBLIC_SITE_URL` for backward compatibility,
 * then to the local dev URL.
 */
export function getSiteUrl(): string {
  const configured =
    process.env.THALLY_SITE_URL ??
    process.env.DOX_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NETLIFY ? process.env.URL : undefined) ??
    process.env.CF_PAGES_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    process.env.DEPLOY_PRIME_URL ??
    DEFAULT_SITE_URL
  const siteUrl = normalizeSiteUrl(configured)

  const isManagedProductionBuild =
    process.env.NODE_ENV === 'production' && MANAGED_DEPLOYMENT_ENV_VARS.some((name) => Boolean(process.env[name]))
  if (isManagedProductionBuild && isLocalUrl(siteUrl)) {
    throw new Error(
      'Refusing to generate production metadata with a local site URL. Set THALLY_SITE_URL to the public docs origin.',
    )
  }

  return siteUrl
}

let warnedMismatch = false

/**
 * Guard against a stale `THALLY_SITE_URL`: when the configured site-URL host does
 * not match the origin a request actually arrived on, every absolute link in
 * llms.txt / sitemap.xml / JSON-LD points at the configured host — which may be
 * unreachable (the classic "all agent links are dead" misconfiguration). Warns
 * once per process and returns a message when they differ, else null, so a
 * route can also surface it (e.g. as a response header).
 */
export function siteUrlMismatch(requestOrigin: string): string | null {
  let configuredHost: string
  let requestHost: string
  try {
    configuredHost = new URL(getSiteUrl()).host
    requestHost = new URL(requestOrigin).host
  } catch {
    return null
  }
  if (!requestHost || configuredHost === requestHost) return null
  const message = `Configured site URL host (${configuredHost}) does not match the request origin (${requestHost}); absolute links in llms.txt, sitemap.xml, and JSON-LD point at ${configuredHost}, which may be unreachable. Set THALLY_SITE_URL to your real origin.`
  if (!warnedMismatch) {
    warnedMismatch = true
    console.warn(`[thally] ${message}`)
  }
  return message
}
