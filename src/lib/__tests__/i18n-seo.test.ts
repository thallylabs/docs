import { describe, expect, it } from 'vitest'
import { buildLanguageAlternates, localizedHref } from '@/lib/i18n-seo'

const i18n = {
  defaultLocale: 'en',
  locales: [{ code: 'en' }, { code: 'es' }],
}

describe('i18n SEO helpers', () => {
  it('keeps the default locale unprefixed and prefixes secondary locales', () => {
    expect(localizedHref('/quickstart', 'en', 'en')).toBe('/quickstart')
    expect(localizedHref('/quickstart', 'es', 'en')).toBe('/es/quickstart')
  })

  it('emits reciprocal locale alternates and an x-default URL', () => {
    expect(buildLanguageAlternates('https://docs.example.com', '/quickstart', i18n)).toEqual({
      en: 'https://docs.example.com/quickstart',
      es: 'https://docs.example.com/es/quickstart',
      'x-default': 'https://docs.example.com/quickstart',
    })
  })
})
