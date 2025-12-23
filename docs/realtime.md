# Supabase Realtime Guide

## What "realtime" means in this template

- Realtime is built on Supabase Realtime (WebSocket-based pub/sub).
- Provides two patterns: **presence** (who's online) and **broadcast**
  (one-to-many messaging).
- For request/response patterns, we use **server actions** combined with
  broadcast for fanout.
- All hooks handle connection lifecycle and cleanup automatically to prevent
  leaks.

## Where realtime lives

- `src/lib/realtime/*` Domain-agnostic hooks and helpers for realtime
  communication.
  - `client.ts` - Supabase client factory for realtime operations
  - `channels.ts` - Channel naming conventions and helpers
  - `types.ts` - Standard event types and message envelopes
  - `useChannel.ts` - Core hook managing channel lifecycle (used by other hooks)
  - `usePresence.ts` - Hook for tracking who's online
  - `useBroadcast.ts` - Hook for one-to-many messaging
  - `index.ts` - Public API exports
- `src/features/*` Feature components use realtime hooks for live updates.
- `src/server/services/realtime/broadcast.ts` - Server-side utility for
  broadcasting to realtime channels
- `src/server/commands/*` - Commands that perform business logic and broadcast
  updates
- `src/server/actions/*` - Server actions that call commands (used by client
  components)

## Channel naming conventions

Use the helper functions to build channel names consistently:

- `presence('type', 'id')` → `presence:topic:type:id` (for presence tracking)
- `live('type', 'id')` → `live:topic:type:id` (for live data updates)

This prevents magic strings and naming collisions.

---

## Presence

**What it does:** Tracks who's currently online/active on a channel and their
ephemeral state.

**When to use it:**

- Show "X users viewing this document"
- Display active users in a chat room
- Track cursors/selections in collaborative editors
- Show online/offline status

### Basic usage

```tsx
import { presence, usePresence } from '@/lib/realtime'

function ChatRoom({ roomId }: { roomId: string }) {
  const { user } = useAuth()

  const { peersCount, peers } = usePresence(presence('room', roomId), {
    key: user?.id,
    state: { name: user?.name, status: 'active' },
    autoTrack: true
  })

  return (
    <div>
      <p>{peersCount} people online</p>
      <ul>
        {peers.map(peer => (
          <li key={peer.key}>{peer.states[0]?.name} is online</li>
        ))}
      </ul>
    </div>
  )
}
```

### Multi-tab presence

When you want each browser tab to count as a separate "peer":

```tsx
import { presence, usePresence } from '@/lib/realtime'
import { useMemo } from 'react'

function LiveDoc() {
  const { userId, profileName } = useAuth()

  // Generate a unique tab ID (only once per component mount)
  const tabId = useMemo(() => crypto.randomUUID(), [])

  // Combine userId with tabId so multiple tabs from same user count separately
  const presenceKey = userId ? `${userId}:${tabId}` : undefined

  const { peersCount } = usePresence(presence('doc', docId), {
    key: presenceKey,
    state: { name: profileName || 'Anonymous' },
    autoTrack: true
  })

  return <div>{peersCount} viewers</div>
}
```

### Manual tracking

Track presence state manually (useful when state changes based on user actions):

```tsx
function GameLobby({ gameId }: { gameId: string }) {
  const { peers, track, status } = usePresence(presence('game', gameId), {
    key: userId,
    autoTrack: false // Don't auto-track
  })

  const handleJoinGame = () => {
    track({
      status: 'ready',
      character: selectedCharacter,
      team: 'red'
    })
  }

  const handleLeaveGame = () => {
    // Clear presence (Supabase will automatically remove after timeout)
    track({})
  }

  return (
    <div>
      <button onClick={handleJoinGame}>Join Game</button>
      <p>Players: {peers.length}</p>
    </div>
  )
}
```

### Checking if a specific user is online

```tsx
function UserStatus({ targetUserId }: { targetUserId: string }) {
  const { isOnline } = usePresence(presence('global', 'users'), {
    key: currentUserId,
    state: { name: currentUserName },
    autoTrack: true
  })

  return (
    <div>
      {isOnline(targetUserId) ? (
        <span className='text-green-500'>● Online</span>
      ) : (
        <span className='text-gray-500'>○ Offline</span>
      )}
    </div>
  )
}
```

### Presence API reference

**`usePresence(channelName, options)`**

**Parameters:**

- `channelName` - Channel name (use `presence('type', 'id')` helper)
- `options.key` - Unique identifier for this presence instance (typically
  `userId` or `userId:tabId`)
- `options.state` - Initial presence state to publish (arbitrary object, e.g.,
  `{ name: 'John', status: 'active' }`)
- `options.autoTrack` - Automatically track state when connected (default:
  `true` if `state` provided)
- `options.private` - Whether channel requires authentication (default: `true`)
- `options.debugLabel` - Label for debugging logs (optional)

**Returns:**

- `status` - Connection status
  (`'connecting' | 'connected' | 'disconnected' | 'closed'`)
- `peers` - Array of currently present peers (each has `key` and `states[]`)
- `peersCount` - Number of peers (convenience for `peers.length`)
- `rawPresenceState` - Raw presence state map from Supabase (key → states[])
- `track(state)` - Manually update your presence state
- `isOnline(key)` - Check if a specific key is currently online

---

## Broadcast

**What it does:** One-to-many messaging pattern. Send a message once, all
subscribers receive it.

**When to use it:**

- Live updates to shared state (document edits, game state)
- Notifications/alerts broadcast to all users
- Chat messages in a room

### Usage (scaffold)

```tsx
import { live, useBroadcast } from '@/lib/realtime'

function CollaborativeEditor({ documentId }: { documentId: string }) {
  const { send, on } = useBroadcast(live('doc', documentId))

  useEffect(() => {
    // Listen for update events
    on('update', payload => {
      console.log('Received update:', payload)
    })
  }, [on])

  const handleChange = (newContent: string) => {
    // Broadcast the change to all subscribers
    send('update', { content: newContent, userId: currentUserId })
  }

  return <textarea onChange={e => handleChange(e.target.value)} />
}
```

_Note: This is a scaffold. Implementation details may vary once tested._

---

## Server Actions + Broadcast (Request/Response with Fanout)

**What it does:** Use Next.js server actions for request/response patterns,
combined with broadcast for fanout to all connected clients.

**When to use it:**

- Mutations that need validation or database updates
- Operations that should update all connected clients
- Server-side business logic with realtime fanout

**How it works:**

1. Client calls a server action
2. Server action calls a command (in `src/server/commands/`)
3. Command performs validation/business logic
4. Command broadcasts update to all clients via `broadcastLive()`
5. All clients listening to the live channel receive the update

### Example: Renaming a Document

**Server Action** (`src/server/actions/docs.ts`):

```tsx
'use server'

import { renameDoc } from '@/server/commands/docs'

export async function renameDocAction(
  docId: string,
  title: string
): Promise<{ title: string; updatedAt: string }> {
  return renameDoc(docId, title)
}
```

**Command** (`src/server/commands/docs.ts`):

```tsx
import { broadcastLive } from '@/server/services/realtime/broadcast'

export async function renameDoc(
  docId: string,
  title: string
): Promise<{ title: string; updatedAt: string }> {
  // Validate
  if (!title || title.trim().length === 0) {
    throw new Error('Title cannot be empty')
  }

  const trimmedTitle = title.trim()

  // Broadcast to all clients
  await broadcastLive('doc', docId, 'delta', {
    type: 'title_updated',
    title: trimmedTitle
  })

  return {
    title: trimmedTitle,
    updatedAt: new Date().toISOString()
  }
}
```

**Client Component**:

```tsx
'use client'

import { live, useBroadcast } from '@/lib/realtime'
import { renameDocAction } from '@/server/actions'

function LiveDocument({ docId }: { docId: string }) {
  const [title, setTitle] = useState('My Document')
  const { on } = useBroadcast(live('doc', docId))

  // Listen for updates from any client (including this one)
  useEffect(() => {
    on('delta', (payload: { type?: string; title?: string }) => {
      if (payload.type === 'title_updated' && payload.title) {
        setTitle(currentTitle => {
          // Only update if different to avoid double-set
          return payload.title !== currentTitle ? payload.title : currentTitle
        })
      }
    })
  }, [on])

  const handleRename = async (newTitle: string) => {
    try {
      // Call server action (returns immediately on success)
      const result = await renameDocAction(docId, newTitle)
      setTitle(result.title) // Optimistic update
    } catch (error) {
      // Handle error (validation failed, etc.)
      console.error('Rename failed:', error)
    }
  }

  return <input value={title} onChange={e => handleRename(e.target.value)} />
}
```

**Key Points:**

- Server actions handle validation and business logic
- `broadcastLive()` sends updates to all clients on the live channel
- Clients listen to the live channel for real-time updates
- The initiating client updates optimistically from the action response
- Other clients (and the initiating client via broadcast) sync via the live
  channel

---

## Common patterns

### Combining presence with broadcast

Track who's online and broadcast updates to them:

```tsx
function LiveDocument({ docId }: { docId: string }) {
  const { peersCount } = usePresence(presence('doc', docId), {
    key: `${userId}:${tabId}`,
    state: { name: userName },
    autoTrack: true
  })

  const { send, on } = useBroadcast(live('doc', docId))

  useEffect(() => {
    on('content_update', payload => {
      // Apply remote changes
      setContent(payload.content)
    })
  }, [on])

  const handleChange = (newContent: string) => {
    setContent(newContent)
    send('content_update', { content: newContent })
  }

  return (
    <div>
      <div>{peersCount} viewers</div>
      <textarea value={content} onChange={e => handleChange(e.target.value)} />
    </div>
  )
}
```

### Handling connection status

All hooks return a `status` that you can use for UX:

```tsx
function RealtimeComponent() {
  const { status, peers } = usePresence(channelName, options)

  if (status === 'connecting') {
    return <div>Connecting...</div>
  }

  if (status === 'disconnected') {
    return <div>Disconnected. Retrying...</div>
  }

  return <div>{peers.length} peers online</div>
}
```

---

## Channel privacy and authentication

By default, all channels are **private** (require authentication):

```tsx
// Private channel (default)
const { peers } = usePresence(presence('doc', docId), {
  key: userId
  // private: true is the default
})

// Public channel (if needed)
const { peers } = usePresence(presence('public', 'room'), {
  key: userId,
  private: false
})
```

For presence specifically, private channels require `config.private = true` and
`config.presence.key = <user.id>`, which is handled automatically when you
provide a `key`.

---

## Troubleshooting

### Presence shows 0 peers even when connected

- **Check `autoTrack`:** If `state` is provided, ensure `autoTrack: true` (it's
  the default).
- **Check `key`:** Make sure you're providing a valid `key`. Without it,
  presence won't track correctly.
- **Check channel name:** Ensure the channel name is non-empty (e.g., wait for
  `userId` before creating channel).
- **Check connection status:** Verify `status === 'connected'` before expecting
  presence data.

### Presence count doesn't update live

- **Check state updates:** Ensure you're creating new object references when
  updating state (the hook uses spread operator internally).
- **Multiple tabs from same user:** Use `userId:tabId` as the key to count each
  tab separately.

### Channel errors or connection failures

- **Check Supabase config:** Verify `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set.
- **Check Realtime enabled:** Ensure Realtime is enabled in your Supabase
  project for the relevant tables (if using database-backed channels).
- **Check authentication:** For private channels, ensure the user is
  authenticated.

---

## Environment variables

Required (safe in client code):

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key

These are already configured for auth and work for realtime as well.

---

## Conventions and boundaries

- **Channel naming:** Always use helpers (`presence()`, `live()`) instead of
  magic strings.
- **Lifecycle:** Hooks handle subscription/cleanup automatically. Don't manually
  subscribe/unsubscribe.
- **State updates:** For presence, update state by calling `track()` with new
  state. Don't mutate existing state objects.
- **Error handling:** Check `status` for connection state. Handle errors in
  `send()` calls (broadcast/RPC).
