/**
 * Frontmatter parsing must never execute content.
 *
 * gray-matter selects a parser from the opening delimiter's language token,
 * and its javascript engine is `eval`. Customer content is parsed at request
 * time and during `prebuild` inside the managed build container, so a
 * regression here is remote code execution, not a formatting bug.
 */

import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from '@/lib/frontmatter'

describe('parseFrontmatter', () => {
  it('reads ordinary YAML frontmatter', () => {
    const { data, content } = parseFrontmatter('---\ntitle: Hello\n---\n\nBody.')
    expect(data.title).toBe('Hello')
    expect(content.trim()).toBe('Body.')
  })

  it('does not execute a javascript frontmatter block', () => {
    const marker = '__frontmatter_execution_probe__'
    const globals = globalThis as unknown as Record<string, unknown>
    delete globals[marker]

    const { data } = parseFrontmatter(
      `---js\n{ title: ((globalThis['${marker}'] = 'executed'), 'Owned') }\n---\n\nBody.`,
    )

    expect(globals[marker]).toBeUndefined()
    expect(data.title).not.toBe('Owned')
  })

  it('does not execute an explicitly named javascript engine block', () => {
    const marker = '__frontmatter_execution_probe_alias__'
    const globals = globalThis as unknown as Record<string, unknown>
    delete globals[marker]

    parseFrontmatter(
      `---javascript\n{ title: ((globalThis['${marker}'] = 'executed'), 'Owned') }\n---\n\nBody.`,
    )

    expect(globals[marker]).toBeUndefined()
  })

  it('leaves content without frontmatter untouched', () => {
    const raw = '# Just a heading\n\nNo frontmatter here.'
    const { data, content } = parseFrontmatter(raw)
    expect(data).toEqual({})
    expect(content).toBe(raw)
  })
})
