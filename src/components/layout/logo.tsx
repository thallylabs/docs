'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useSiteName } from './use-site-name'

// Stable no-op subscribe for the hydration gate below.
const emptySubscribe = () => () => {}

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className, showText = true }: LogoProps) {
  const siteName = useSiteName()
  // Show an admin-uploaded logo when one exists; otherwise the default mark +
  // site name. The <img> probes /api/brand/logo and swaps in on load.
  const [customOk, setCustomOk] = useState(false)
  const [shouldProbe, setShouldProbe] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Follow the site theme: dark mode requests the dark variant (the route
  // falls back to the light logo when none is uploaded). next-themes reads
  // localStorage synchronously on the client, so resolvedTheme can differ from
  // the SSR output on the very first render — gate on hydration so the src
  // attribute matches the server HTML, then settle to the real theme.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const { resolvedTheme } = useTheme()
  const isDark = mounted && resolvedTheme === 'dark'
  const src = shouldProbe
    ? (isDark ? '/api/brand/logo?mode=dark' : '/api/brand/logo')
    : null

  // A hidden desktop sidebar used to probe the dynamic logo on mobile too.
  // Only request it once the logo container is actually visible.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setShouldProbe(true)
        observer.disconnect()
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const img = imgRef.current
    if (img?.complete) setCustomOk(img.naturalWidth > 0)
  }, [src])

  return (
    <div ref={containerRef} className={cn('inline-flex items-center gap-2', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- runtime brand assets are served by an API route.
        <img
          ref={imgRef}
          src={src}
          alt={siteName}
          onLoad={() => setCustomOk(true)}
          onError={() => setCustomOk(false)}
          style={{ height: 28, width: 'auto', display: customOk ? 'block' : 'none' }}
        />
      ) : null}
      {!customOk ? (
        <>
          {/* Default brand mark (public/brand, ships with every scaffold) —
              the Thally olive-leaf SVG, theme-aware (olive on light, pale lime
              on dark); replaced site-wide by an admin upload above. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isDark ? '/brand/thally-logo-dark.svg' : '/brand/thally-logo-light.svg'}
            alt=""
            width={28}
            height={28}
            className="shrink-0"
          />
          {showText ? (
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">{siteName}</span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
