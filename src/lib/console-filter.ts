/**
 * Filters out chrome-extension and browser extension errors from console
 * This helps reduce noise from browser extensions in development
 */
export function setupConsoleFilter() {
  if (typeof window === 'undefined') return

  const originalError = console.error
  const originalWarn = console.warn

  console.error = function (...args: unknown[]) {
    const message = String(args[0] || '')
    if (
      message.includes('chrome-extension://') ||
      message.includes('moz-extension://') ||
      message.includes('safari-extension://')
    ) {
      return // Filter out extension errors
    }
    originalError.apply(console, args)
  }

  console.warn = function (...args: unknown[]) {
    const message = String(args[0] || '')
    if (
      message.includes('chrome-extension://') ||
      message.includes('moz-extension://') ||
      message.includes('safari-extension://')
    ) {
      return // Filter out extension warnings
    }
    originalWarn.apply(console, args)
  }
}
