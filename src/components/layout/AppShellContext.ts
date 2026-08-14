import {
  createContext,
  useContext,
} from 'react'

export interface AppShellContextValue {
  readonly immersiveMode: boolean

  readonly enterImmersiveMode: () => void
  readonly exitImmersiveMode: () => void
  readonly toggleImmersiveMode: () => void
}

export const AppShellContext =
  createContext<AppShellContextValue | null>(
    null,
  )

export function useAppShell():
  AppShellContextValue {
  const context =
    useContext(AppShellContext)

  if (context === null) {
    throw new Error(
      'useAppShell deve ser usado dentro de AppShell.',
    )
  }

  return context
}