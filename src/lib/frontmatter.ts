/**
 * The one safe way to read frontmatter out of customer-authored content.
 *
 * gray-matter dispatches on the language token of the opening delimiter, so
 * `---js` selects an engine whose parser is literally `eval`. Content arrives
 * from customer repositories and is parsed at request time and during
 * `prebuild`, so a defaulted `matter()` call executes authored content rather
 * than reading it.
 *
 * Where that lands depends on who runs the build. Sites built in their own CI
 * run it beside whatever credentials that pipeline holds. Thally's managed
 * builder is sandboxed — a fixed credential-free environment and a three-host
 * egress allowlist — so there the exposure is the site's own npm/`.next` cache
 * backup, which later builds of that site restore and trust, giving one
 * crafted commit persistence across builds.
 *
 * Note that `{ language: 'yaml' }` does NOT close this: a language declared by
 * the content wins over the option. The engines themselves must be replaced.
 * Every call site parsing untrusted content must use this module rather than
 * importing gray-matter directly.
 */
import matter from 'gray-matter'

/** Engine overrides that make a declared `js`/`javascript` block inert. */
const SAFE_ENGINES = {
  javascript: () => ({}),
  js: () => ({}),
} as const

const FRONTMATTER_OPTIONS = { engines: SAFE_ENGINES } as const

/**
 * Parse frontmatter without any code execution. Same shape gray-matter
 * returns, so this is a drop-in replacement for `matter(raw)`.
 */
export function parseFrontmatter(raw: string): matter.GrayMatterFile<string> {
  return matter(raw, FRONTMATTER_OPTIONS)
}

/** Serialize a document back to YAML frontmatter plus body. */
export function stringifyFrontmatter(content: string, data: Record<string, unknown>): string {
  return matter.stringify(content, data)
}
