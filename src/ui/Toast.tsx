import { cn } from '@/lib/utils'
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon
} from 'lucide-react'
import type { ToastContentProps } from 'react-toastify'

export type ToastVariant = 'light' | 'dark'
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  message: string
  [key: string]: unknown
}

export interface ToastProps extends ToastContentProps {
  type: ToastType
  variant?: ToastVariant
  data: ToastData
}

const variantConfig: Record<
  ToastVariant,
  {
    bgColor: string
    textColor: string
  }
> = {
  light: {
    bgColor: 'bg-white',
    textColor: 'text-neutral-900'
  },
  dark: {
    bgColor: 'bg-neutral-800',
    textColor: 'text-white'
  }
}

const typeConfig: Record<
  ToastType,
  {
    icon: LucideIcon
    iconColor: string
  }
> = {
  success: {
    icon: CircleCheck,
    iconColor: 'text-green-600'
  },
  error: {
    icon: CircleAlert,
    iconColor: 'text-red-600'
  },
  warning: {
    icon: TriangleAlert,
    iconColor: 'text-amber-600'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600'
  }
}

export default function Toast({ type, variant = 'light', data }: ToastProps) {
  if (!data?.message) return null

  const typeStyle = typeConfig[type]
  const variantStyle = variantConfig[variant]
  const Icon = typeStyle.icon

  return (
    <div
      className={cn(
        'flex h-full items-center gap-2 rounded-md px-3 py-2 shadow-sm',
        variantStyle.bgColor
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', typeStyle.iconColor)} />
      <p className={cn('flex-1 text-sm font-medium', variantStyle.textColor)}>
        {data.message}
      </p>
    </div>
  )
}
