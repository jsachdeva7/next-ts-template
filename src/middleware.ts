import { updateSupabaseSession } from '@/server/db/supabase/proxy'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  return updateSupabaseSession(req)
}

// Limit where the middleware runs
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
