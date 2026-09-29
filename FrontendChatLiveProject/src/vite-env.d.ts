/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface EarlyResponse {
  readonly status: number
  readonly text: string
}

interface Window {
  __CHATLIVE_BOOT__?: Record<string, Promise<EarlyResponse | null> | undefined>
  __CHATLIVE_COOKIE_PANEL__?: boolean
}
