import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

import {
  appInstallationService,
} from '@/services/offline/AppInstallationService'
import {
  OfflineServiceWorkerService,
} from '@/services/offline/OfflineServiceWorkerService'
import {
  appUpdateService,
} from '@/services/offline/AppUpdateService'
import { appThemeService } from '@/services/settings/AppThemeService'

appThemeService.initializeFromCache()
appInstallationService.initialize()

const serviceWorker =
  'serviceWorker' in navigator
    ? {
        register: (
          scriptUrl: string,
          options: {
            readonly scope: string
          },
        ) =>
          navigator.serviceWorker
            .register(
              scriptUrl,
              options,
            ),
      }
    : null

const offlineServiceWorkerService =
  new OfflineServiceWorkerService(
    {
      enabled:
        import.meta.env.PROD,

      baseUrl:
        import.meta.env.BASE_URL,

      serviceWorker,
    },
  )

void offlineServiceWorkerService
  .register()

appUpdateService.initialize()

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <App />
  </StrictMode>,
)