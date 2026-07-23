import { notFound } from 'next/navigation'
import type { DocEntry } from '@/data/docs'
import { getApiOperationByKey } from '@/data/api-reference'
import { ApiLayout } from '@/components/api/api-layout'
import { LazyOperationPanel } from '@/components/api/lazy-operation-panel'
import { DocHeader } from '@/components/docs/doc-header'
import { JsonLdScript } from '@/components/seo/json-ld-script'

interface OpenApiDocPageProps {
  doc: DocEntry
  jsonLd: Record<string, unknown>
}

export async function OpenApiDocPage({ doc, jsonLd }: OpenApiDocPageProps) {
  if (!doc.openapi) notFound()

  const operationNode = await getApiOperationByKey(
    doc.openapi.method,
    doc.openapi.path,
    doc.openapi.specId,
  )
  if (!operationNode) notFound()

  return (
    <div className="space-y-10">
      <JsonLdScript data={jsonLd} />
      <div className="not-prose">
        <DocHeader doc={doc} />
      </div>
      <ApiLayout>
        <LazyOperationPanel operation={operationNode.operation} />
      </ApiLayout>
    </div>
  )
}
