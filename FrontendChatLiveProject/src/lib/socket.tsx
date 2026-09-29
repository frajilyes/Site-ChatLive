import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '../types/socket'
import { API_URL, readToken } from './api'
import { SESSION_CLOSED_EVENT } from './auth-storage'

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: ChatSocket | null = null

let openedWith: string | null = null

export function getSocket(): ChatSocket | null {
  const token = readToken()

  if (!token) {
    closeSocket()
    return null
  }

  if (socket && openedWith === token) return socket

  closeSocket()
  openedWith = token

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  return socket
}

export function closeSocket(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  openedWith = null
}

export function peekSocket(): ChatSocket | null {
  return socket
}

export function isSocketConnected(): boolean {
  return peekSocket()?.connected ?? false
}

window.addEventListener(SESSION_CLOSED_EVENT, closeSocket)

export function subscribeSocketStatus(listener: () => void): () => void {
  const current = getSocket()
  if (!current) return () => {}

  current.on('connect', listener)
  current.on('disconnect', listener)

  return () => {
    current.off('connect', listener)
    current.off('disconnect', listener)
  }
}
