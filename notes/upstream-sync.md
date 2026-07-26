# Syncing this repository with the Thally engine

This repository is the **canonical site source**. Two things consume it:

- `npx create-thally-docs` downloads `main` as a tarball
  (`packages/create-thally-docs/src/download.ts` in `thallylabs/thally`).
- Thally Cloud provisions every managed site from it
  (`THALLY_CLOUD_GITHUB_TEMPLATE_REPO`, default `thallylabs/docs`).

Nothing here is versioned or pinned. Whatever lands on `main` reaches the next
scaffold and the next managed site immediately. That makes the relationship
with the engine repository (`thallylabs/thally`) worth writing down.

**Last engine commit reviewed for divergence: `170e204`** (2026-07-26,
"Merge pull request #36 from thallylabs/fix/interpreter-hardening").
Update this line whenever a sync pass completes.

That review covered `src/` (including `src/middleware.ts`, `src/config/`,
`src/styles/`, `src/test/`), `scripts/`, and the root config files. It did
**not** cover `packages/` — this repository tracks no package source and
consumes `@thallylabs/{core,mcp}` from npm, so engine package work reaches a
site through a release, not through this repository.

## There is deliberately no `upstream` remote

The obvious setup — add `thallylabs/thally` as `upstream` and `git merge` it
periodically — is the wrong one here, for three reasons.

1. **The histories are unrelated.** This repository starts at
   "Initial commit from create-thally-docs"; it was never a fork. A merge would
   have no common ancestor and would resolve as a wholesale overwrite.
2. **The repository shapes differ.** The engine root carries `packages/`
   (`core`, `cli`, `agent`, `migrate`, `create-thally-docs`, `mcp`), a
   `workspaces` field, and `notes/`. A site consumes those as published
   packages. Inheriting the sources would break the scaffold contract — which
   is why `create-thally-docs` strips `/packages` and `/notes/` on the way out.
3. **Divergence runs both ways.** This repository is *ahead* of the engine on
   several deliberate changes (see below). A merge from the engine would
   silently revert them, and the regressions would ship straight into every new
   site.

Sync is therefore a **manual, one-way, per-commit review**, not a merge.

## Procedure

1. Clone the engine into a scratch directory (do not add it as a remote here):

   ```bash
   git clone https://github.com/thallylabs/thally.git /tmp/thally-engine
   ```

2. List engine commits since the last reviewed SHA that touch the shared
   surface:

   ```bash
   git -C /tmp/thally-engine log --oneline --no-merges 170e204..main -- \
     src scripts next.config.ts open-next.config.ts mdx-components.tsx
   ```

   A commit that only touches `packages/` is not a template concern; it
   arrives through a published release instead.

3. Classify each commit against the divergence list below:

   - **Engine fix the template lacks** → cherry-pick by hand into a branch here.
     Apply the change, not the commit: paths match, but surrounding code often
     does not.
   - **A known intentional divergence** → skip, and extend the list below if the
     commit gives a new reason to keep the divergence.
   - **Depends on an unpublished `@thallylabs/core`** → skip. This repository
     resolves `@thallylabs/core` from npm; the engine builds it from its own
     workspace and can use unreleased APIs.

4. Verify before opening the PR:

   ```bash
   npm test && THALLY_CONTENT_SOURCE=assets npm run build:cloudflare
   ```

   The assets-source build is the managed-site render path. A change can pass
   `npm test` and still break every managed site, so both are required.

5. Update the "Last engine commit reviewed" line above in the same PR.

## Known intentional divergences

These are changes where this repository differs from the engine **on purpose**.
Do not "fix" them by porting the engine version.

### Frontmatter is parsed only through `src/lib/frontmatter.ts`

The template is **ahead of the engine** here, and the divergence is a security
fix, not a style preference. gray-matter picks its parser from the language
token on the opening delimiter, and its `javascript` engine parses with `eval`.
Content beginning with `---js` therefore executed — confirmed by running a
probe file through `npm run runtime-sources:build`, which `prebuild` invokes
inside the managed build container, where deploy credentials live.

Every call site here routes through `parseFrontmatter` / `stringifyFrontmatter`
instead of importing gray-matter directly. Do not reintroduce a bare `matter(`
call while porting an engine commit, and note that gray-matter's `language`
option does **not** close this — a language declared by the content wins over
the option, so the engines themselves must be replaced.

Until the engine ships its own version of this fix, engine commits touching
`src/data/docs.ts`, `src/lib/content/document.ts`, `src/lib/provenance.ts`,
`src/app/llms-full.txt/route.ts`, `scripts/build-runtime-sources.mts`, or
`src/lib/mdx-interpret.tsx` must be adapted onto the helper rather than copied.

### The template vendors what the engine imports from `@thallylabs/core`

The engine depends on `@thallylabs/core@^0.2.0`, built from its own workspace.
Only `0.1.0` is published, so this repository keeps local copies of
`src/lib/content/{parse,to-markdown,types}.ts`, `src/lib/embeddings/*`,
`src/lib/colors.ts`, and `src/lib/theme-vars.ts`, and keeps
`src/lib/search/{corpus,engine}.ts` as real implementations rather than
re-exports.

Publishing `core@0.2.0` will not, on its own, make this divergence go away.
`core` ships no lean subpath exports and no `sideEffects` marker, so a single
value import pulls its whole compiled `dist` — including a second copy of the
render pipeline — into the Worker bundle. That pushed fresh scaffolds past the
managed 32 MiB module budget. `src/lib/content/document.ts`, `src/mdx/rehype.ts`,
and `src/app/api/docs/[...slug]/route.ts` carry the reasoning inline. Type-only
imports from `core` are erased at build time and stay on `core`, which remains
the contract owner.

### Managed-runtime behaviour

- `src/app/api/cloud/handshake/route.ts` returns **200** with an
  `X-Thally-Cloud-Status` header where the engine returns 503. The handshake is
  an optional background connection; a 5xx surfaces as a page-load error in
  browsers and in performance audits.
- `src/app/api/brand/logo/route.ts` returns **204** with a cache header where
  the engine returns 404, so a site without an uploaded logo does not log a 404
  on every page.
- `src/app/admin/layout.tsx` renders `<CloudHandshake />`; the engine's admin
  layout does not.
- `src/app/(docs)/layout.tsx` is **not** `force-dynamic`. Assets-source content
  must render without request-bound APIs.

### SEO and i18n

`src/lib/i18n-seo.ts` (`buildLanguageAlternates`, `localizedHref`) and the
localized canonicals in the four `(docs)` route files are template-only. The
engine still inlines a narrower version of this. `src/lib/site-url.ts` is also
richer here: it resolves managed-deployment origins (`NETLIFY`, `VERCEL`,
`CF_PAGES` and their URL vars), normalizes host-only values to HTTPS, and
refuses to generate production metadata from a local origin.

`src/middleware.ts` forwards an `x-thally-locale` request header and classifies
cacheable docs pages. Neither exists in the engine.

### Initial-load performance

`src/components/api/{lazy-operation-panel,openapi-doc-page}.tsx`,
`src/components/docs/docs-chat-launcher.tsx`,
`src/components/navigation/mobile-nav-dialog.tsx`,
`src/components/search/search-dialog.tsx`, and
`src/components/ui/content-icon.tsx` exist only here. They split heavy client
work out of the first paint. The same pass removed `prefetch={false}` link
prefetching, deferred the logo probe behind an `IntersectionObserver`, gave
`useSiteName` a `'desktop'` mode, and moved the client search corpus out of the
shell. The engine renders all of it eagerly.

`src/components/api/operation-nav.tsx` keeps its method filter in `useState`.
The engine stores it in the URL with `nuqs`, which is not a dependency here and
which is why the engine's top bar wraps `CommandSearch` in `<Suspense>`.

### Content and configuration

`src/content/**`, `docs.json`, `src/data/site.ts`, `README.md`, and
`public/images/` are this site's own. The engine's copies are its own product
docs. These are never synced in either direction.

`scripts/seo-conformance.ts` exists only here, and `package.json` invokes the
scripts as `node --import tsx …` rather than bare `tsx`. Both are deliberate.

## Known engine gaps (the debt runs both ways)

Several fixes made here have not been upstreamed. Worth landing in
`thallylabs/thally` when convenient:

- The Worker bundle-size work (fine-grained Shiki grammars in
  `src/mdx/rehype.ts`, vendored content parser).
- The richer `src/lib/site-url.ts` and the `src/lib/i18n-seo.ts` extraction.
- `src/components/admin/cloud-locked-panel.tsx` reads
  "Connect the site to Thally Thally Cloud" in the engine.

## Deliberately deferred engine change

`thallylabs/thally@44aa089` ("feat: align dynamic documentation previews")
rewrites `src/lib/og.ts`, adds `src/lib/og-image.tsx`, replaces
`src/app/api/og/route.tsx`, and ships ~250 KB of font binaries under
`public/fonts/og/`. It is not ported yet because:

- it rewrites the metadata blocks in the same four `(docs)` route files where
  this repository is ahead on i18n SEO, so it needs a hand merge that preserves
  `buildLanguageAlternates`, `localizedHref`, and `openGraph.url`; and
- it hardcodes an Ink/Iris palette in place of `siteConfig.ogImage` and
  `brand.dark`, which pulls against the cloud-delivered branding this template
  now renders.

Port it as its own change, after deciding how social images should resolve
cloud-delivered brand colors.
