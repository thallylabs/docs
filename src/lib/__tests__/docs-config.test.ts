/**
 * `docs.json` must be overridable at runtime, and must never blank a site.
 *
 * The compiled copy used to be the only source, which made navigation part of
 * the bundle: a navigation change forced a full rebuild, and one prebuilt
 * artifact could not serve two sites. The override is what removes both
 * limits — but a bad binding must degrade to the compiled copy rather than
 * serving a site with no navigation at all.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDocsJsonConfig, resetDocsJsonConfigForTests } from '@/lib/docs-config'

const ORIGINAL = process.env.THALLY_DOCS_CONFIG

beforeEach(() => {
  resetDocsJsonConfigForTests()
  delete process.env.THALLY_DOCS_CONFIG
})

afterEach(() => {
  resetDocsJsonConfigForTests()
  if (ORIGINAL === undefined) delete process.env.THALLY_DOCS_CONFIG
  else process.env.THALLY_DOCS_CONFIG = ORIGINAL
})

describe('getDocsJsonConfig', () => {
  it('uses the compiled docs.json when nothing is injected', () => {
    const config = getDocsJsonConfig() as Record<string, unknown>
    expect(config).toBeTypeOf('object')
    expect(config).not.toBeNull()
  })

  it('prefers an injected configuration', () => {
    process.env.THALLY_DOCS_CONFIG = JSON.stringify({
      theme: 'sharp',
      navbar: { links: [{ label: 'Injected', href: '/injected' }] },
    })
    const config = getDocsJsonConfig() as { navbar?: { links?: Array<{ label: string }> } }
    expect(config.navbar?.links?.[0]?.label).toBe('Injected')
  })

  it('falls back to the compiled copy when the binding is not valid JSON', () => {
    process.env.THALLY_DOCS_CONFIG = '{ this is not json'
    const config = getDocsJsonConfig() as Record<string, unknown>
    expect(config).toBeTypeOf('object')
    expect(Object.keys(config).length).toBeGreaterThan(0)
  })

  it('falls back when the binding parses to a non-object', () => {
    process.env.THALLY_DOCS_CONFIG = '["not", "an", "object"]'
    const config = getDocsJsonConfig() as Record<string, unknown>
    expect(Array.isArray(config)).toBe(false)
    expect(Object.keys(config).length).toBeGreaterThan(0)
  })

  it('memoizes so a release cannot change configuration mid-isolate', () => {
    process.env.THALLY_DOCS_CONFIG = JSON.stringify({ theme: 'first' })
    const first = getDocsJsonConfig() as { theme?: string }
    process.env.THALLY_DOCS_CONFIG = JSON.stringify({ theme: 'second' })
    const second = getDocsJsonConfig() as { theme?: string }
    expect(first.theme).toBe('first')
    expect(second.theme).toBe('first')
  })
})
