import type { MetadataRoute } from 'next'
import { getDocEntries } from '@/data/docs'
import { getAllApiOperationNodes } from '@/data/api-reference'

import { getRequestOrigin } from '@/lib/cloud-link/request'
import { localizedPath } from '@/lib/i18n/config'
import { getContentI18nConfig } from '@/lib/i18n/content'
import { buildLocaleAlternates } from '@/lib/i18n/metadata'
import { getEffectiveI18nConfig } from '@/lib/i18n/request'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getRequestOrigin()
  const docEntries = getDocEntries().filter(
    (doc) => !doc.hidden && !doc.noindex,
  )
  const apiNodes = await getAllApiOperationNodes()
  const i18n = await getEffectiveI18nConfig()

  const docPages: MetadataRoute.Sitemap = (
    await Promise.all(
      docEntries.map(async (doc) => {
        const availableI18n = await getContentI18nConfig(doc.slug, i18n)
        const languages = buildLocaleAlternates(
          baseUrl,
          doc.href,
          availableI18n,
        )
        return availableI18n.locales.map((locale) => ({
          url: `${baseUrl}${localizedPath(doc.href, locale.code, i18n.defaultLocale)}`,
          changeFrequency: 'weekly' as const,
          priority: doc.href === '/' ? 1.0 : 0.7,
          alternates: { languages },
          ...(doc.lastUpdated
            ? { lastModified: new Date(doc.lastUpdated) }
            : {}),
        }))
      }),
    )
  ).flat()

  // OpenAPI prose remains source-language content until operation-level
  // translations exist, so localized navigation routes are intentionally not
  // advertised as translated documents.
  const apiPages: MetadataRoute.Sitemap = apiNodes.map((node) => ({
    url: `${baseUrl}${node.href}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/changelog`,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  return Array.from(
    new Map(
      [...docPages, ...apiPages, ...staticPages].map((entry) => [
        entry.url,
        entry,
      ]),
    ).values(),
  )
}
