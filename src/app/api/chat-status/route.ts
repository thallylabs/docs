import { NextResponse } from 'next/server'
import { getAdminSettings } from '@/lib/admin/settings'
import { getAiConfig } from '@/data/docs'
import { DEFAULT_AI_DISCLAIMER } from '@/lib/ai-defaults'
import { getCloud } from '@/lib/cloud-bridge'

export const runtime = 'nodejs'

/**
 * Public: whether the AI chat widget should show, plus its live name + disclaimer.
 * Lets the admin toggle chat and rename/relabel the assistant live (F1 override)
 * without making every static docs page dynamic — the client DocsChat fetches
 * this, hides itself when disabled, and reflects the admin's name + disclaimer.
 * `configured` reports whether a chat backend is ready; the FAB still shows when
 * chat is enabled in config so visitors see the setup notice if needed.
 */
export async function GET() {
  const settings = await getAdminSettings()
  const ai = getAiConfig()
  // Visibility follows docs.json / admin toggle. Backend readiness is separate
  // (`enabled` on the launcher) — requiring getCloud()?.ai here hid the FAB on
  // every OSS stub deployment even when ai.chat was true.
  const show = settings.chatEnabled ?? Boolean(ai.chat)
  const label = settings.aiLabel ?? ai.label ?? 'Ask AI'
  const disclaimer = settings.aiDisclaimer ?? DEFAULT_AI_DISCLAIMER
  const configured = Boolean(getCloud()?.ai?.isChatConfigured())
  return NextResponse.json(
    { show, label, disclaimer, configured },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
