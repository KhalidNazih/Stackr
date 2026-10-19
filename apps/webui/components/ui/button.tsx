'use client'
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[13px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-teal/20 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        primary:    'bg-[#0078D4] text-white shadow-sm hover:bg-[#106EBE] active:scale-[0.98]',
        secondary:  '[background:var(--bg-card)] [color:var(--text-secondary)] border [border-color:var(--border-dark)] shadow-xs hover:[background:var(--bg-card-hover)] hover:[color:var(--text-primary)]',
        tertiary:   '[color:var(--text-muted)] hover:[background:var(--bg-card-hover)] hover:[color:var(--text-primary)]',
        teal:       'bg-[#0078D4] text-white shadow-sm hover:bg-[#106EBE] active:scale-[0.98]',
        danger:     'bg-error-600 text-white shadow-sm hover:bg-error-700',
        'danger-outline': 'bg-white dark:bg-dark-200 text-error-700 dark:text-error-500 border border-error-300 dark:border-error-500/40 shadow-xs hover:bg-error-50 dark:hover:bg-error-500/10',
        ghost:      '[color:var(--text-muted)] hover:[background:var(--bg-card-hover)] hover:[color:var(--text-primary)]',
        link:       'text-[#0078D4] hover:text-[#106EBE] underline-offset-4 hover:underline',
      },
      size: {
        sm:  'h-8 px-3 text-xs gap-1',
        md:  'h-9 px-3.5',
        lg:  'h-10 px-4 text-sm',
        xl:  'h-11 px-5 text-sm gap-2',
        icon:    'h-9 w-9',
        'icon-sm':'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'
export { Button, buttonVariants }
