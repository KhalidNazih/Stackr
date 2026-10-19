import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand' | 'teal' | 'purple' | 'gray' | 'indigo' | 'coral'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
  size?: 'sm' | 'md'
}

const styles: Record<BadgeVariant, string> = {
  default: 'bg-gray-50 dark:bg-dark-300 text-gray-700 dark:text-slate-300 ring-1 ring-inset ring-gray-200 dark:ring-dark-border',
  gray:    'bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-slate-300 ring-1 ring-inset ring-gray-200 dark:ring-dark-border',
  success: 'bg-success-50 dark:bg-success-500/15 text-success-700 dark:text-success-500 ring-1 ring-inset ring-success-200 dark:ring-success-500/30',
  warning: 'bg-warning-50 dark:bg-warning-500/15 text-warning-700 dark:text-warning-500 ring-1 ring-inset ring-warning-200 dark:ring-warning-500/30',
  error:   'bg-error-50 dark:bg-error-500/15 text-error-700 dark:text-error-500 ring-1 ring-inset ring-error-200 dark:ring-error-500/30',
  info:    'bg-info-50 dark:bg-info-500/15 text-info-700 dark:text-info-500 ring-1 ring-inset ring-info-200 dark:ring-info-500/30',
  brand:   'bg-brand-navy/8 dark:bg-brand-navy-light/25 text-brand-navy dark:text-slate-200 ring-1 ring-inset ring-brand-navy/20 dark:ring-brand-navy-light/40',
  teal:    'bg-brand-teal-light dark:bg-brand-teal/15 text-brand-teal-dark dark:text-brand-teal ring-1 ring-inset ring-brand-teal/25 dark:ring-brand-teal/40',
  purple:  'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-500 ring-1 ring-inset ring-purple-200 dark:ring-purple-500/30',
  indigo:  'bg-brand-indigo/10 dark:bg-brand-indigo/15 text-brand-indigo dark:text-brand-indigo ring-1 ring-inset ring-brand-indigo/25 dark:ring-brand-indigo/30',
  coral:   'bg-brand-coral/10 dark:bg-brand-coral/15 text-brand-coral dark:text-brand-coral ring-1 ring-inset ring-brand-coral/25 dark:ring-brand-coral/30',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-500', gray: 'bg-gray-500',
  success: 'bg-success-500', warning: 'bg-warning-500', error: 'bg-error-500', info: 'bg-info-500',
  brand: 'bg-brand-navy', teal: 'bg-brand-teal', purple: 'bg-purple-500',
  indigo: 'bg-brand-indigo', coral: 'bg-brand-coral',
}

export function Badge({ variant = 'default', dot, size = 'md', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        styles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  )
}
