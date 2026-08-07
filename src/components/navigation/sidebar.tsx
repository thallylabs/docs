'use client'

import type React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavigationSection } from '@/data/docs'
import { Badge } from '@/components/ui/badge'
import { ContentIcon } from '@/components/ui/content-icon'
import { layout, typography } from '@/config/layout'
import { cn } from '@/lib/utils'

interface SidebarProps {
  sections: Array<NavigationSection>
  title: string
  className?: string
}

export function Sidebar({ sections, title, className }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (!href || /^https?:\/\//i.test(href)) {
      return false
    }
    const normalizedHref = normalizePath(href)
    const normalizedPath = normalizePath(pathname)
    if (normalizedHref === '/') {
      return normalizedPath === '/'
    }
    const segments = normalizedHref.split('/').filter(Boolean)
    if (segments.length <= 1) {
      return normalizedPath === normalizedHref
    }
    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`)
  }

  return (
    <aside
      className={cn(
        "thally-docs-sidebar relative hidden shrink-0 border-r border-border bg-background before:absolute before:inset-y-0 before:right-full before:w-screen before:bg-inherit before:content-[''] lg:block",
        layout.sidebarWidth,
        className,
      )}
    >
      <div className={cn('sticky top-12 flex h-[calc(100dvh-48px)] flex-col', layout.sidebarWidth, layout.sidebarPadding)}>
        <div className="shrink-0">
          <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-foreground/50 line-clamp-1">{title}</p>
        </div>
        <nav className="scrollbar-hide mt-7 min-h-0 flex-1 space-y-[26px] overflow-y-auto overscroll-y-contain pb-4">
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className={cn(typography.meta, 'flex items-center gap-1.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] text-foreground/50')}>
                  {section.icon && <ContentIcon icon={section.icon} className="h-3.5 w-3.5 shrink-0 text-foreground/50" />}
                  <span className="truncate">{section.title}</span>
                </p>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 w-px bg-border" />
                  <div>
                    {section.items.map((item) => {
                      const active = isActive(item.href)
                      const activeStyles = active
                        ? {
                            backgroundColor: `hsl(var(--sidebar-active-bg))`,
                            color: `hsl(var(--sidebar-active-text))`,
                          }
                        : undefined
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          prefetch={false}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'group relative block py-[5px] pl-[14px] text-left transition',
                            'focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/30',
                            active
                              ? 'text-foreground shadow-none'
                              : 'text-foreground/70 hover:text-foreground',
                          )}
                          style={activeStyles}
                        >
                          <span
                            className={cn(
                              'thally-sidebar-indicator absolute inset-y-0 left-0 w-[2px] transition',
                              active ? 'bg-foreground' : 'bg-transparent group-hover:bg-border',
                            )}
                            style={{ opacity: 'var(--theme-sidebar-indicator-opacity, 1)' } as React.CSSProperties}
                          />
                          <span
                            className={cn(
                              'flex items-center gap-2 text-[0.88rem] leading-[1.45]',
                              active ? 'font-semibold' : 'font-medium',
                            )}
                          >
                            <span className="line-clamp-2 break-words">{item.title}</span>
                            {item.badge ? <Badge className="shrink-0 text-[10px] uppercase">{item.badge}</Badge> : null}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
        </nav>
      </div>
    </aside>
  )
}

function normalizePath(value: string) {
  if (!value) {
    return '/'
  }
  if (value === '/') {
    return '/'
  }
  return value.endsWith('/') ? value.slice(0, -1) : value
}
