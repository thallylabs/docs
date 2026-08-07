import { NextResponse } from 'next/server'
import { getAdminSettings } from '@/lib/admin/settings'
import { getAiConfig } from '@/data/docs'
import { DEFAULT_AI_DISCLAIMER } from '@/lib/ai-defaults'
import { isAiChatAvailable } from '@/lib/cloud-bridge'
import type { NextRequest } from 'next/server'
import { getCloudSiteConfig } from '@/lib/cloud-link/client'

export const runtime = 'nodejs'

/**
 * Public: whether the AI chat widget should show, plus its live name + disclaimer.
 * Lets the admin toggle chat and rename/relabel the assistant live (F1 override)
 * without making every static docs page dynamic — the client DocsChat fetches
 * this, hides itself when disabled, and reflects the admin's name + disclaimer.
 * `configured` reports whether a chat backend is ready; the FAB still shows when
 * chat is enabled in config so visitors see the setup notice if needed.
 */
export async function GET(request: NextRequest) {
  const [settings, cloudConfig] = await Promise.all([
    getAdminSettings(),
    getCloudSiteConfig(request.nextUrl.origin),
  ])
  const ai = getAiConfig()
  const cloudEnabled = cloudConfig
    ? Boolean(cloudConfig.entitlements.features?.aiAnswers) &&
      Boolean(cloudConfig.siteConfig.portable.ai?.enabled)
    : null
  // Visibility follows docs.json / admin / cloud site config. Backend readiness
  // is separate (`configured`) — requiring isAiChatAvailable here hid the FAB
  // whenever the chat service was not yet credentialed.
  const show = cloudEnabled ?? settings.chatEnabled ?? Boolean(ai.chat)
  const label = settings.aiLabel ?? ai.label ?? 'Ask AI'
  const disclaimer = settings.aiDisclaimer ?? DEFAULT_AI_DISCLAIMER
  const configured = await isAiChatAvailable(request.nextUrl.origin)
  return NextResponse.json(
    { show, label, disclaimer, configured },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
