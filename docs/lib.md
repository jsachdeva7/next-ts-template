# `src/lib` guide

## `cn.ts` — Tailwind className helper

Use `cn()` when building UI components to compose conditional classes and merge
conflicting Tailwind utilities.

Use it for:

- conditional styles (`active`, `disabled`, `variant`)
- merging className props safely

Example:

```ts
import { cn } from '@/lib/cn'

function Button({ active }: { active?: boolean }) {
  return <button className={cn('px-3 py-2', active && 'opacity-100', 'opacity-70')} />
}
```

## `env.ts` — validated environment variables (Zod)

Use `env` whenever you need an environment variable. Avoid using `process.env.*`
directly.

Why:

- fail fast when variables are missing or malformed
- keep config typed and consistent
- make .env.example authoritative

Conventions:

- `env.client.*` for `NEXT_PUBLIC_*` variables (safe in client code)
- `env.server.*` for server-only values (DB URLs, secrets, service keys)

```ts
import { env } from '@/lib/env'

const apiUrl = env.client.NEXT_PUBLIC_API_URL
// server-only:
const secret = env.server.AUTH_SECRET
```

Adding a new env var:

1. Add it to the appropriate schema in src/lib/env.ts
2. Add it to .env.example
3. Reference it via env.client or env.server

## `http.ts` — JSON fetch wrapper

Use `fetchJson()` as the default for HTTP calls that return JSON (especially
inside TanStack Query `queryFn`/`mutationFn`).

Why:

- consistent JSON parsing
- consistent errors (`HttpError` includes `status` and `body`)
- keeps query functions clean and typed

Example query function:

```ts
import { fetchJson } from '@/lib/http'

type VersionResponse = { version: string }

export function getVersion() {
  return fetchJson<VersionResponse>('/api/version')
}
```

Example error handling:

```ts
import { HttpError } from '@/lib/http'
import { logger } from '@/lib/logger'

try {
  // ...
} catch (e) {
  if (e instanceof HttpError) {
    logger.error('HTTP error', { status: e.status, body: e.body })
  }
}
```

## `logger.ts` — minimal logger wrapper

Use `logger.*` instead of `console.*` so logging stays consistent and can be
upgraded later.

Use it for:

- debugging during development
- tracing key events
- logging caught errors (especially in route handlers)

Example:

```ts
import { logger } from '@/lib/logger'

logger.info('Starting app')
logger.debug('Loaded config', { foo: 'bar' })
logger.warn('Unexpected input')
logger.error('Request failed', new Error('boom'))
```

## `utils.ts` — small pure helpers

`utils.ts` is for tiny helpers that are broadly useful. Keep it minimal.

Included helpers:

- `assert(condition, message)` — throw early and help TypeScript narrow types
- `isDefined(value)` — filter out null/undefined with correct typing
- `sleep(ms)` — small delay helper (tests/demos/retry backoff)

```ts
import { assert, isDefined, sleep } from '@/lib/utils'

assert(user, 'User is required') // user is now non-null
const clean = values.filter(isDefined)
await sleep(200)
```

## `toast.tsx` — toast notifications (react-toastify)

Use `showToast()` to display toast notifications throughout the app. Built on
top of shadcn with a custom Toast component.

Toast types:

- `'success'` — green checkmark icon
- `'error'` — red alert icon
- `'warning'` — amber warning icon
- `'info'` — blue info icon

Toast variants:

- `'light'` — white background (default)
- `'dark'` — dark background

Basic usage:

```ts
import { showToast } from '@/lib/toast'

// Simple info toast
showToast('info', 'light', { message: 'Operation completed' })

// Success toast with dark variant
showToast('success', 'dark', { message: 'Saved successfully!' })

// Error toast
showToast('error', 'light', { message: 'Something went wrong' })
```

With additional options:

```ts
import { showToast } from '@/lib/toast'

showToast(
  'warning',
  'light',
  { message: 'Please review' },
  {
    autoClose: 5000,
    position: 'top-right'
  }
)
```

Note: The `ToastContainer` is configured in `src/app/providers.tsx`. Global
toast styling and behavior (position, auto-close, etc.) can be adjusted there.
