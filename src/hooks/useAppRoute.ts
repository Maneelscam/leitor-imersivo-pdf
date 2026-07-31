import { useSyncExternalStore } from 'react'

import {
  AppRoute,
  type AppRoute as AppRouteValue,
} from '@/app/routes/AppRoute'
import {
  getCurrentAppRoute,
  subscribeToAppRoute,
} from '@/app/routes/browserNavigation'

function getServerAppRoute(): AppRouteValue {
  return AppRoute.LIBRARY
}

export function useAppRoute(): AppRouteValue {
  return useSyncExternalStore(
    subscribeToAppRoute,
    getCurrentAppRoute,
    getServerAppRoute,
  )
}