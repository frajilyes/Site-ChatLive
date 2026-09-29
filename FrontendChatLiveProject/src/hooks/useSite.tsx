import { useContext } from 'react'
import { SiteContext, type SiteContextValue } from '../context/site-context'

export function useSite(): SiteContextValue {
  const value = useContext(SiteContext)

  if (!value) {
    throw new Error('useSite must be used inside <SiteProvider>')
  }

  return value
}
