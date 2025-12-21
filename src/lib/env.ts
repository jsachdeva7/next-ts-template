import { z } from 'zod'

const serverSchema = z.object({})

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string()
})

function formatZodErrors(error: z.ZodError) {
  return error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')
}

export const env = {
  client: (() => {
    const clientEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    }
    const parsed = clientSchema.safeParse(clientEnv)
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
