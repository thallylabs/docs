/** Regression coverage for locale propagation during Next.js client navigation. */

import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import docsNavigationConfig from '../../../docs.json' assert { type: 'json' }
import type { DocsJsonConfig } from '@/data/docs'

vi.mock('@/lib/admin/auth-edge', () => ({
  ADMIN_SESSION_COOKIE: 'admin-session',
  DOCS_ACCESS_COOKIE: 'docs-access',
  getInternalAnalyticsSecretEdge: () => 'analytics-secret',
  isAdminAuthenticatedEdge: vi.fn().mockResolvedValue(false),
  isAdminEnabledEdge: vi.fn().mockReturnValue(false),
  isDocsAccessEnabledEdge: vi.fn().mockReturnValue(false),
  isDocsAccessGrantedEdge: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/auth/session', () => ({
  SESSION_COOKIE: 'session',
  verifySession: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/traffic-classifier', () => ({
  classifyRequest: vi.fn().mockReturnValue({ visitorType: 'human', format: 'html' }),
  isAgentRequest: vi.fn().mockReturnValue(false),
}))

vi.mock('@/lib/agent-endpoints', () => ({
  isMachineEndpoint: vi.fn().mockReturnValue(false),
  isPublicAgentEndpoint: vi.fn().mockReturnValue(false),
}))

vi.mock('@/lib/cloud-link/edge', () => ({
  getCloudAccessConfigEdge: vi.fn().mockResolvedValue(null),
}))

import { middleware } from '@/middleware'

const configuredI18n = (docsNavigationConfig as DocsJsonConfig).i18n
const defaultLocale = configuredI18n?.defaultLocale ?? 'en'
const navigationLocale = configuredI18n?.locales
  .find(({ code }) => code !== defaultLocale)?.code ?? defaultLocale
const localizedPath = navigationLocale === defaultLocale
  ? '/quickstart'
  : `/${navigationLocale}/quickstart`

describe('localized RSC navigation middleware', () => {
  it.each(['rsc', 'next-router-state-tree', 'next-router-prefetch'])(
    'passes through %s requests with the locale headers intact',
    async (navigationHeader) => {
      const request = new NextRequest(`https://docs.example.com${localizedPath}`, {
        headers: { [navigationHeader]: '1' },
      })
      const response = await middleware(request, { waitUntil: vi.fn() } as never)

      expect(response.headers.get('x-middleware-next')).toBe('1')
      expect(response.headers.get('x-middleware-rewrite')).toBeNull()
      expect(response.headers.get('x-middleware-request-x-thally-locale')).toBe(navigationLocale)
      expect(response.headers.get('content-language')).toBe(navigationLocale)
    },
  )
})
