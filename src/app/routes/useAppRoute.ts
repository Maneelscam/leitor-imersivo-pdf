import {
  useSyncExternalStore,
} from 'react'

import type {
  AppRoute,
} from '@/app/routes/AppRoute'
import {
  getCurrentAppRoute,
  subscribeToAppRoute,
} from '@/app/routes/browserNavigation'

export function useAppRoute(): AppRoute {
  return useSyncExternalStore(
    subscribeToAppRoute,
    getCurrentAppRoute,
    getCurrentAppRoute,
  )
}