type Level = 'debug' | 'info' | 'warn' | 'error'

function shouldDebug() {
  return process.env.NODE_ENV !== 'production'
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldDebug()) console.debug('[DEBUG]', ...args)
  },
  info: (...args: unknown[]) => console.info('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args)
} satisfies Record<Level, (...args: unknown[]) => void>
