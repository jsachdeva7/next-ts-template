# Supabase Realtime Guide

## What "realtime" means in this template

- Realtime is built on Supabase Realtime (WebSocket-based pub/sub).
- Provides three patterns: **presence** (who's online), **broadcast**
  (one-to-many messaging), and **RPC** (request/response).
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
  - `useRpc.ts` - Hook for request/response patterns
  - `index.ts` - Public API exports
- `src/features/*` Feature components use realtime hooks for live updates.

## Channel naming conventions

Use the helper functions to build channel names consistently:

- `presence('type', 'id')` → `presence:topic:type:id` (for presence tracking)
- `live('type', 'id')` → `live:topic:type:id` (for live data updates)
- `ctrl('type', 'id')` → `ctrl:topic:type:id` (for control/RPC messages)

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

## RPC (Request/Response)

**What it does:** Bidirectional request/response pattern over realtime channels.
Like calling a function remotely.

**When to use it:**

- Worker/background task communication
- Requesting data from another client
- Command/acknowledgment patterns

### Usage (scaffold)

```tsx
import { ctrl, useRpc } from '@/lib/realtime'

function WorkerClient() {
  const { call, notify } = useRpc(ctrl('worker', 'main'))

  const handleProcessTask = async () => {
    try {
      // Send request and wait for response
      const result = await call('process', { taskId: '123' })
      console.log('Task completed:', result)
    } catch (error) {
      console.error('RPC failed:', error)
    }
  }

  return <button onClick={handleProcessTask}>Process Task</button>
}
```

_Note: This is a scaffold. Implementation details may vary once tested._

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

- **Channel naming:** Always use helpers (`presence()`, `live()`, `ctrl()`)
  instead of magic strings.
- **Lifecycle:** Hooks handle subscription/cleanup automatically. Don't manually
  subscribe/unsubscribe.
- **State updates:** For presence, update state by calling `track()` with new
  state. Don't mutate existing state objects.
- **Error handling:** Check `status` for connection state. Handle errors in
  `send()` calls (broadcast/RPC).
