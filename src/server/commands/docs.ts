import { broadcastLive } from '@/server/services/realtime/broadcast'

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
 * @throws Error if validation fails
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

  await broadcastLive('doc', docId, 'delta', {
    type: 'title_updated',
    title: trimmedTitle
  })

  return {
    title: trimmedTitle,
    updatedAt: new Date().toISOString()
  }
}
