import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OpenApiDocPage } from '@/components/api/openapi-doc-page'
import { DocLayout } from '@/components/docs/doc-layout'
import { getDocEntries, getI18nConfig, getNavContext } from '@/data/docs'
import { getDocFromParams } from '@/data/get-doc'
import { getSiteUrl } from '@/lib/site-url'
import { JsonLdScript } from '@/components/seo/json-ld-script'
import { buildAgentAlternateLinks } from '@/lib/agent-discovery'
import { buildLanguageAlternates } from '@/lib/i18n-seo'
import { buildDocPageJsonLd } from '@/lib/json-ld'
import { buildOgImageUrl } from '@/lib/og'

interface PageProps {
  params: Promise<{ slug?: Array<string> }>
}

export async function generateStaticParams() {
  const docs = getDocEntries()
  return docs.map((doc) =>
    doc.slug.length ? { slug: doc.slug } : { slug: [] },
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params
  const doc = await getDocFromParams(resolved.slug)
  if (!doc) {
    return {}
  }

  const siteUrl = getSiteUrl()
  const primaryHref = doc.slug.length ? `/${doc.slug.join('/')}` : '/'
  const i18n = getI18nConfig()

  const ogImageUrl = buildOgImageUrl({
    title: doc.title,
    description: doc.description,
    group: doc.group,
  })

  const alternateLanguages = buildLanguageAlternates(siteUrl, primaryHref, i18n)

  const isNoindex = doc.noindex || doc.hidden

  return {
    title: doc.title,
    description: doc.description,
    ...(isNoindex ? { robots: { index: false, follow: false } } : {}),
    alternates: {
      canonical: `${siteUrl}${primaryHref}`,
      ...(alternateLanguages ? { languages: alternateLanguages } : {}),
      types: buildAgentAlternateLinks(primaryHref),
    },
    openGraph: {
      title: doc.title,
      description: doc.description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      url: `${siteUrl}${primaryHref}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.title,
      description: doc.description,
      images: [ogImageUrl],
    },
  }
}

export default async function DocsPage({ params }: PageProps) {
  const resolved = await params
  const doc = await getDocFromParams(resolved.slug)

  if (!doc) {
    notFound()
  }

  const siteUrl = getSiteUrl()
  const primaryHref = doc.slug.length ? `/${doc.slug.join('/')}` : '/'
  const pageUrl = `${siteUrl}${primaryHref}`
  const locale = getI18nConfig()?.defaultLocale ?? 'en'
  const nav = getNavContext(doc.id)
  const jsonLd = buildDocPageJsonLd({
    siteUrl,
    pageUrl,
    id: doc.id,
    title: doc.title,
    description: doc.description,
    keywords: doc.keywords,
    lastUpdated: doc.lastUpdated,
    locale,
    breadcrumb: nav.breadcrumb,
  })

  if (doc.openapi) {
    return <OpenApiDocPage doc={doc} jsonLd={jsonLd} />
  }

  const Content = doc.component

  return (
    <DocLayout doc={doc}>
      <JsonLdScript data={jsonLd} />
      <Content />
    </DocLayout>
  )
}
