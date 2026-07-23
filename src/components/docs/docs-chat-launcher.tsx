'use client'

import type { ComponentType } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bot,
  Brain,
  LoaderCircle,
  Sparkles,
  Stars,
  Wand,
  Zap,
  type LucideProps,
} from 'lucide-react'
import type { DocsChatProps, DocsChatStatus } from '@/components/docs/docs-chat'

type IconName = 'sparkles' | 'zap' | 'bot' | 'brain' | 'stars' | 'wand'

const ICON_MAP: Record<IconName, ComponentType<LucideProps>> = {
  sparkles: Sparkles,
  zap: Zap,
  bot: Bot,
  brain: Brain,
  stars: Stars,
  wand: Wand,
}

function LauncherIcon({ icon }: { icon?: string }) {
  if (icon && (icon.startsWith('/') || icon.startsWith('http'))) {
    // eslint-disable-next-line @next/next/no-img-element -- remote admin-provided icons have no known dimensions.
    return <img src={icon} alt="" className="h-5 w-5 object-contain" />
  }
  const Icon = ICON_MAP[(icon as IconName) ?? 'sparkles'] ?? Sparkles
  return <Icon className="h-5 w-5" />
}

interface DocsChatLauncherProps {
  label?: string
  icon?: string
}

export function DocsChatLauncher({
  label = 'Ask AI',
  icon,
}: DocsChatLauncherProps) {
  const [Chat, setChat] = useState<ComponentType<DocsChatProps> | null>(null)
  const [status, setStatus] = useState<DocsChatStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [hidden, setHidden] = useState(false)
  const statusRequestRef = useRef<Promise<DocsChatStatus | null> | null>(null)

  const loadStatus = useCallback(() => {
    if (!statusRequestRef.current) {
      statusRequestRef.current = fetch('/api/chat-status')
        .then((response) => (response.ok ? response.json() as Promise<DocsChatStatus> : null))
        .catch(() => null)
    }
    return statusRequestRef.current
  }, [])

  useEffect(() => {
    let active = true
    void loadStatus().then((liveStatus) => {
      if (!active) return
      setStatus(liveStatus)
      if (liveStatus?.show === false) setHidden(true)
    })
    return () => {
      active = false
    }
  }, [loadStatus])

  async function openChat() {
    if (loading) return
    setLoading(true)

    const [module, liveStatus] = await Promise.all([
      import('@/components/docs/docs-chat'),
      loadStatus(),
    ])

    if (liveStatus?.show === false) {
      setHidden(true)
      setLoading(false)
      return
    }

    setStatus(liveStatus)
    setChat(() => module.DocsChat)
    setLoading(false)
  }

  if (hidden) return null

  if (Chat) {
    return (
      <Chat
        label={label}
        icon={icon}
        initiallyOpen
        initialStatus={status}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={openChat}
      disabled={loading}
      aria-label={`Open ${label}`}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-75"
    >
      {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <LauncherIcon icon={icon} />}
      <span className="max-w-12 truncate text-[9px] font-semibold tracking-wide opacity-90">{label}</span>
    </button>
  )
}
