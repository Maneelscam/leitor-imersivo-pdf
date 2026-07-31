import type { ComponentType } from 'react'

import { APP_CONFIG } from '@/app/config/app.config'
import {
  AppRoute,
  type AppRoute as AppRouteValue,
} from '@/app/routes/AppRoute'
import { navigateToAppRoute } from '@/app/routes/browserNavigation'
import { useAppRoute } from '@/hooks/useAppRoute'

import '@/styles/components/app-sidebar.css'

interface NavigationItem {
  readonly route: AppRouteValue
  readonly label: string
  readonly description: string
  readonly icon: ComponentType
}

function BookOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 5.5A2.5 2.5 0 0 1 6 3h4a2 2 0 0 1 2 2v15a2.5 2.5 0 0 0-2.5-2.5H3.5z" />
      <path d="M20.5 5.5A2.5 2.5 0 0 0 18 3h-4a2 2 0 0 0-2 2v15a2.5 2.5 0 0 1 2.5-2.5h6z" />
    </svg>
  )
}

function LibraryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4.5h4v15H4z" />
      <path d="M10 4.5h4v15h-4z" />
      <path d="m16.5 5.5 3.5-1 3.5 14-3.5 1z" />
    </svg>
  )
}

function ReaderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
      />
      <path d="M8.5 7h7" />
      <path d="M8.5 10.5h7" />
      <path d="M8.5 14h4.5" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H1.8V9.6h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88L3.2 6.06 6.06 3.2l.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V1.8h4v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  )
}

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  {
    route: AppRoute.LIBRARY,
    label: 'Biblioteca',
    description: 'Ver documentos importados',
    icon: LibraryIcon,
  },
  {
    route: AppRoute.READER,
    label: 'Leitor',
    description: 'Continuar a leitura',
    icon: ReaderIcon,
  },
  {
    route: AppRoute.SETTINGS,
    label: 'Configurações',
    description: 'Personalizar o leitor',
    icon: SettingsIcon,
  },
]

export function AppSidebar() {
  const currentRoute = useAppRoute()

  return (
    <div className="app-sidebar">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__brand-mark">
          <BookOpenIcon />
        </div>

        <div className="app-sidebar__brand-text">
          <span className="app-sidebar__brand-name">
            {APP_CONFIG.shortName}
          </span>

          <span className="app-sidebar__brand-description">
            Leitura local e imersiva
          </span>
        </div>
      </div>

      <nav
        className="app-sidebar__navigation"
        aria-label="Telas do aplicativo"
      >
        <span className="app-sidebar__section-label">
          Navegação
        </span>

        <ul className="app-sidebar__navigation-list">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon
            const isCurrentRoute =
              currentRoute === item.route

            return (
              <li
                key={item.route}
                className="app-sidebar__navigation-item"
              >
                <button
                  type="button"
                  className="app-sidebar__navigation-button"
                  aria-current={
                    isCurrentRoute
                      ? 'page'
                      : undefined
                  }
                  title={item.description}
                  onClick={() => {
                    navigateToAppRoute(item.route)
                  }}
                >
                  <span className="app-sidebar__navigation-icon">
                    <Icon />
                  </span>

                  <span className="app-sidebar__navigation-label">
                    {item.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="app-sidebar__footer">
        <div className="app-sidebar__status">
          <span
            className="app-sidebar__status-indicator"
            aria-hidden="true"
          />

          <div className="app-sidebar__status-content">
            <span className="app-sidebar__status-title">
              Funcionamento local
            </span>

            <span className="app-sidebar__status-description">
              Seus PDFs permanecem neste dispositivo
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}