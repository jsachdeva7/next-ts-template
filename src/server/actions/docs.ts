'use server'

import type { DocRenameResult } from '@/server/commands/docs'
import { renameDoc, updateDocContent } from '@/server/commands/docs'
import { getDocState } from '@/server/services/realtime/state'

/**
 * Server action to get the current state of a document.
 *
 * @param docId - The document identifier
 * @returns The document state, or null if not found
 */
export async function getDocStateAction(docId: string) {
  const state = getDocState(docId)
  return state || null
}

/**
 * Server action to rename a document.
 *
 * @param docId - The document identifier
 * @param title - The new title
 * @returns The updated title and timestamp
 * @throws Error if validation fails or broadcast fails
 */
export async function renameDocAction(
  docId: string,
  title: string
): Promise<DocRenameResult> {
  try {
    return await renameDoc(docId, title)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to rename document: ${errorMessage}`)
  }
}

/**
 * Server action to update document content.
 *
 * @param docId - The document identifier
 * @param content - The new content
 * @throws Error if broadcast fails
 */
export async function updateDocContentAction(
  docId: string,
  content: string
): Promise<void> {
  try {
    return await updateDocContent(docId, content)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to update content: ${errorMessage}`)
  }
}
