import {
  useEffect,
  type ReactNode,
} from 'react'

import { useAppStore } from '@/stores/useAppStore'

export interface AppBootstrapProviderProps {
  readonly children: ReactNode
}

let bootstrapPromise: Promise<void> | null = null

function bootstrapApplication(): Promise<void> {
  if (bootstrapPromise !== null) {
    return bootstrapPromise
  }

  const {
    loadLibrary,
    loadReaderSettings,
  } = useAppStore.getState()

  bootstrapPromise = Promise.allSettled([
    loadLibrary(),
    loadReaderSettings(),
  ]).then(() => undefined)

  return bootstrapPromise
}

export function AppBootstrapProvider({
  children,
}: AppBootstrapProviderProps) {
  useEffect(() => {
    void bootstrapApplication()
  }, [])

  return children
}