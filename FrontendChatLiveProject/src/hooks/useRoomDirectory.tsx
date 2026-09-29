import { useCallback, useEffect, useState } from 'react'
import type { ChatRoom } from '../types'
import { ApiError, roomsApi } from '../lib/api'

export type DirectoryStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface RoomDirectory {
  readonly results: readonly ChatRoom[]
  readonly status: DirectoryStatus
  readonly error: string | null
  readonly search: string
  readonly setSearch: (value: string) => void
  readonly refresh: () => void
}

const DEBOUNCE = 300

export function useRoomDirectory(active: boolean, community = ''): RoomDirectory {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<readonly ChatRoom[]>([])
  const [status, setStatus] = useState<DirectoryStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!active) return

    const controller = new AbortController()

    const timer = window.setTimeout(
      () => {
        setStatus('loading')
        roomsApi
          .discover(search.trim(), community, controller.signal)
          .then(({ data }) => {
            setResults(data)
            setError(null)
            setStatus('ready')
          })
          .catch((cause: unknown) => {
            if (cause instanceof DOMException && cause.name === 'AbortError') return
            setError(
              cause instanceof ApiError
                ? cause.message
                : 'Could not load available rooms.',
            )
            setStatus('error')
          })
      },
      search ? DEBOUNCE : 0,
    )

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [active, search, community, reload])

  const refresh = useCallback(() => setReload((value) => value + 1), [])

  return { results, status, error, search, setSearch, refresh }
}
