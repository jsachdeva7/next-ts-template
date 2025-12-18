type Level = 'debug' | 'info' | 'warn' | 'error'

function shouldDebug() {
  return process.env.NODE_ENV !== 'production'
}

function isChromeExtensionError(...args: unknown[]): boolean {
  if (typeof window === 'undefined') return false
  const message = String(args[0] || '')
  return (
    message.includes('chrome-extension://') ||
    message.includes('moz-extension://')
  )
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldDebug()) console.debug('[DEBUG]', ...args)
  },
  info: (...args: unknown[]) => console.info('[INFO]', ...args),
  warn: (...args: unknown[]) => {
    if (!isChromeExtensionError(...args)) {
      console.warn('[WARN]', ...args)
    }
  },
  error: (...args: unknown[]) => {
    if (!isChromeExtensionError(...args)) {
      console.error('[ERROR]', ...args)
    }
  }
} satisfies Record<Level, (...args: unknown[]) => void>
