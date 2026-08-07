import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSiteUrl, siteUrlMismatch } from '@/lib/site-url'

describe('siteUrlMismatch', () => {
  afterEach(() => {
    delete process.env.THALLY_SITE_URL
    delete process.env.DOX_SITE_URL // legacy fallback name
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.URL
    delete process.env.CF_PAGES_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    delete process.env.VERCEL_URL
    delete process.env.DEPLOY_PRIME_URL
    delete process.env.NETLIFY
    delete process.env.VERCEL
    delete process.env.CF_PAGES
    vi.unstubAllEnvs()
  })

  it('uses the canonical Netlify site URL when no explicit URL is configured', () => {
    process.env.NETLIFY = 'true'
    process.env.URL = 'https://docs.example.com/'
    expect(getSiteUrl()).toBe('https://docs.example.com')
  })

  it('refuses a local origin in a managed production build', () => {
    vi.stubEnv('NODE_ENV', 'production')
    process.env.NETLIFY = 'true'
    expect(() => getSiteUrl()).toThrow('Refusing to generate production metadata with a local site URL')
  })

  it('normalizes host-only provider URLs to HTTPS', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'docs.example.com'
    expect(getSiteUrl()).toBe('https://docs.example.com')
  })

  it('returns null when the configured host matches the request origin', () => {
    process.env.THALLY_SITE_URL = 'https://docs.example.com'
    expect(siteUrlMismatch('https://docs.example.com/anything')).toBeNull()
  })

  it('flags a mismatch between the configured host and the request origin', () => {
    process.env.THALLY_SITE_URL = 'http://localhost:3000'
    const message = siteUrlMismatch('http://localhost:3040')
    expect(message).toContain('localhost:3000')
    expect(message).toContain('localhost:3040')
    expect(message).toContain('THALLY_SITE_URL')
  })

  it('returns null for an unparseable request origin', () => {
    process.env.THALLY_SITE_URL = 'https://docs.example.com'
    expect(siteUrlMismatch('not-a-url')).toBeNull()
  })
})
