'use client'

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
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

const SiteNameContext = createContext<string | null>(null)

interface SiteNameProviderProps {
  children: ReactNode
  initialName: string
}

/**
 * Hydrate every client identity consumer from the request-bound server value.
 *
 * The API refresh keeps dashboard edits live, while `initialName` prevents a
 * forked release from flashing the baseline identity on its first paint.
 */
export function SiteNameProvider({ children, initialName }: SiteNameProviderProps) {
  const [name, setName] = useState(initialName)
  useEffect(() => {
    let active = true
    loadSiteName().then((liveName) => {
      if (active && liveName) setName(liveName)
    })
    return () => {
      active = false
    }
  }, [])
  return createElement(SiteNameContext.Provider, { value: name }, children)
}

/** The effective site name — request snapshot, refreshed live by the dashboard. */
export function useSiteName(loadWhen: 'always' | 'desktop' = 'always'): string {
  const requestName = useContext(SiteNameContext)
  const [name, setName] = useState(requestName ?? siteConfig.name)
  useEffect(() => {
    if (requestName) {
      setName(requestName)
      return
    }
    if (loadWhen === 'desktop' && !window.matchMedia('(min-width: 1024px)').matches) {
      return
    }
    let active = true
    loadSiteName().then((liveName) => {
      if (active && liveName) setName(liveName)
    })
    return () => {
      active = false
    }
  }, [loadWhen, requestName])
  return name
}
