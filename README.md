# Thally

**Every product change. Every knowledge surface. Automatically in sync.**

Thally is the product-knowledge pipeline for software teams. It starts with
documentation: connect product repositories, identify the customer-facing
knowledge a change affects, and turn that work into evidence-backed pull
requests for people to review.

This repository is the open documentation surface: self-hosted, extensible, and
free to commercialize. Every page is served to humans as pre-rendered HTML and
to agents as structured JSON, JSON-LD, and Markdown from the same URL.

## Features

- **MDX content** — write docs in Markdown with React components
- **Unified content engine** — each page is parsed once into a typed content graph; HTML, JSON, JSON-LD, Markdown, search, and embeddings are projections of that single source of truth
- **Auto-generated API reference** — drop in an OpenAPI spec and get interactive docs with a "Try It" console
- **Sidebar & tabs** — configured from a single `docs.json` file
- **Hybrid search** — instant client-side command palette plus a server-side full-text + vector `/api/search`
- **Retrieval-grounded AI chat** — cited Q&A through a verified Thally Cloud entitlement; local authoring and migration tools can use an owner-supplied model key when explicitly configured
- **Agent endpoints** — `/llms.txt`, `/ai.txt`, `/api/docs-index`, `/api/docs/{slug}`, and an **Agent Readiness Score** at `/api/agent-readiness`
- **Remote MCP server** — every deployed site is an MCP endpoint at `/api/mcp`; attach with `claude mcp add --transport http <site>/api/mcp`
- **Docs agent** — `thally agent "…"` (or `@thally` on a product PR) drafts docs as a **reviewed pull request**, self-checked with `thally check`; it never merges
- **Provenance & drift** — machine-legible `lastVerified` dates + `thally check --drift` to catch pages stale against the code they document
- **Team accounts & roles** — Google/Microsoft OIDC sign-in + Owner/Editor/Viewer from a git-committed roster in `docs.json` (no database, no per-seat)
- **Unified `thally` CLI + `@thallylabs/mcp`** — one toolchain to scaffold, develop, deploy, check, and drive your docs from any MCP client
- **TOC, dark mode, responsive** — built-in with zero config; persistent sidebar, mobile drawer, command palette
- **Syntax highlighting** — Shiki with CSS variables for theme-aware code blocks

## Quick Start

```bash
# Scaffold a new project (recommended)
npx create-thally-docs my-docs
cd my-docs
npm run dev
```

Open [http://localhost:3040](http://localhost:3040). If port 3040 is already
taken, the dev server falls back to the next free port and prints the URL it
started on.

## How the public sources fit together

This repository contains the live Thally documentation content. The public
runtime and toolchain are authored in `thallylabs/thally`, while the complete
customer-ready project is generated in `thallylabs/starter` from one exact
runtime revision. `create-thally-docs`, MCP, migration, and Thally Cloud all
consume the same immutable starter release instead of copying this docs site or
cloning the runtime repository directly.

Use `create-thally-docs` to create a project. Do not clone or `degit` the
runtime repository as a template.

## Project Structure

```
docs.json              # Navigation config — tabs, groups, page order, API reference
openapi.yaml           # Your OpenAPI spec (auto-generates the API Reference tab)
src/
  content/             # MDX documentation pages (flat folder)
    introduction.mdx
    quickstart.mdx
    ...
  app/                 # Next.js App Router
  components/          # Layout, navigation, MDX, and UI primitives
  data/
    docs.ts            # Reads docs.json + frontmatter to build navigation
    site.ts            # Site name, description, links, brand colors
  config/
    api-reference.ts   # Reads API config from docs.json
```

## Adding a Page

1. Create `src/content/my-page.mdx`:
   ```mdx
   ---
   title: My Page
   description: A short description for search and meta tags.
   ---

   Your content here. Use any MDX — headings, code blocks, callouts, etc.
   ```

2. Add `"my-page"` to a group in `docs.json`:
   ```json
   {
     "group": "Getting Started",
     "pages": ["introduction", "quickstart", "my-page"]
   }
   ```

3. Done. Sidebar, search, and navigation update automatically.

## Configuring Navigation (`docs.json`)

```json
{
  "tabs": [
    {
      "tab": "Overview",
      "groups": [
        { "group": "Getting Started", "pages": ["introduction", "quickstart"] },
        { "group": "Core Concepts", "pages": ["authentication", "pagination"] }
      ]
    },
    {
      "tab": "API Reference",
      "api": {
        "source": "openapi.yaml",
        "tagsOrder": ["Pets", "Store"],
        "defaultGroup": "General"
      }
    },
    {
      "tab": "Changelog",
      "href": "/changelog"
    }
  ]
}
```

- **`tab`** — label shown in the top navigation bar
- **`groups`** — sidebar sections, each with a title and ordered page list
- **`api`** — auto-generates API reference from an OpenAPI spec
- **`href`** — links to an internal route or external URL

## API Reference

Drop your OpenAPI 3.x spec as `openapi.yaml` in the project root and configure it in `docs.json`:

```json
{
  "tab": "API Reference",
  "api": {
    "source": "openapi.yaml",
    "tagsOrder": ["Pets", "Store"],
    "defaultGroup": "General",
    "overrides": {
      "GET /pets": { "title": "List pets", "badge": "Stable" }
    }
  }
}
```

The template includes an example Pet Store spec. Replace it with your own.

## Customization

### Brand Colors

Edit `src/data/site.ts` to change the site name, description, links, and brand palette. Two presets are included (`primary` green, `secondary` purple) — switch between them or define your own.

### Layout

Edit `src/config/layout.ts` for padding, column widths, and panel styles.

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `THALLY_SITE_URL` | Production URL for OpenGraph metadata, canonical URLs, and agent endpoints (legacy `NEXT_PUBLIC_SITE_URL` still honored) |
| `THALLY_CLOUD_SITE_TOKEN` | Optional server-only credential from Thally Cloud. The deployed site exchanges it automatically on its next visit; never prefix it with `NEXT_PUBLIC_` |
| `THALLY_CLOUD_URL` | Optional Thally Cloud control-plane base URL. Defaults to `https://app.thally.io`; set this only for staging or a public development tunnel |
| `THALLY_CLOUD_SITE_CONFIG` | Managed-hosting release snapshot injected by Thally Cloud. Self-hosted sites should leave this unset and use `THALLY_CLOUD_SITE_TOKEN` |
| `THALLY_CONTENT_SOURCE` | Optional — where doc content is read from: `filesystem` (default; build-embedded, SSG) or `assets` (managed hosting; content served from the deployment's static assets and rendered per request). Self-hosted sites should leave this unset |
| `ANTHROPIC_API_KEY` | Optional key for local CLI, docs-agent, migration, and translation operations; it does not enable chat in a deployed runtime |
| `THALLY_REPO_URL` | Optional docs-repository identity for local docs-agent compatibility tools |
| `THALLY_GITHUB_TOKEN` | Optional fine-grained token for a local compatibility command that reads a product pull request or dispatches a docs task; never inject it into a managed site |
| `THALLY_AGENT_TOKEN` / `THALLY_DISPATCH_TOKEN` | Optional GitHub Actions secrets for the self-managed docs-agent workflow; unrelated to Cloud Track |

Legacy `DOX_*` names are still read as a fallback for every `THALLY_*` variable, so existing deployments keep working without renaming anything.

## Production

```bash
npm run build:cloudflare
npm run smoke:cloudflare
npm run deploy:cloudflare
```

The canonical deployment target is Cloudflare Workers through OpenNext. For a
traditional Node host, `npm run build && npm start` remains available.

## Stack

- Next.js 16 / TypeScript / App Router
- Tailwind CSS 3.4 + `@tailwindcss/typography`
- Radix UI (dialog, scroll-area, accordion, slot)
- MDX via `next-mdx-remote` + Shiki syntax highlighting
- `next-themes` for dark mode, `nuqs` for URL state, `zustand` for sidebar state
- `gray-matter` for frontmatter parsing, `yaml` for OpenAPI spec loading

## License

MIT
