import matter from 'gray-matter'
import { parseMdxContent } from '@/lib/content/parse'
import type { ParsedContent } from '@/lib/content/types'
import {
  readRuntimeSource,
  runtimeSourceExists,
  runtimeSourceModifiedAt,
} from '@/lib/runtime-sources'

const CONTENT_ROOT = 'src/content'

export interface ContentDocument {
  pageId: string
  frontmatter: Record<string, unknown>
  /** Raw markdown body with frontmatter removed. */
  rawBody: string
  content: ParsedContent
}

function resolveContentFile(pageId: string, locale?: string): string | null {
  const candidates: Array<string> = []
  if (locale) {
    candidates.push(
      `${CONTENT_ROOT}/${locale}/${pageId}.mdx`,
      `${CONTENT_ROOT}/${locale}/${pageId}/index.mdx`,
    )
  }
  candidates.push(
    `${CONTENT_ROOT}/${pageId}.mdx`,
    `${CONTENT_ROOT}/${pageId}/index.mdx`,
  )

  for (const filePath of candidates) {
    if (runtimeSourceExists(filePath)) return filePath
  }
  return null
}

// Cache keyed by file path + mtime so unchanged files are parsed only once.
const documentCache = new Map<string, { mtimeMs: number; document: ContentDocument }>()

/**
 * Read and parse a content document into the typed content graph. This is the
 * single entry point the agent API, JSON-LD, search index, and (future)
 * embeddings should use — no ad-hoc regex extraction anywhere else.
 */
export function getContentDocument(pageId: string, locale?: string): ContentDocument | null {
  const filePath = resolveContentFile(pageId, locale)
  if (!filePath) return null

  const modifiedAtMs = runtimeSourceModifiedAt(filePath)
  const cacheKey = filePath
  const cached = documentCache.get(cacheKey)
  if (cached && cached.mtimeMs === modifiedAtMs) {
    return cached.document
  }

  const raw = readRuntimeSource(filePath)
  const { data, content } = matter(raw)
  const document: ContentDocument = {
    pageId,
    frontmatter: data,
    rawBody: content,
    content: parseMdxContent(content),
  }

  documentCache.set(cacheKey, { mtimeMs: modifiedAtMs, document })
  return document
}
