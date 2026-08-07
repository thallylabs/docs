'use client'

import dynamic from 'next/dynamic'
import type { NormalizedOperation } from '@/lib/openapi/types'

const OperationPanel = dynamic(
  () => import('@/components/api/operation-panel').then((module) => module.OperationPanel),
  {
    loading: () => (
      <div
        className="h-64 animate-pulse rounded-2xl border border-border/40 bg-muted/30"
        aria-label="Loading API operation"
      />
    ),
  },
)

export function LazyOperationPanel({ operation }: { operation: NormalizedOperation }) {
  return <OperationPanel operation={operation} />
}
