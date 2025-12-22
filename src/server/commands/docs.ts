import { broadcastLive } from '@/server/services/realtime/broadcast'
import { setDocState } from '@/server/services/realtime/state'

export interface DocRenameResult {
  title: string
  updatedAt: string
}

/**
 * Renames a document and broadcasts the update to all connected clients.
 *
 * @param docId - The document identifier
 * @param title - The new title
 * @returns The updated title and timestamp
 * @throws Error if validation fails or user is not authenticated
 */
export async function renameDoc(
  docId: string,
  title: string
): Promise<DocRenameResult> {
  if (!title || title.trim().length === 0) {
    throw new Error('Title cannot be empty')
  }

  if (title.length > 100) {
    throw new Error('Title too long')
  }

  const trimmedTitle = title.trim()

  // Update server state (source of truth)
  setDocState(docId, { title: trimmedTitle })

  // Broadcast delta update
  await broadcastLive('doc', docId, 'delta', {
    type: 'title_updated',
    title: trimmedTitle
  })

  return {
    title: trimmedTitle,
    updatedAt: new Date().toISOString()
  }
}

/**
 * Updates document content and broadcasts the update to all connected clients.
 *
 * @param docId - The document identifier
 * @param content - The new content
 * @throws Error if user is not authenticated
 */
export async function updateDocContent(
  docId: string,
  content: string
): Promise<void> {
  // Update server state (source of truth)
  setDocState(docId, { content })

  // Broadcast delta update
  await broadcastLive('doc', docId, 'delta', {
    type: 'content_updated',
    content
  })
}
