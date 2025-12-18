import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { BeatLoader } from 'react-spinners'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
  children: ReactNode
}

const variantStyles = {
  primary:
    'bg-black text-white hover:bg-neutral-800 disabled:opacity-60 disabled:hover:bg-black',
  secondary:
    'bg-neutral-200 text-black hover:bg-neutral-300 disabled:opacity-60 disabled:hover:bg-neutral-200'
}

function Spinner({ variant }: { variant: 'primary' | 'secondary' }) {
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
        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
