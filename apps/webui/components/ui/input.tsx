import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-all',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-teal/15 focus-visible:border-brand-teal',
        'disabled:cursor-not-allowed disabled:opacity-50 placeholder:opacity-50',
        className
      )}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-dark)',
        color: 'var(--text-primary)',
        ...style,
      }}
      {...props}
    />
  )
)
Input.displayName = 'Input'
export { Input }
