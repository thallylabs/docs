/** Cloud portable configuration must drive the reader-facing locale menu. */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getCloudConfig } = vi.hoisted(() => ({
  getCloudConfig: vi.fn(),
}))

vi.mock('@/data/docs', () => ({
  getI18nConfig: () => ({
    defaultLocale: 'en',
    locales: [
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
    ],
  }),
}))
vi.mock('@/lib/admin/settings', () => ({
  getAdminSettings: vi.fn().mockResolvedValue({ localization: null }),
}))
vi.mock('@/lib/cloud-link/request', () => ({
  getRequestCloudSiteConfig: getCloudConfig,
}))

describe('getEffectiveI18nConfig', () => {
  beforeEach(() => {
    getCloudConfig.mockResolvedValue({
      siteConfig: {
        portable: {
          localization: {
            defaultLocale: 'en',
            locales: [
              { code: 'en', label: 'English' },
              { code: 'es', label: 'Español' },
              { code: 'fr', label: 'Français' },
              { code: 'de', label: 'Deutsch' },
              { code: 'pt', label: 'Português' },
            ],
          },
        },
      },
    })
  })

  it('uses the Cloud selection while pinning the repository source default', async () => {
    const { getEffectiveI18nConfig } = await import('../request')
    await expect(getEffectiveI18nConfig()).resolves.toMatchObject({
      defaultLocale: 'en',
      locales: [
        { code: 'en' },
        { code: 'es' },
        { code: 'fr' },
        { code: 'de' },
        { code: 'pt' },
      ],
    })
  })
})
