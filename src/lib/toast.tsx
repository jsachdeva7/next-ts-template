import { toast } from 'sonner'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ToastVariant = 'light' | 'dark'
export type ToastData = { message: string }

export function showToast(
  type: ToastType,
  variant: ToastVariant | undefined,
  data: ToastData,
  options?: { duration?: number }
) {
  // Map your types to Sonner's API
  const toastFn = {
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning
  }[type]

  const variantClass =
    variant === 'dark' ? 'toast-variant-dark' : 'toast-variant-light'

  return toastFn(data.message, {
    duration: options?.duration || 1000,
    className: variantClass
  })
}
