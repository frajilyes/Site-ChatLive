import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ChatMessage, ChatRoom, ChatUser, MemberRole, Presence } from '../types'
import { ApiError, roomsApi } from '../lib/api'
import { getSocket, isSocketConnected, subscribeSocketStatus } from '../lib/socket'

export type ChatStatus = 'loading' | 'ready' | 'error'

export interface ChatController {
  readonly rooms: readonly ChatRoom[]
  readonly activeRoom: ChatRoom | null
  readonly messages: readonly ChatMessage[]
  readonly members: readonly ChatUser[]
  readonly typingUsers: readonly ChatUser[]
  readonly status: ChatStatus
  readonly error: string | null
  readonly connected: boolean
  readonly sending: boolean
  readonly selectRoom: (roomId: string) => void
  readonly sendMessage: (body: string) => Promise<boolean>
  readonly notifyTyping: (active: boolean) => void
  readonly joinRoom: (roomId: string) => Promise<boolean>
  readonly createRoom: (payload: {
    name: string
    topic: string
    emoji?: string
  }) => Promise<boolean>
  readonly setMemberRole: (userId: string, role: MemberRole) => Promise<boolean>
  readonly removeMember: (userId: string) => Promise<boolean>
}

function mergeMessage(
  list: readonly ChatMessage[],
  message: ChatMessage,
): readonly ChatMessage[] {
  const index = list.findIndex((item) => item.id === message.id)
  if (index === -1) return [...list, message]

  const next = list.slice()
  next[index] = message
  return next
}

function bumpRoom(
  list: readonly ChatRoom[],
  roomId: string,
  changes: (room: ChatRoom) => ChatRoom,
): readonly ChatRoom[] {
  const room = list.find((item) => item.id === roomId)
  if (!room) return list
  return [changes(room), ...list.filter((item) => item.id !== roomId)]
}

const TYPING_TIMEOUT = 4000

export function useChat(currentUserId: string | undefined): ChatController {
  const [rooms, setRooms] = useState<readonly ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<readonly ChatMessage[]>([])
  const [members, setMembers] = useState<readonly ChatUser[]>([])
  const [typingUsers, setTypingUsers] = useState<readonly ChatUser[]>([])
  const [status, setStatus] = useState<ChatStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const connected = useSyncExternalStore(subscribeSocketStatus, isSocketConnected)

  const activeRoomRef = useRef<string | null>(null)
  const typingTimers = useRef(new Map<string, number>())

  useEffect(() => {
    activeRoomRef.current = activeRoomId
  }, [activeRoomId])

  useEffect(() => {
    const controller = new AbortController()

    roomsApi
      .list(controller.signal)
      .then(({ data }) => {
        setRooms(data)
        setActiveRoomId((current) => current ?? data[0]?.id ?? null)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(
          cause instanceof ApiError ? cause.message : 'Could not load rooms.',
        )
        setStatus('error')
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!activeRoomId) return

    const controller = new AbortController()

    Promise.all([
      roomsApi.messages(activeRoomId, 50, controller.signal),
      roomsApi.members(activeRoomId, controller.signal),
    ])
      .then(([thread, roomMembers]) => {
        setMessages(thread.data)
        setMembers(roomMembers.data)
        setTypingUsers([])
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(cause instanceof ApiError ? cause.message : 'Room unavailable.')
      })

    void roomsApi
      .markRead(activeRoomId)
      .then(() => {
        setRooms((current) =>
          current.map((room) => (room.id === activeRoomId ? { ...room, unread: 0 } : room)),
        )
      })
      .catch(() => {})

    const socket = getSocket()
    socket?.emit('room:join', activeRoomId)
    socket?.emit('message:read', activeRoomId)

    return () => {
      controller.abort()
      socket?.emit('room:leave', activeRoomId)
    }
  }, [activeRoomId])

  const forgetTyping = useCallback((userId: string) => {
    const timer = typingTimers.current.get(userId)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      typingTimers.current.delete(userId)
    }
    setTypingUsers((current) => current.filter((item) => item.id !== userId))
  }, [])

  const rememberTyping = useCallback(
    (user: ChatUser) => {
      const timers = typingTimers.current
      const running = timers.get(user.id)
      if (running !== undefined) window.clearTimeout(running)

      timers.set(user.id, window.setTimeout(() => forgetTyping(user.id), TYPING_TIMEOUT))

      setTypingUsers((current) =>
        current.some((item) => item.id === user.id) ? current : [...current, user],
      )
    },
    [forgetTyping],
  )

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const onConnect = () => {
      const roomId = activeRoomRef.current
      if (roomId) socket.emit('room:join', roomId)
    }

    const onMessage = ({ roomId, message }: { roomId: string; message: ChatMessage }) => {
      forgetTyping(message.authorId)

      if (roomId === activeRoomRef.current) {
        setMessages((current) => mergeMessage(current, message))
        setRooms((current) => bumpRoom(current, roomId, (room) => ({ ...room, unread: 0 })))
        socket.emit('message:read', roomId)
        return
      }

      setRooms((current) =>
        bumpRoom(current, roomId, (room) => ({
          ...room,
          unread: message.authorId === currentUserId ? room.unread : room.unread + 1,
        })),
      )
    }

    const onMessageUpdated = ({ roomId, message }: { roomId: string; message: ChatMessage }) => {
      if (roomId !== activeRoomRef.current) return
      setMessages((current) => mergeMessage(current, message))
    }

    const onMessageDeleted = ({ roomId, id }: { roomId: string; id: string }) => {
      if (roomId !== activeRoomRef.current) return
      setMessages((current) => current.filter((message) => message.id !== id))
    }

    const onTyping = ({
      roomId,
      user,
      typing,
    }: {
      roomId: string
      user: ChatUser
      typing: boolean
    }) => {
      if (roomId !== activeRoomRef.current || user.id === currentUserId) return
      if (typing) rememberTyping(user)
      else forgetTyping(user.id)
    }

    const onPresence = ({ userId, presence }: { userId: string; presence: Presence }) => {
      setMembers((current) =>
        current.map((member) => (member.id === userId ? { ...member, presence } : member)),
      )
    }

    const onMemberJoined = ({ roomId, member }: { roomId: string; member: ChatUser }) => {
      if (roomId !== activeRoomRef.current) return
      setMembers((current) =>
        current.some((item) => item.id === member.id) ? current : [...current, member],
      )
    }

    const onMemberLeft = ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (roomId !== activeRoomRef.current) return
      setMembers((current) => current.filter((member) => member.id !== userId))
    }

    const onRoomUpdated = (room: ChatRoom) => {
      setRooms((current) =>
        current.map((item) => (item.id === room.id ? { ...room, unread: item.unread } : item)),
      )
    }

    const onRoomDeleted = ({ id }: { id: string }) => {
      setRooms((current) => {
        const next = current.filter((room) => room.id !== id)
        if (activeRoomRef.current === id) setActiveRoomId(next[0]?.id ?? null)
        return next
      })
    }

    socket.on('connect', onConnect)
    socket.on('message:new', onMessage)
    socket.on('message:updated', onMessageUpdated)
    socket.on('message:deleted', onMessageDeleted)
    socket.on('typing', onTyping)
    socket.on('presence:update', onPresence)
    socket.on('room:member-joined', onMemberJoined)
    socket.on('room:member-left', onMemberLeft)
    socket.on('room:updated', onRoomUpdated)
    socket.on('room:deleted', onRoomDeleted)

    const timers = typingTimers.current

    return () => {
      socket.off('connect', onConnect)
      socket.off('message:new', onMessage)
      socket.off('message:updated', onMessageUpdated)
      socket.off('message:deleted', onMessageDeleted)
      socket.off('typing', onTyping)
      socket.off('presence:update', onPresence)
      socket.off('room:member-joined', onMemberJoined)
      socket.off('room:member-left', onMemberLeft)
      socket.off('room:updated', onRoomUpdated)
      socket.off('room:deleted', onRoomDeleted)

      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [currentUserId, forgetTyping, rememberTyping])

  const selectRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId)
  }, [])

  const sendMessage = useCallback(async (body: string): Promise<boolean> => {
    const roomId = activeRoomRef.current
    const text = body.trim()
    if (!roomId || !text) return false

    setSending(true)
    try {
      const { message } = await roomsApi.send(roomId, text)
      setMessages((current) => mergeMessage(current, message))
      setRooms((current) => bumpRoom(current, roomId, (room) => ({ ...room, unread: 0 })))
      setError(null)
      return true
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not send.')
      return false
    } finally {
      setSending(false)
    }
  }, [])

  const adoptRoom = useCallback((room: ChatRoom) => {
    setRooms((current) =>
      current.some((item) => item.id === room.id) ? current : [room, ...current],
    )
    setActiveRoomId(room.id)
    setStatus('ready')
  }, [])

  const joinRoom = useCallback(
    async (roomId: string): Promise<boolean> => {
      try {
        const { room } = await roomsApi.join(roomId)
        adoptRoom(room)
        setError(null)
        return true
      } catch (cause) {
        setError(
          cause instanceof ApiError ? cause.message : 'Could not join this room.',
        )
        return false
      }
    },
    [adoptRoom],
  )

  const createRoom = useCallback(
    async (payload: { name: string; topic: string; emoji?: string }): Promise<boolean> => {
      try {
        const { room } = await roomsApi.create(payload)
        adoptRoom(room)
        setError(null)
        return true
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : 'Could not create the room.')
        return false
      }
    },
    [adoptRoom],
  )

  const notifyTyping = useCallback((active: boolean) => {
    const roomId = activeRoomRef.current
    const socket = getSocket()
    if (!roomId || !socket) return
    socket.emit(active ? 'typing:start' : 'typing:stop', roomId)
  }, [])

  const reloadMembers = useCallback(async (roomId: string) => {
    const { data } = await roomsApi.members(roomId)
    setMembers(data)
  }, [])

  const setMemberRole = useCallback(
    async (userId: string, role: MemberRole): Promise<boolean> => {
      if (!activeRoomId) return false
      try {
        const { room } = await roomsApi.setMemberRole(activeRoomId, userId, role)
        setRooms((current) =>
          current.map((entry) => (entry.id === room.id ? { ...entry, ...room } : entry)),
        )
        await reloadMembers(activeRoomId)
        setError(null)
        return true
      } catch (cause) {
        setError(
          cause instanceof ApiError ? cause.message : 'Could not change the role.',
        )
        return false
      }
    },
    [activeRoomId, reloadMembers],
  )

  const removeMember = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!activeRoomId) return false
      try {
        await roomsApi.removeMember(activeRoomId, userId)
        await reloadMembers(activeRoomId)
        setError(null)
        return true
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : 'Could not remove the member.')
        return false
      }
    },
    [activeRoomId, reloadMembers],
  )

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [rooms, activeRoomId],
  )

  return useMemo<ChatController>(
    () => ({
      rooms,
      activeRoom,
      messages,
      members,
      typingUsers,
      status,
      error,
      connected,
      sending,
      selectRoom,
      sendMessage,
      notifyTyping,
      joinRoom,
      createRoom,
      setMemberRole,
      removeMember,
    }),
    [
      rooms,
      activeRoom,
      messages,
      members,
      typingUsers,
      status,
      error,
      connected,
      sending,
      selectRoom,
      sendMessage,
      notifyTyping,
      joinRoom,
      createRoom,
      setMemberRole,
      removeMember,
    ],
  )
}
