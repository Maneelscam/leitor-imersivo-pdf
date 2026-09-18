import {
  useSyncExternalStore,
} from 'react'

import {
  appUpdateService,
} from '@/services/offline/AppUpdateService'

import '@/styles/components/app-update-notice.css'

export function AppUpdateNotice() {
  const snapshot =
    useSyncExternalStore(
      appUpdateService.subscribe,
      appUpdateService.getSnapshot,
      appUpdateService.getSnapshot,
    )

  if (
    !snapshot.isUpdateAvailable
  ) {
    return null
  }

  return (
    <aside
      className="app-update-notice"
      role="status"
      aria-live="polite"
    >
      <div className="app-update-notice__copy">
        <strong className="app-update-notice__title">
          Nova versão disponível
        </strong>

        <span className="app-update-notice__description">
          Atualize o leitor para usar a versão mais recente.
        </span>
      </div>

      <div className="app-update-notice__actions">
        <button
          type="button"
          className="app-update-notice__secondary"
          disabled={
            snapshot.isApplying
          }
          onClick={() => {
            appUpdateService.dismiss()
          }}
        >
          Depois
        </button>

        <button
          type="button"
          className="app-update-notice__primary"
          disabled={
            snapshot.isApplying
          }
          onClick={() => {
            void appUpdateService
              .applyUpdate()
          }}
        >
          {snapshot.isApplying
            ? 'Atualizando...'
            : 'Atualizar agora'}
        </button>
      </div>
    </aside>
  )
}
