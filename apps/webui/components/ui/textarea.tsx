import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, style, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-all resize-none',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-teal/15 focus-visible:border-brand-teal',
        'placeholder:opacity-50',
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
Textarea.displayName = 'Textarea'
export { Textarea }
