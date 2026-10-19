import type { LucideIcon } from 'lucide-react'
import {
  User, UserCircle2, Crown, Rocket, Code2, Shield, Sparkles, Cpu, Flame, Gem,
  Terminal, Zap, Trophy, Infinity,
} from 'lucide-react'

export interface AvatarIconDef {
  id: string
  label: string
  icon: LucideIcon
  /** Gradient for the avatar background — two Tailwind color tokens. */
  gradient: string
  /** Ring color when active. */
  ring: string
}

export const AVATAR_ICONS: AvatarIconDef[] = [
  { id: 'user',       label: 'Classic',    icon: User,        gradient: 'from-sky-400 to-blue-600',       ring: 'ring-sky-400/40'    },
  { id: 'circle',     label: 'Minimal',    icon: UserCircle2, gradient: 'from-slate-400 to-slate-700',    ring: 'ring-slate-400/40'  },
  { id: 'crown',      label: 'Executive',  icon: Crown,       gradient: 'from-amber-300 to-orange-500',   ring: 'ring-amber-400/40'  },
  { id: 'rocket',     label: 'Launcher',   icon: Rocket,      gradient: 'from-fuchsia-400 to-rose-600',   ring: 'ring-fuchsia-400/40'},
  { id: 'developer',  label: 'Engineer',   icon: Code2,       gradient: 'from-violet-400 to-indigo-600',  ring: 'ring-violet-400/40' },
  { id: 'shield',     label: 'Guardian',   icon: Shield,      gradient: 'from-emerald-400 to-teal-600',   ring: 'ring-emerald-400/40'},
  { id: 'spark',      label: 'Star',       icon: Sparkles,    gradient: 'from-yellow-300 to-pink-500',    ring: 'ring-yellow-400/40' },
  { id: 'cpu',        label: 'Operator',   icon: Cpu,         gradient: 'from-cyan-400 to-blue-700',      ring: 'ring-cyan-400/40'   },
  { id: 'gem',        label: 'Elite',      icon: Gem,         gradient: 'from-indigo-500 via-purple-500 to-pink-500', ring: 'ring-purple-400/40' },
  { id: 'flame',      label: 'Hotshot',    icon: Flame,       gradient: 'from-orange-500 to-red-600',     ring: 'ring-orange-400/40' },
  { id: 'terminal',   label: 'Hacker',     icon: Terminal,    gradient: 'from-emerald-500 to-green-700',  ring: 'ring-emerald-400/40'},
  { id: 'zap',        label: 'Turbo',      icon: Zap,         gradient: 'from-amber-400 to-yellow-600',   ring: 'ring-amber-400/40'  },
  { id: 'trophy',     label: 'Champion',   icon: Trophy,      gradient: 'from-yellow-400 to-amber-600',   ring: 'ring-yellow-400/40' },
  { id: 'infinity',   label: 'Architect',  icon: Infinity,    gradient: 'from-indigo-400 to-cyan-500',    ring: 'ring-indigo-400/40' },
]

export function getAvatarIcon(id: string): AvatarIconDef {
  return AVATAR_ICONS.find(i => i.id === id) ?? AVATAR_ICONS[0]
}
