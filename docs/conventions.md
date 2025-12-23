# Project conventions

This doc defines **where code goes** and **how layers interact**. It aims to
keep the repo predictable as it grows.

---

## 1) Where does this go?

Use this decision tree first:

- **Is it a route, layout, provider, or route handler?** → `src/app/`
- **Is it domain-specific UI/logic for one area of the product?** →
  `src/features/<feature>/`
- **Is it server-only business logic or infrastructure (DB/auth/3rd parties)?**
  → `src/server/`
- **Is it a shared UI primitive used across features?** → `src/ui/`

Rule of thumb: **routes in `app/`, domain in `features/`, server internals in
`server/`, shared UI in `ui/`.**

---

## 2) Directory responsibilities

- `src/app/`  
  Next.js App Router: routes, layouts, providers, and `app/api` route handlers.

- `src/features/`  
  Domain modules: feature UI (client and server components) + client hooks +
  feature-level data access.

- `src/server/`  
  Server-only code: business logic, persistence, auth, and integrations. Called
  by server actions and route handlers.

- `src/ui/`  
  Atomic, feature-agnostic UI components (buttons, inputs, dialogs, etc.).

---

## 3) Feature module shape

Default shape for `src/features/<feature>/`:

```text
src/features/<feature>/
├─ components/        # feature-specific UI (client and server components)
├─ hooks/             # feature-specific hooks
├─ api.ts             # TanStack keys + hooks for this feature (expand to api/ if it grows)
├─ types.ts           # feature types (optional)
└─ schemas.ts         # validation schemas (optional)
```

Rules:

- Keep code co-located with the feature by default.
- Promote only truly shared UI to src/ui/.

## 4) Server layer conventions

`src/server/` is the server-only domain layer. It should be usable from any
server boundary.

```
src/server/
├─ db/                # DB client setup and shared DB helpers
├─ auth/              # auth/session helpers (provider-specific code lives here)
├─ queries/           # read operations (no writes)
├─ commands/          # write operations (create/update/delete)
├─ actions/           # shared server actions (for client components to call)
└─ services/          # 3rd-party adapters (email, payments, external APIs)
```

Rules:

- No React imports (except in `actions/` which must use `'use server'`).
- No Request/Response objects.
- `queries/` are read-only; `commands/` mutate state.
- `actions/` are thin wrappers around `queries/` and `commands/` for client
  components.

## 5) Server Actions vs app/api route handlers

Both are valid boundaries. Keep boundaries thin and call into src/server/\*.

**Where server actions live:**

- `src/server/actions/` - All server actions (shared across features)

Use server actions when:

- the caller is your UI (client components)
- it's a form/mutation or tightly-coupled app behavior

Use app/api route handlers when:

- you need an HTTP contract (external clients, public endpoints)
- webhooks / callbacks (Stripe, OAuth, etc.)
- file uploads or custom headers/status codes/streaming

## 6) TanStack Query conventions

TanStack Query is the client caching layer.

Conventions:

- Query keys + hooks live in `features/<feature>/api.ts` (single source of
  truth).
- Naming: `useXQuery`, `useXMutation`.
- After a successful write, invalidate the smallest stable scope:
  - invalidate a list after create/delete
  - invalidate the item after update

## 7) Example flow (end-to-end)

A typical request path:

```text
UI (features/<feature>/components/*)
  → TanStack hook (features/<feature>/api.ts)
  → Boundary (server action in server/actions/* OR app/api/*)
  → Server logic (server/queries/* or server/commands/*)
  → DB/service (server/db/*, server/services/*)
```

**For client components:**

- Use server actions from `server/actions/*` to call server logic
- Actions are organized by domain/feature in `server/actions/` (e.g.,
  `server/actions/docs.ts`, `server/actions/profiles.ts`)

**For server components:**

- Call `server/queries/*` and `server/commands/*` directly (no action wrapper
  needed)

Keep boundaries small; put logic in `features/` (client/domain) or `server/`
(server/domain), not in `app/`.
