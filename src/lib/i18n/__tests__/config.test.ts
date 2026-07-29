/** Locale normalization, source-language, URL, and crawler invariants. */

import { describe, expect, it } from 'vitest'
import {
  DEFAULT_I18N_CONFIG,
  localeDirection,
  localizedPath,
  normalizeI18nConfig,
  resolveI18nSelection,
} from '../config'
import { buildLocaleAlternates } from '../metadata'

describe('runtime locale configuration', () => {
  it('canonicalizes and deduplicates live locale selections', () => {
    expect(
      normalizeI18nConfig({
        defaultLocale: 'pt-br',
        locales: [
          { code: 'en', label: 'English' },
          { code: 'PT-br', label: 'Português (Brasil)' },
          { code: 'pt-BR', label: 'Duplicate' },
        ],
      }),
    ).toEqual({
      defaultLocale: 'pt-BR',
      locales: [
        { code: 'en', label: 'English' },
        { code: 'pt-BR', label: 'Português (Brasil)' },
      ],
    })
  })

  it('keeps the repository source language as the DOM default', () => {
    expect(
      resolveI18nSelection(
        {
          defaultLocale: 'fr',
          locales: [
            { code: 'fr', label: 'Français' },
            { code: 'de', label: 'Deutsch' },
          ],
        },
        DEFAULT_I18N_CONFIG,
      ),
    ).toEqual({
      defaultLocale: 'en',
      locales: [
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
      ],
    })
  })

  it('builds locale paths, direction, and x-default metadata consistently', () => {
    expect(localizedPath('/guides/setup', 'fr', 'en')).toBe('/fr/guides/setup')
    expect(localeDirection('ar-AE')).toBe('rtl')
    expect(
      buildLocaleAlternates(
        'https://docs.example.com',
        '/guides/setup',
        DEFAULT_I18N_CONFIG,
      ),
    ).toEqual({
      en: 'https://docs.example.com/guides/setup',
      es: 'https://docs.example.com/es/guides/setup',
      'x-default': 'https://docs.example.com/guides/setup',
    })
  })
})
