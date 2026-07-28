/**
 * Resolve `docs.json` at runtime, falling back to the copy the build compiled.
 *
 * `docs.json` carries navigation, theme, navbar, i18n locales and feature
 * toggles. It used to reach the app only through a static import, which made it
 * part of the compiled bundle — so changing a site's navigation required a full
 * rebuild, and one prebuilt artifact could never serve two sites with different
 * navigation.
 *
 * Managed deployments now inject the site's `docs.json` as the
 * `THALLY_DOCS_CONFIG` binding, exactly as they already inject site identity
 * through `THALLY_CLOUD_SITE_CONFIG`. Nothing else changes: this stays
 * synchronous, so the ~30 exported helpers that read the config keep their
 * signatures and their callers are untouched.
 *
 * Self-hosted and open-source deployments set nothing and keep the compiled
 * copy, which is the file in the repository — identical behaviour to before.
 */
import compiledDocsConfig from '../../docs.json' assert { type: 'json' }

/** Parsed once per isolate; the binding cannot change without a new release. */
let resolved: unknown = null

export function getDocsJsonConfig(): unknown {
  if (resolved !== null) return resolved

  const injected = process.env.THALLY_DOCS_CONFIG?.trim()
  if (injected) {
    try {
      const parsed: unknown = JSON.parse(injected)
      // A malformed binding must never blank a site's navigation: fall through
      // to the compiled copy rather than serving an empty shell.
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        resolved = parsed
        return resolved
      }
      console.warn('THALLY_DOCS_CONFIG is not a JSON object; using the built-in docs.json.')
    } catch {
      console.warn('THALLY_DOCS_CONFIG could not be parsed; using the built-in docs.json.')
    }
  }

  resolved = compiledDocsConfig
  return resolved
}

/** Clear the memo between tests. */
export function resetDocsJsonConfigForTests(): void {
  resolved = null
}
