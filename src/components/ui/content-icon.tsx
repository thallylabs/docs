import {
  BookOpen,
  Code2,
  Grid3X3,
  Link2,
  Mail,
  MessageSquare,
  PartyPopper,
  Send,
  Twitter,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type ContentIconName =
  | 'book-open'
  | 'code-simple'
  | 'grid-round'
  | 'link-simple'
  | 'wrench'
  | 'party-horn'
  | 'telegram'
  | 'envelope'
  | 'x-twitter'
  | 'message'

const iconMap: Record<ContentIconName, LucideIcon> = {
  'book-open': BookOpen,
  'code-simple': Code2,
  'grid-round': Grid3X3,
  'link-simple': Link2,
  wrench: Wrench,
  'party-horn': PartyPopper,
  telegram: Send,
  envelope: Mail,
  'x-twitter': Twitter,
  message: MessageSquare,
}

export function ContentIcon({ icon, className }: { icon: ContentIconName | string; className?: string }) {
  const Component = iconMap[icon as ContentIconName] ?? MessageSquare
  return <Component className={cn('h-5 w-5 text-accent', className)} aria-hidden="true" />
}
