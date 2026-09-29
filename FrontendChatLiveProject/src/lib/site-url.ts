import { DEFAULT_ORIGIN } from './seo'

export const SITE_ORIGIN = (import.meta.env.VITE_SITE_URL || DEFAULT_ORIGIN).replace(/\/+$/, '')
