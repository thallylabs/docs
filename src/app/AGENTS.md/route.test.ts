/** Request-bound and asset-aware behavior for the public AGENTS.md endpoint. */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  resolveRequestSiteConfig: vi.fn(),
}))

vi.mock('@/lib/content-source', () => ({
  getContentSource: () => ({ read: mocks.read }),
}))

vi.mock('@/lib/site-config', () => ({
  resolveRequestSiteConfig: mocks.resolveRequestSiteConfig,
  siteIdentity: (config: unknown) => config,
}))

import { GET } from './route'

describe('GET /AGENTS.md', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveRequestSiteConfig.mockResolvedValue({
      name: 'Launch Sentinel',
      description: 'Sentinel documentation',
      repoUrl: 'https://github.com/acme/launch-sentinel',
      links: [],
    })
  })

  it('serves the active content-source override before the generated manifest', async () => {
    mocks.read.mockResolvedValue({
      content: '# Customer AGENTS.md\n',
      modifiedAtMs: 1,
    })

    const response = await GET(new Request('https://sentinel.example.com/AGENTS.md'))

    expect(mocks.read).toHaveBeenCalledWith('AGENTS.md')
    expect(await response.text()).toBe('# Customer AGENTS.md\n')
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('cache-control')).toBeNull()
  })

  it('generates identity-aware guidance when no active-source override exists', async () => {
    mocks.read.mockResolvedValue(null)

    const response = await GET(new Request('https://sentinel.example.com/AGENTS.md'))
    const manifest = await response.text()

    expect(manifest).toContain('Launch Sentinel')
    expect(manifest).toContain('https://sentinel.example.com/llms.txt')
    expect(manifest).not.toContain('Bench Three')
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    )
  })
})
