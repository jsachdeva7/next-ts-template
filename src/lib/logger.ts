type Level = 'debug' | 'info' | 'warn' | 'error'

function shouldDebug() {
  return process.env.NODE_ENV !== 'production'
}

function formatTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldDebug()) {
      console.debug(`[DEBUG] ${formatTimestamp()}`, ...args)
    }
  },
  info: (...args: unknown[]) => {
    console.info(`[INFO] [${formatTimestamp()}]`, ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn(`[WARN] [${formatTimestamp()}]`, ...args)
  },
  error: (...args: unknown[]) => {
    console.error(`[ERROR] [${formatTimestamp()}]`, ...args)
  }
} satisfies Record<Level, (...args: unknown[]) => void>
