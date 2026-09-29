import type {
  AdminTestimonial,
  AuthUser,
  MemberRole,
  ChatMessage,
  ChatRoom,
  ChatUser,
  Community,
  ContentEntry,
  ContentSection,
  Metric,
  MetricValues,
  Presence,
  ServiceStatus,
  Showcase,
  SiteBundle,
  SiteIdentity,
  Stat,
  Testimonial,
  TestimonialStatus,
  UserRole,
} from '../types'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  '',
)

const TOKEN_KEY = 'chatlive-token'

let memoryToken: string | null = null

export function readToken(): string | null {
  if (memoryToken) return memoryToken
  try {
    memoryToken = window.localStorage.getItem(TOKEN_KEY)
  } catch {
    memoryToken = null
  }
  return memoryToken
}

export function writeToken(token: string): void {
  memoryToken = token
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}

export function clearToken(): void {
  memoryToken = null
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export class ApiError extends Error {
  readonly status: number

  readonly field?: string

  readonly code?: string

  readonly retryAfter?: number

  constructor(
    message: string,
    status: number,
    field?: string,
    code?: string,
    retryAfter?: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.field = field
    this.code = code
    this.retryAfter = retryAfter
  }
}

export const UNAUTHORIZED_EVENT = 'chatlive:unauthorized'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

function takeEarlyResponse(path: string): Promise<EarlyResponse | null> | null {
  const pending = window.__CHATLIVE_BOOT__?.[path]
  if (!pending) return null

  delete window.__CHATLIVE_BOOT__?.[path]
  return pending
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? readToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const early = method === 'GET' && !auth ? takeEarlyResponse(path) : null

  let status: number
  let raw: string
  try {
    const answer = (await early) ?? (await send(path, { method, headers, body, signal }))
    status = answer.status
    raw = answer.text
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('The ChatLive server cannot be reached right now.', 0)
  }

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const payload: unknown = raw ? safeParse(raw) : null

  if (status < 200 || status >= 300) {
    const details = (payload ?? {}) as {
      message?: string
      field?: string
      code?: string
      retryAfter?: number
    }

    if (status === 401 && token) {
      clearToken()
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    }

    throw new ApiError(
      details.message ?? 'An error occurred.',
      status,
      details.field,
      details.code,
      details.retryAfter,
    )
  }

  return payload as T
}

async function send(
  path: string,
  options: {
    method: string
    headers: Record<string, string>
    body: unknown
    signal?: AbortSignal
  },
): Promise<EarlyResponse> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method,
    headers: options.headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  return { status: response.status, text: await response.text() }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

interface ListResponse<T> {
  total: number
  data: T[]
}

interface SessionResponse {
  message: string
  token: string
  user: AuthUser
}

export interface GoogleSessionResponse extends SessionResponse {
  readonly created: boolean
}

interface MessagesResponse extends ListResponse<ChatMessage> {
  nextBefore: string | null
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  country: string
}

export interface PendingVerificationResponse {
  readonly message: string
  readonly pendingVerification: true
  readonly email: string
  readonly delivered: boolean
  readonly codeLength: number
  readonly expiresInMinutes: number
  readonly resendInSeconds: number
}

export interface ApiCountry {
  code: string
  name: string
  language: string
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<PendingVerificationResponse>('/api/auth/register', {
      method: 'POST',
      body: payload,
      auth: false,
    }),

  verify: (email: string, code: string) =>
    request<SessionResponse>('/api/auth/verify', {
      method: 'POST',
      body: { email, code },
      auth: false,
    }),

  resendCode: (email: string) =>
    request<PendingVerificationResponse>('/api/auth/verify/resend', {
      method: 'POST',
      body: { email },
      auth: false,
    }),

  login: (email: string, password: string) =>
    request<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    }),

  google: (credential: string, country?: string) =>
    request<GoogleSessionResponse>('/api/auth/google', {
      method: 'POST',
      body: country ? { credential, country } : { credential },
      auth: false,
    }),

  me: () => request<{ user: AuthUser }>('/api/auth/me'),

  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
}

export const usersApi = {
  countries: () => request<ListResponse<ApiCountry>>('/api/users/countries', { auth: false }),

  search: (search: string) =>
    request<ListResponse<ChatUser>>(`/api/users/search?search=${encodeURIComponent(search)}`),

  presence: (presence: Presence) =>
    request<{ user: ChatUser }>('/api/users/presence', {
      method: 'PUT',
      body: { presence },
    }),

  all: (signal?: AbortSignal) =>
    request<ListResponse<AuthUser>>('/api/users/all', { signal }),

  setRole: (userId: string, role: UserRole) =>
    request<{ message: string; user: AuthUser }>(`/api/users/${userId}/role`, {
      method: 'PUT',
      body: { role },
    }),
}

export const roomsApi = {
  list: (signal?: AbortSignal) =>
    request<ListResponse<ChatRoom>>('/api/rooms', { signal }),

  discover: (search = '', community = '', signal?: AbortSignal) => {
    const params = new URLSearchParams({ search })
    if (community) params.set('community', community)
    return request<ListResponse<ChatRoom>>(`/api/rooms/discover?${params}`, { signal })
  },

  members: (roomId: string, signal?: AbortSignal) =>
    request<ListResponse<ChatUser>>(`/api/rooms/${roomId}/members`, { signal }),

  setMemberRole: (roomId: string, userId: string, role: MemberRole) =>
    request<{ message: string; room: ChatRoom }>(
      `/api/rooms/${roomId}/members/${userId}/role`,
      { method: 'PUT', body: { role } },
    ),

  removeMember: (roomId: string, userId: string) =>
    request<{ message: string }>(`/api/rooms/${roomId}/members/${userId}`, {
      method: 'DELETE',
    }),

  messages: (roomId: string, limit = 50, signal?: AbortSignal) =>
    request<MessagesResponse>(`/api/rooms/${roomId}/messages?limit=${limit}`, { signal }),

  olderMessages: (roomId: string, before: string, limit = 50) =>
    request<MessagesResponse>(
      `/api/rooms/${roomId}/messages?limit=${limit}&before=${encodeURIComponent(before)}`,
    ),

  send: (roomId: string, body: string) =>
    request<{ message: ChatMessage }>(`/api/rooms/${roomId}/messages`, {
      method: 'POST',
      body: { body },
    }),

  markRead: (roomId: string) =>
    request<{ message: string; room: ChatRoom }>(`/api/rooms/${roomId}/read`, {
      method: 'POST',
    }),

  join: (roomId: string) =>
    request<{ message: string; room: ChatRoom }>(`/api/rooms/${roomId}/join`, {
      method: 'POST',
    }),

  leave: (roomId: string) =>
    request<{ message: string }>(`/api/rooms/${roomId}/leave`, { method: 'DELETE' }),

  create: (payload: { name: string; topic: string; emoji?: string }) =>
    request<{ message: string; room: ChatRoom }>('/api/rooms', {
      method: 'POST',
      body: payload,
    }),
}

export const communitiesApi = {
  list: (params: { topic?: string; search?: string } = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams()
    if (params.topic && params.topic !== 'All') query.set('topic', params.topic)
    if (params.search) query.set('search', params.search)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return request<ListResponse<Community>>(`/api/communities${suffix}`, {
      auth: false,
      signal,
    })
  },

  topics: (signal?: AbortSignal) =>
    request<{ data: string[] }>('/api/communities/topics', { auth: false, signal }),
}

export const contactApi = {
  subjects: (signal?: AbortSignal) =>
    request<ListResponse<string>>('/api/contact/subjects', { auth: false, signal }),

  send: (payload: { name: string; email: string; subject: string; message: string }) =>
    request<{ message: string; id: string }>('/api/contact', {
      method: 'POST',
      body: payload,
    }),
}

export const siteApi = {
  bundle: (signal?: AbortSignal) =>
    request<SiteBundle>('/api/site', { auth: false, signal }),
}

export interface StatsResponse {
  readonly values: MetricValues
  readonly stats: readonly Stat[]
  readonly metrics: readonly Metric[]
  readonly status: ServiceStatus
}

export const statsApi = {
  read: (signal?: AbortSignal) =>
    request<StatsResponse>('/api/stats', { auth: false, signal }),
}

export const showcaseApi = {
  read: (signal?: AbortSignal) =>
    request<Showcase>('/api/showcase', { auth: false, signal }),
}

export interface MyTestimonial {
  readonly id: string
  readonly quote: string
  readonly role: string
  readonly rating: number
  readonly status: 'pending' | 'approved' | 'rejected'
}

export const testimonialsApi = {
  list: (signal?: AbortSignal) =>
    request<ListResponse<Testimonial>>('/api/testimonials', { auth: false, signal }),

  mine: () => request<{ testimonial: MyTestimonial | null }>('/api/testimonials/mine'),

  save: (payload: { quote: string; role?: string; rating?: number }) =>
    request<{ message: string; testimonial: MyTestimonial }>('/api/testimonials', {
      method: 'POST',
      body: payload,
    }),
}

export const newsletterApi = {
  subscribe: (email: string) =>
    request<{ message: string; alreadySubscribed: boolean }>('/api/newsletter', {
      method: 'POST',
      body: { email },
    }),
}

export const adminApi = {
  updateSite: (payload: Partial<SiteIdentity>) =>
    request<{ message: string; site: SiteIdentity }>('/api/site', {
      method: 'PUT',
      body: payload,
    }),

  contentEntries: (signal?: AbortSignal) =>
    request<ListResponse<ContentEntry>>('/api/site/content', { signal }),

  createContent: (
    section: ContentSection,
    payload: { key: string; order?: number; published?: boolean; data: Record<string, unknown> },
  ) =>
    request<{ message: string }>(`/api/site/content/${section}`, {
      method: 'POST',
      body: payload,
    }),

  updateContent: (
    section: ContentSection,
    key: string,
    payload: { order?: number; published?: boolean; data?: Record<string, unknown> },
  ) =>
    request<{ message: string }>(
      `/api/site/content/${section}/${encodeURIComponent(key)}`,
      { method: 'PUT', body: payload },
    ),

  reorderContent: (section: ContentSection, keys: readonly string[]) =>
    request<{ message: string }>(`/api/site/content/${section}/reorder`, {
      method: 'PUT',
      body: { keys },
    }),

  deleteContent: (section: ContentSection, key: string) =>
    request<{ message: string }>(
      `/api/site/content/${section}/${encodeURIComponent(key)}`,
      { method: 'DELETE' },
    ),

  testimonials: (signal?: AbortSignal) =>
    request<ListResponse<AdminTestimonial>>('/api/testimonials/all', { signal }),

  setTestimonialStatus: (id: string, status: TestimonialStatus) =>
    request<{ message: string; status: TestimonialStatus }>(
      `/api/testimonials/${id}/status`,
      { method: 'PUT', body: { status } },
    ),

  deleteTestimonial: (id: string) =>
    request<{ message: string }>(`/api/testimonials/${id}`, { method: 'DELETE' }),

  createCommunity: (payload: {
    name: string
    topic: string
    description: string
    languages: string[]
    emoji: string
    featured: boolean
  }) =>
    request<{ message: string; community: Community }>('/api/communities', {
      method: 'POST',
      body: payload,
    }),

  updateCommunity: (
    id: string,
    payload: {
      name: string
      topic: string
      description: string
      languages: string[]
      emoji: string
      featured: boolean
    },
  ) =>
    request<{ message: string; community: Community }>(`/api/communities/${id}`, {
      method: 'PUT',
      body: payload,
    }),

  deleteCommunity: (id: string) =>
    request<{ message: string }>(`/api/communities/${id}`, { method: 'DELETE' }),
}

export const health = () =>
  request<ServiceStatus & { status: string; service: string; database: string }>(
    '/api/health',
    { auth: false },
  )
