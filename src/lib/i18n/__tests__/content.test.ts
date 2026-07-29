/** Translation availability must filter crawler projections, not reader UX. */

import { describe, expect, it } from 'vitest'
import { getContentI18nConfig } from '../content'

describe('getContentI18nConfig', () => {
  it('keeps authored translations and omits source-content fallbacks', async () => {
    await expect(
      getContentI18nConfig(['introduction'], {
        defaultLocale: 'en',
        locales: [
          { code: 'en', label: 'English' },
          { code: 'es', label: 'Español' },
          { code: 'fr', label: 'Français' },
        ],
      }),
    ).resolves.toEqual({
      defaultLocale: 'en',
      locales: [
        { code: 'en', label: 'English' },
        { code: 'es', label: 'Español' },
      ],
    })
  })
})
