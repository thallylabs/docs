interface I18nConfig {
  defaultLocale: string
  locales: Array<{ code: string }>
}

export function localizedHref(href: string, locale: string, defaultLocale: string): string {
  return locale === defaultLocale ? href : `/${locale}${href}`
}

export function buildLanguageAlternates(siteUrl: string, href: string, i18n: I18nConfig | null) {
  if (!i18n) return undefined
  return {
    ...Object.fromEntries(
      i18n.locales.map(({ code }) => [code, `${siteUrl}${localizedHref(href, code, i18n.defaultLocale)}`]),
    ),
    'x-default': `${siteUrl}${href}`,
  }
}
