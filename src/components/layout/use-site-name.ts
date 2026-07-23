'use client'

import { useEffect, useState } from 'react'
import { siteConfig } from '@/data/site'

let siteNameRequest: Promise<string | null> | null = null

function loadSiteName() {
  if (!siteNameRequest) {
    siteNameRequest = fetch('/api/site-config')
      .then((response) => (response.ok ? response.json() : null))
      .then((config) => (
        config?.name && typeof config.name === 'string' ? config.name : null
      ))
      .catch(() => null)
  }
  return siteNameRequest
}

/** The effective site name — build config, overridden live by the dashboard. */
export function useSiteName(loadWhen: 'always' | 'desktop' = 'always'): string {
  const [name, setName] = useState(siteConfig.name)
  useEffect(() => {
    if (loadWhen === 'desktop' && !window.matchMedia('(min-width: 1024px)').matches) {
      return
    }
    let active = true
    loadSiteName().then((liveName) => {
      if (active && liveName) {
        setName(liveName)
      }
    })
    return () => {
      active = false
    }
  }, [loadWhen])
  return name
}
