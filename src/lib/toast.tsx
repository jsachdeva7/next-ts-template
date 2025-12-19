import Toast, {
  type ToastData,
  type ToastType,
  type ToastVariant
} from '@/ui/Toast'
import type { ToastContentProps, ToastOptions } from 'react-toastify'
import { toast } from 'react-toastify'

export function showToast(
  type: ToastType,
  variant: ToastVariant | undefined,
  data: ToastData,
  options?: ToastOptions
) {
  return toast(
    (props: ToastContentProps) => (
      <Toast {...props} type={type} variant={variant} data={data} />
    ),
    {
      className: 'p-0 w-full h-full flex items-center justify-center',
      closeButton: false,
      ...options
    }
  )
}
