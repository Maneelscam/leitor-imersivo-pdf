import {
  useEffect,
  useId,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import { subscribeToAppRoute } from '@/app/routes/browserNavigation'
import {
  Button,
  ButtonVariant,
} from '@/components/buttons/Button'

import '@/styles/components/app-shell.css'

export interface AppShellProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly sidebar: ReactNode
  readonly topbar: ReactNode
  readonly children: ReactNode

  readonly readerMode?: boolean
  readonly sidebarLabel?: string
}

function createAppShellClassName(
  isSidebarOpen: boolean,
  customClassName: string | undefined,
): string {
  const classNames = ['app-shell']

  if (isSidebarOpen) {
    classNames.push('app-shell--sidebar-open')
  }

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

function createContentClassName(
  readerMode: boolean,
): string {
  const classNames = ['app-shell__content']

  if (readerMode) {
    classNames.push('app-shell__content--reader')
  }

  return classNames.join(' ')
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  )
}

export function AppShell({
  sidebar,
  topbar,
  children,
  readerMode = false,
  sidebarLabel = 'Navegação principal',
  className,
  ...containerProps
}: AppShellProps) {
  const sidebarId = useId()

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false)

  useEffect(() => {
    return subscribeToAppRoute(() => {
      setIsSidebarOpen(false)
    })
  }, [])

  useEffect(() => {
    if (!isSidebarOpen) {
      return
    }

    const handleEscapeKey = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener(
      'keydown',
      handleEscapeKey,
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscapeKey,
      )
    }
  }, [isSidebarOpen])

  const appShellClassName =
    createAppShellClassName(
      isSidebarOpen,
      className,
    )

  const contentClassName =
    createContentClassName(readerMode)

  const openSidebar = () => {
    setIsSidebarOpen(true)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div
      {...containerProps}
      className={appShellClassName}
    >
      <aside
        id={sidebarId}
        className="app-shell__sidebar"
        aria-label={sidebarLabel}
      >
        {sidebar}
      </aside>

      <button
        type="button"
        className="app-shell__mobile-backdrop"
        aria-label="Fechar menu de navegação"
        tabIndex={isSidebarOpen ? 0 : -1}
        onClick={closeSidebar}
      />

      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <div className="app-shell__mobile-header">
            <Button
              variant={ButtonVariant.GHOST}
              iconOnly
              aria-label="Abrir menu de navegação"
              aria-controls={sidebarId}
              aria-expanded={isSidebarOpen}
              onClick={openSidebar}
            >
              <MenuIcon />
            </Button>
          </div>

          {topbar}
        </header>

        <main className={contentClassName}>
          {children}
        </main>
      </div>
    </div>
  )
}