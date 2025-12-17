import { z } from 'zod'

const serverSchema = z.object({
  // Example server-only vars
  // DATABASE_URL: z.string().url(),
})

const clientSchema = z.object({
  // Example client-only vars
  // NEXT_PUBLIC_API_URL: z.string().url(),
})

function formatZodErrors(error: z.ZodError) {
  return error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')
}

export const env = {
  client: (() => {
    const parsed = clientSchema.safeParse(process.env)
    if (!parsed.success) {
      throw new Error(`Invalid client env:\n${formatZodErrors(parsed.error)}`)
    }
    return parsed.data
  })(),

  server: (() => {
    if (typeof window !== 'undefined') return {} as z.infer<typeof serverSchema>
    const parsed = serverSchema.safeParse(process.env)
    if (!parsed.success) {
      throw new Error(`Invalid server env:\n${formatZodErrors(parsed.error)}`)
    }
    return parsed.data
  })()
}
