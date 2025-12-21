import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { BeatLoader } from 'react-spinners'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
  children: ReactNode
}

const variantStyles = {
  primary:
    'bg-neutral-800 text-white hover:bg-neutral-700 disabled:opacity-60 disabled:hover:bg-neutral-800',
  secondary:
    'bg-neutral-100 text-black hover:bg-neutral-200 disabled:opacity-60 disabled:hover:bg-neutral-100',
  outline: 'p-0 m-0 text-neutral-500 hover:text-neutral-700 disabled:opacity-50'
}

function Spinner({
  variant
}: {
  variant: 'primary' | 'secondary' | 'outline'
}) {
  return (
    <BeatLoader
      size={4}
      color={variant === 'primary' ? '#ffffff' : '#000000'}
      className='mr-2'
    />
  )
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        variant === 'outline'
          ? 'transition-colors'
          : 'rounded-md px-3 py-2 text-sm font-medium transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className='flex items-center justify-center'>
          <Spinner variant={variant} />
          <span>{children}...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
