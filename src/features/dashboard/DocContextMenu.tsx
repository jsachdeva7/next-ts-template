'use client'

import { logger } from '@/lib/logger'
import { showToast } from '@/lib/toast'
import { updateDocContentAction } from '@/server/actions'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/ui/ContextMenu'
import { Clipboard, Copy, Scissors, Trash2 } from 'lucide-react'
import { ReactNode, RefObject } from 'react'

interface DocContextMenuProps {
  children: ReactNode
  textareaRef: RefObject<HTMLTextAreaElement | null>
  content: string
  setContent: (content: string) => void
  contentUpdateTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  docId: string
}

export default function DocContextMenu({
  children,
  textareaRef,
  content,
  setContent,
  contentUpdateTimeoutRef,
  docId
}: DocContextMenuProps) {
  const handleCut = async () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start === end) {
      // Nothing selected, can't cut
      return
    }

    const selectedText = textarea.value.substring(start, end)

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(selectedText)
      showToast('success', 'light', { message: 'Cut to clipboard' })

      // Delete selected text
      const newContent = content.substring(0, start) + content.substring(end)
      setContent(newContent)

      // Update cursor position
      setTimeout(() => {
        textarea.setSelectionRange(start, start)
        textarea.focus()
      }, 0)

      // Throttle: send update after 500ms of no changes
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current)
      }

      if (docId) {
        contentUpdateTimeoutRef.current = setTimeout(async () => {
          try {
            await updateDocContentAction(docId, newContent)
          } catch (error) {
            logger.error('[LiveDoc] Failed to update content:', error)
          }
        }, 500)
      }
    } catch (error) {
      logger.error('[LiveDoc] Failed to cut:', error)
      showToast('error', 'light', { message: 'Failed to cut' })
    }
  }

  const handleCopy = async () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const selectedText = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    )

    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText)
        showToast('success', 'light', { message: 'Copied to clipboard' })
      } catch (error) {
        logger.error('[LiveDoc] Failed to copy:', error)
        showToast('error', 'light', { message: 'Failed to copy' })
      }
    } else {
      // Copy all if nothing selected
      try {
        await navigator.clipboard.writeText(content)
        showToast('success', 'light', { message: 'Copied to clipboard' })
      } catch (error) {
        logger.error('[LiveDoc] Failed to copy:', error)
        showToast('error', 'light', { message: 'Failed to copy' })
      }
    }
  }

  const handlePaste = async () => {
    const textarea = textareaRef.current
    if (!textarea) return

    try {
      const clipboardText = await navigator.clipboard.readText()
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent =
        content.substring(0, start) + clipboardText + content.substring(end)

      setContent(newContent)

      // Update cursor position
      const newCursorPos = start + clipboardText.length
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)

      // Throttle: send update after 500ms of no changes
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current)
      }

      if (docId) {
        contentUpdateTimeoutRef.current = setTimeout(async () => {
          try {
            await updateDocContentAction(docId, newContent)
          } catch (error) {
            logger.error('[LiveDoc] Failed to update content:', error)
          }
        }, 500)
      }
    } catch (error) {
      logger.error('[LiveDoc] Failed to paste:', error)
      showToast('error', 'light', { message: 'Failed to paste' })
    }
  }

  const handleDelete = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start !== end) {
      // Delete selected text
      const newContent = content.substring(0, start) + content.substring(end)
      setContent(newContent)

      // Update cursor position
      setTimeout(() => {
        textarea.setSelectionRange(start, start)
        textarea.focus()
      }, 0)

      // Throttle: send update after 500ms of no changes
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current)
      }

      if (docId) {
        contentUpdateTimeoutRef.current = setTimeout(async () => {
          try {
            await updateDocContentAction(docId, newContent)
          } catch (error) {
            logger.error('[LiveDoc] Failed to update content:', error)
          }
        }, 500)
      }
    } else {
      // Clear all content if nothing selected
      setContent('')

      if (docId) {
        contentUpdateTimeoutRef.current = setTimeout(async () => {
          try {
            await updateDocContentAction(docId, '')
          } catch (error) {
            logger.error('[LiveDoc] Failed to update content:', error)
          }
        }, 500)
      }
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleCut}>
          <Scissors className='size-4' />
          Cut
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className='size-4' />
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePaste}>
          <Clipboard className='size-4' />
          Paste
        </ContextMenuItem>
        <ContextMenuItem variant='destructive' onClick={handleDelete}>
          <Trash2 className='size-4' />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
