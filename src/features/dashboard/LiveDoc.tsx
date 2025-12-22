'use client'

import { logger } from '@/lib/logger'
import { live, presence, useBroadcast, usePresence } from '@/lib/realtime'
import { showToast } from '@/lib/toast'
import {
  getCurrentUserProfileAction,
  getDocStateAction,
  getUserAction,
  renameDocAction,
  updateDocContentAction
} from '@/server/actions'
import { User } from '@supabase/supabase-js'
import { Eye, FileText } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function LiveDoc() {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('Your Live Document')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState(title)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      // Place cursor at end instead of selecting all
      const length = titleInputRef.current.value.length
      titleInputRef.current.setSelectionRange(length, length)
    }
  }, [isEditingTitle])

  const handleTitleClick = () => {
    setEditTitleValue(title)
    setIsEditingTitle(true)
  }

  const handleConfirm = async () => {
    const newTitle = editTitleValue.trim() || 'Untitled'

    if (!docId) {
      setTitle(newTitle)
      setIsEditingTitle(false)
      return
    }

    // Optimistic update: update UI immediately
    const previousTitle = title
    setTitle(newTitle)
    setIsEditingTitle(false)

    // Call server action in background
    try {
      await renameDocAction(docId, newTitle)
      // Success - title already updated optimistically
      // Broadcast will also update it, but the existing logic prevents double-setting
    } catch (error) {
      // Rollback on error
      setTitle(previousTitle)
      showToast('error', 'light', {
        message: error instanceof Error ? error.message : 'Rename failed'
      })
    }
  }

  const handleCancel = () => {
    setEditTitleValue(title)
    setIsEditingTitle(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const [userId, setUserId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState<string>('')

  // Generate a unique tab ID for presence tracking (so multiple tabs count as separate peers)
  const tabId = useMemo(() => crypto.randomUUID(), [])

  useEffect(() => {
    getUserAction()
      .then((user: User | null) => {
        if (user?.id) {
          setUserId(user.id)
        }
      })
      .catch(error => {
        logger.error('[LiveDoc] Failed to load user:', error)
      })

    getCurrentUserProfileAction()
      .then((profile: { first_name: string; last_name: string } | null) => {
        if (profile) {
          const name = `${profile.first_name} ${profile.last_name}`
          setProfileName(name)
        }
      })
      .catch(error => {
        logger.error('[LiveDoc] Failed to load profile:', error)
      })
  }, [])

  const docId = userId ? `${userId}_doc` : ''
  const presenceChannel = docId ? presence('doc', docId) : ''
  const liveChannel = docId ? live('doc', docId) : ''

  const presenceKey = userId ? `${userId}:${tabId}` : undefined

  const { peersCount } = usePresence(presenceChannel, {
    key: presenceKey,
    state: { name: profileName || 'Anonymous' },
    autoTrack: true
  })

  const { on } = useBroadcast(liveChannel)

  // Throttled content update
  const contentUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch initial document state when docId is available
  useEffect(() => {
    if (!docId) return

    getDocStateAction(docId)
      .then(state => {
        if (state?.title) {
          setTitle(state.title)
        }
        if (state?.content) {
          setContent(state.content)
        }
      })
      .catch(error => {
        logger.error('[LiveDoc] Failed to load doc state:', error)
      })
  }, [docId])

  useEffect(() => {
    if (!docId) return

    // Listen for delta updates (real-time changes)
    on(
      'delta',
      (payload: { type?: string; title?: string; content?: string }) => {
        if (payload.type === 'title_updated' && payload.title) {
          setTitle(currentTitle => {
            if (payload.title && payload.title !== currentTitle) {
              return payload.title
            }
            return currentTitle
          })
          setIsEditingTitle(false)
        }

        if (
          payload.type === 'content_updated' &&
          payload.content !== undefined
        ) {
          setContent(currentContent => {
            if (payload.content !== currentContent) {
              return payload.content!
            }
            return currentContent
          })
        }
      }
    )
  }, [on, docId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className='w-full max-w-2xl rounded-lg border border-neutral-200 bg-white shadow-sm'>
      <div className='flex items-center justify-between gap-1 border-b border-neutral-200 bg-neutral-50 px-4 py-2'>
        <div className='flex items-center gap-1'>
          <FileText className='size-4.5 text-neutral-500' />
          {isEditingTitle ? (
            <div
              className='min-w-0 overflow-hidden rounded border border-neutral-200'
              style={{ width: '20rem' }}
            >
              <input
                ref={titleInputRef}
                type='text'
                value={editTitleValue}
                onChange={e => setEditTitleValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleConfirm}
                className='m-0 w-full border-none bg-white px-1 py-0 text-lg font-medium text-neutral-900 outline-none'
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              />
            </div>
          ) : (
            <h2
              onClick={handleTitleClick}
              className='min-w-0 flex-1 cursor-text truncate px-1 text-lg font-medium text-neutral-900'
            >
              {title || 'Untitled'}
            </h2>
          )}
        </div>
        <div className='flex items-center gap-1.5'>
          <Eye className='size-4.5 text-neutral-500' />
          <span className='text-base font-medium text-neutral-600'>
            {peersCount}
          </span>
        </div>
      </div>
      <div className='px-4 py-2'>
        <textarea
          value={content}
          onChange={e => {
            const newContent = e.target.value
            setContent(newContent)

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
          }}
          placeholder='Start typing...'
          className='w-full resize-none border-none bg-transparent p-0 text-neutral-900 placeholder:text-neutral-400 focus:outline-none'
          rows={8}
        />
      </div>
    </div>
  )
}
