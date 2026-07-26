/**
 * The one safe way to read frontmatter out of customer-authored content.
 *
 * gray-matter dispatches on the language token of the opening delimiter, so
 * `---js` selects an engine whose parser is literally `eval`. Content arrives
 * from customer repositories and is parsed both at request time and during
 * `prebuild` inside the managed build container — which holds deploy
 * credentials — so a defaulted `matter()` call is a code-execution sink, not a
 * formatting quirk.
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

export const FRONTMATTER_OPTIONS = { engines: SAFE_ENGINES } as const

/**
 * Parse frontmatter without any code execution. Same shape gray-matter
 * returns, so this is a drop-in replacement for `matter(raw)`.
 */
export function parseFrontmatter(raw: string): matter.GrayMatterFile<string> {
  return matter(raw, FRONTMATTER_OPTIONS)
}
