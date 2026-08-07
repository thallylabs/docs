'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavigationSection } from '@/data/docs'
import { Badge } from '@/components/ui/badge'
import { typography } from '@/config/layout'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/layout/logo'
import { useSiteName } from '@/components/layout/use-site-name'

interface MobileNavDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: Array<NavigationSection>
}

export function MobileNavDialog({
  open,
  onOpenChange,
  sections,
}: MobileNavDialogProps) {
  const siteName = useSiteName()
  const pathname = usePathname()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-full max-w-[min(85vw,320px)] flex-col border-r border-border bg-background shadow-2xl">
          <Dialog.Title className="sr-only">Primary navigation</Dialog.Title>
          <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-4">
            <div className="flex items-center gap-2">
              <Logo showText={false} />
              <span className="text-base font-semibold">{siteName}</span>
            </div>
            <Dialog.Close className="rounded-full border border-border p-1.5 transition hover:bg-muted/50">
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
            {sections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className={typography.meta}>{section.title}</p>
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : pathname === item.href
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        prefetch={false}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          'flex flex-col rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition hover:border-border',
                          'focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/30',
                          isActive && 'border-border bg-muted',
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.badge ? <Badge className="text-[10px] uppercase">{item.badge}</Badge> : null}
                        </span>
                        {item.description ? (
                          <span className="text-xs font-normal text-foreground/60">{item.description}</span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
