import { buildAgentsManifest } from '@/lib/agent-manifest'
import { getContentSource } from '@/lib/content-source'
import { resolveRequestSiteConfig, siteIdentity } from '@/lib/site-config'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Author overrides follow the active source so an assets-mode release never
  // exposes the baseline Worker’s physical AGENTS.md. The source prefers a
  // published asset when present and retains the filesystem override in OSS.
  const override = await getContentSource().read('AGENTS.md')
  if (override) {
    return new Response(override.content, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }

  const identity = siteIdentity(await resolveRequestSiteConfig())
  return new Response(buildAgentsManifest(identity, new URL(request.url).origin), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
