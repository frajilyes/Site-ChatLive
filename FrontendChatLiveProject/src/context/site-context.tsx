import { createContext } from 'react'
import type {
  Metric,
  MetricValues,
  ServiceStatus,
  Showcase,
  SiteBundle,
  Stat,
} from '../types'

export interface SiteContextValue {
  readonly content: SiteBundle
  readonly stats: readonly Stat[]
  readonly metrics: readonly Metric[]
  readonly values: MetricValues
  readonly status: ServiceStatus
  readonly showcase: Showcase | null
  readonly refresh: () => void
}

export const SiteContext = createContext<SiteContextValue | null>(null)
