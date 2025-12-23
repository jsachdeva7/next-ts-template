import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function assert(
  condition: unknown,
  message = 'Assertion failed'
): asserts condition {
  if (!condition) throw new Error(message)
}

export function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}
