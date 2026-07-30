import { notFound } from 'next/navigation'
import { DocLayout } from '@/components/docs/doc-layout'
import { getDocFromParams } from '@/data/get-doc'
import { getRequestOrigin } from '@/lib/cloud-link/request'

export async function generateMetadata() {
  const doc = await getDocFromParams(['changelog'])
  if (!doc) return {}
  const siteUrl = await getRequestOrigin()
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `${siteUrl}${doc.href}` },
  }
}

export default async function ChangelogPage() {
  const doc = await getDocFromParams(['changelog'])
  if (!doc) notFound()

  const Content = doc.component
  return (
    <DocLayout doc={doc}>
      <Content />
    </DocLayout>
  )
}
