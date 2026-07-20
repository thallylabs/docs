import type { MetadataRoute } from 'next'
import { getDocEntries, getI18nConfig } from '@/data/docs'
import { getAllApiOperationNodes } from '@/data/api-reference'

import { getSiteUrl } from '@/lib/site-url'
import { buildLanguageAlternates, localizedHref } from '@/lib/i18n-seo'

const baseUrl = getSiteUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docEntries = getDocEntries().filter((doc) => !doc.hidden && !doc.noindex)
  const apiNodes = await getAllApiOperationNodes()
  const i18n = getI18nConfig()

  const docPages: MetadataRoute.Sitemap = docEntries.flatMap((doc) => {
    const languages = buildLanguageAlternates(baseUrl, doc.href, i18n)
    const locales = i18n?.locales ?? [{ code: i18n?.defaultLocale ?? 'en' }]
    return locales.map(({ code }) => {
      const href = localizedHref(doc.href, code, i18n?.defaultLocale ?? 'en')
      return {
        url: `${baseUrl}${href}`,
        changeFrequency: 'weekly' as const,
        priority: doc.href === '/' && code === i18n?.defaultLocale ? 1.0 : code === i18n?.defaultLocale ? 0.7 : 0.6,
        ...(doc.lastUpdated ? { lastModified: new Date(doc.lastUpdated) } : {}),
        ...(languages ? { alternates: { languages } } : {}),
      }
    })
  })

  const apiPages: MetadataRoute.Sitemap = apiNodes.flatMap((node) => {
    const languages = buildLanguageAlternates(baseUrl, node.href, i18n)
    const locales = i18n?.locales ?? [{ code: i18n?.defaultLocale ?? 'en' }]
    return locales.map(({ code }) => ({
      url: `${baseUrl}${localizedHref(node.href, code, i18n?.defaultLocale ?? 'en')}`,
      changeFrequency: 'weekly' as const,
      priority: code === i18n?.defaultLocale ? 0.6 : 0.5,
      ...(languages ? { alternates: { languages } } : {}),
    }))
  })

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/changelog`,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  return Array.from(new Map([...docPages, ...apiPages, ...staticPages].map((entry) => [entry.url, entry])).values())
}
