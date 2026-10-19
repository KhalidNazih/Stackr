import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'default' | 'white' | 'gradient'
  className?: string
}

const SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  xs:  'text-xs',
  sm:  'text-sm',
  md:  'text-base',
  lg:  'text-lg',
  xl:  'text-xl',
  '2xl':'text-2xl',
}

export function Logo({ size = 'md', variant = 'default', className }: LogoProps) {
  const wordClass =
    variant === 'white'
      ? 'text-white'
      : variant === 'gradient'
      ? 'brand-gradient-text'
      : 'text-slate-900 dark:text-white font-bold tracking-tight'

  return (
    <span className={cn('brand-word leading-none inline-flex items-baseline transition-colors duration-200', SIZE[size], className)}>
      <span className={wordClass}>Stackr</span>
    </span>
  )
}

interface MarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 32, className }: MarkProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn('flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0A2540] via-[#0078D4] to-[#00BCF2] shadow-sm shrink-0', className)}
    >
      <img src="/stackicon.png" alt="Stackr Icon" style={{ width: size * 0.65, height: size * 0.65, objectFit: 'contain' }} />
    </div>
  )
}

export function StackrLogoImage({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/stackrlogo.png"
      alt="Stackr Logo"
      style={{ height: size }}
      className={cn('w-auto object-contain dark:invert transition-all duration-200', className)}
    />
  )
}
