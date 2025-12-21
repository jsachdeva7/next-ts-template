'use server'

import type { DocRenameResult } from '@/server/commands/docs'
import { renameDoc } from '@/server/commands/docs'

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
