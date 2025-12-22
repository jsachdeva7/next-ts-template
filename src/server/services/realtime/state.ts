interface DocState {
  title: string
  content: string
  updatedAt: string
}

const docState = new Map<string, DocState>()

/**
 * Gets the current state for a document.
 *
 * @param docId - The document identifier (e.g., "user-123_doc")
 * @returns The document state, or undefined if not found
 */
export function getDocState(docId: string): DocState | undefined {
  return docState.get(docId)
}

/**
 * Sets the state for a document. Accepts partial updates.
 *
 * @param docId - The document identifier (e.g., "user-123_doc")
 * @param updates - Partial document state updates
 */
export function setDocState(
  docId: string,
  updates: { title?: string; content?: string }
): void {
  const current = docState.get(docId) || {
    title: 'Untitled',
    content: '',
    updatedAt: new Date().toISOString()
  }

  docState.set(docId, {
    title: updates.title ?? current.title,
    content: updates.content ?? current.content,
    updatedAt: new Date().toISOString()
  })
}
