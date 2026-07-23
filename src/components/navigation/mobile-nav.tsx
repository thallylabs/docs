'use client'

import dynamic from 'next/dynamic'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import type { NavigationSection } from '@/data/docs'

const MobileNavDialog = dynamic(
  () => import('@/components/navigation/mobile-nav-dialog').then((module) => module.MobileNavDialog),
)

interface MobileNavProps {
  sections: Array<NavigationSection>
}

export function MobileNav({ sections }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted/50 lg:hidden"
      >
        <span className="sr-only">Open navigation</span>
        <Menu className="h-4 w-4" />
      </button>
      {open ? (
        <MobileNavDialog
          open={open}
          onOpenChange={setOpen}
          sections={sections}
        />
      ) : null}
    </>
  )
}
