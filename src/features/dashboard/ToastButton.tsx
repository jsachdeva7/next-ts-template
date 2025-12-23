'use client'

import { showToast } from '@/lib/toast'
import { Button } from '@/ui/Button'

export default function ToastButton() {
  return (
    <Button
      variant='secondary'
      onClick={() => showToast('info', 'light', { message: 'Hello!' })}
    >
      Say hello
    </Button>
  )
}
