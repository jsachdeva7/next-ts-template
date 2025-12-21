# Supabase Auth Guide

## What “auth” means in this template

- Auth is cookie-based sessions (Supabase).
- Server is the source of truth for access control and permissions.
- Client-side auth is mostly UX (sign-in/out buttons, showing user state).

## Where auth lives

- `src/server/db/supabase/*` Supabase client factories + session plumbing.
- `src/server/auth/*` App-level helpers like `getUser()`, `requireUser()`,
  `requireRole()`.
- `src/lib/auth/*` Provider-agnostic client auth API (`authClient`) for
  sign-in/sign-up/sign-out.
- `src/middleware.ts` Runs before requests to refresh/keep cookies in sync for
  SSR.
- `src/app/*` Pages gate access by calling server auth helpers.
- `src/features/*` Feature UI + hooks + server actions that rely on
  `src/server/auth/*` and `src/lib/auth/*`.

## Which Supabase client to use

- `src/lib/auth/client.ts` Use in Client Components for
  sign-in/sign-up/sign-out. Provider-agnostic API; swap providers by changing
  the export here.

- `src/server/db/supabase/browser.ts` Low-level Supabase browser client factory.
  Only used internally by `src/lib/auth/providers/*`.

- `src/server/db/supabase/server.ts` Use in Server Components, Server Actions,
  Route Handlers. Reads cookies via next/headers so auth.getUser() works on the
  server.

- `src/server/db/supabase/proxy.ts` Middleware helper. Refreshes session +
  updates cookies for SSR.

## Request lifecycle mental model

- Request comes in → `src/middleware.ts` runs.
- Middleware calls `updateSupabaseSession(req)` → refreshes tokens if needed and
  updates cookies.
- Server code calls `createSupabaseServerClient()` → reads fresh cookies →
  user/session is available.
- Client login/logout updates cookies → middleware keeps server-side state
  consistent on subsequent requests.

## How to sign in/up (client-side)

Use `authClient` from `src/lib/auth/client.ts` in Client Components:

```tsx
// src/features/auth/SignIn.tsx
import { authClient } from '@/lib/auth/client'

const result = await authClient.signInWithPassword(email, password)
if (!result.ok) {
  // Handle error: result.message
}
```

## How to gate pages

_Server-first gating_:

- On a gated page, call requireUser() and redirect if missing.
- On a public page, don't call requireUser().

```ts
// src/server/auth/supabase.ts
import { createSupabaseServerClient } from '@/server/db/supabase/server'
import { redirect } from 'next/navigation'

export async function requireUser() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/sign-in')
  return data.user
}
```

```tsx
// src/app/app/page.tsx
import { requireUser } from '@/server/auth/supabase'

export default async function AppPage() {
  const user = await requireUser()
  return <div>Welcome {user.email}</div>
}
```

## Where permissions belong

- Permissions belong on the server:
  - `src/server/commands/` (writes)
  - `src/server/queries/` (reads)
- Client checks are only for UX. Do not trust them for security.
- Prefer: `requireUser()` → pass `user.id` into domain logic → enforce rules
  there.

## Environment variables

Required (safe in client code):

- `NEXT_PUBLIC_SUPABASE_URL` -` NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Common mistakes and quick debug

- Server returns null user but client is logged in
  - Usually middleware isn’t running or cookie refresh isn’t happening. Confirm
    `src/middleware.ts` exists and matches your routes.
- Auth works locally but not in prod
  - Usually redirect URL / site URL configuration.
- “Set cookie” errors in server components
  - Expected: Server Components can’t always set cookies. Middleware handles
    refresh; server client’s `setAll()` try/catch is fine.

Minimal sanity checks:

- Hit a gated page and confirm it redirects when logged out.
- Log in, refresh the page, and confirm server-side requireUser() still sees the
  user.

## How to swap auth providers

Client-side auth is decoupled. To swap providers:

1. Create new provider implementation in
   `src/lib/auth/providers/<provider>.client.ts`
   - Import `AuthClient` interface from `../client`
   - Implement `signInWithPassword()`, `signUp()`, `signOut()`
   - Normalize errors to `{ ok: true } | { ok: false; message: string }`

2. Update `src/lib/auth/client.ts`
   - Change the export:
     `export { <newProvider> as authClient } from './providers/<provider>.client'`
   - Feature components (`SignIn`, `SignUp`) require no changes

3. Update server-side helpers in `src/server/auth/supabase.ts`
   - Replace `createSupabaseServerClient()` calls with your provider's server
     client
   - Update `getUser()` and `requireUser()` to use new provider's session API
   - May need to update `src/server/db/supabase/server.ts` or create new server
     client factory

4. Update middleware if cookie handling differs
   - Modify `src/server/db/supabase/proxy.ts` or create provider-specific
     session refresh logic

Most changes are in provider implementation and wiring. Feature components stay
unchanged.

## Conventions and boundaries

- `app/` routes/pages stay thin: gate + compose UI.
- `server/auth/` owns auth policy: who is the user, are they allowed.
- `server/queries|commands/` owns domain rules and data access.
- Keep feature modules small and cohesive; avoid auth logic scattered across
  `features/*`.
