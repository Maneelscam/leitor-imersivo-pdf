import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from 'react'

import { APP_CONFIG } from '@/app/config/app.config'
import {
  READER_SETTINGS_CONFIG,
} from '@/app/config/readerSettings.config'
import {
  Button,
  ButtonVariant,
} from '@/components/buttons/Button'
import {
  FeedbackMessage,
  FeedbackMessageVariant,
} from '@/components/feedback/FeedbackMessage'
import {
  LoadingIndicator,
  LoadingIndicatorSize,
} from '@/components/feedback/LoadingIndicator'
import type {
  SaveReaderSettingsCommand,
} from '@/controllers/settings/SaveReaderSettingsController'
import type {
  ReaderSettings,
} from '@/models/entities/ReaderSettings'
import {
  AppTheme,
  type AppTheme as AppThemeValue,
} from '@/models/enums/AppTheme'
import {
  PageDisplayMode,
  type PageDisplayMode as PageDisplayModeValue,
} from '@/models/enums/PageDisplayMode'
import {
  ReadingFlowMode,
  type ReadingFlowMode as ReadingFlowModeValue,
} from '@/models/enums/ReadingFlowMode'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import {
  AppInstallationResult,
  appInstallationService,
} from '@/services/offline/AppInstallationService'
import {
  StoragePersistenceRequestResult,
  StoragePersistenceStatus,
  storagePersistenceService,
} from '@/services/storage/StoragePersistenceService'
import {
  ZoomMode,
  type ZoomMode as ZoomModeValue,
} from '@/models/enums/ZoomMode'
import {
  selectClearReaderSettingsError,
  selectReaderSettings,
  selectReaderSettingsErrorMessage,
  selectReaderSettingsLoadStatus,
  selectReaderSettingsSaveStatus,
  selectResetReaderSettings,
  selectSaveReaderSettings,
} from '@/stores/selectors/readerSettingsSelectors'
import {
  useAppStore,
} from '@/stores/useAppStore'
import {
  formatDate,
} from '@/utils/formatters/formatDate'

import '@/styles/components/settings-page.css'
import '@/styles/components/settings-premium-v11.css'

interface ReaderSettingsFormProps {
  readonly settings: ReaderSettings
  readonly isSaving: boolean

  readonly onSave: (
    command: SaveReaderSettingsCommand,
  ) => Promise<void>

  readonly onReset: () => Promise<void>
}

function ErrorIcon() {
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
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7.5v5" />
      <path d="M12 16.5h.01" />
    </svg>
  )
}

function formatAppTheme(
  theme: AppThemeValue,
): string {
  switch (theme) {
    case AppTheme.DARK:
      return 'Escuro'

    case AppTheme.OLED:
      return 'Preto OLED'

    case AppTheme.GRAPHITE:
      return 'Grafite'

    case AppTheme.LIGHT:
      return 'Claro'

    case AppTheme.SEPIA:
      return 'Sépia'

    case AppTheme.EMERALD:
      return 'Esmeralda'

    case AppTheme.DEEP_NIGHT:
      return 'Noite Profunda'

    case AppTheme.COPPER:
      return 'Cobre'

    case AppTheme.SILVER:
      return 'Prata'

    case AppTheme.IVORY:
      return 'Marfim'
  }
}

function formatPageDisplayMode(
  mode: PageDisplayModeValue,
): string {
  switch (mode) {
    case PageDisplayMode.SINGLE:
      return 'Página única'

    case PageDisplayMode.DOUBLE:
      return 'Duas páginas'
  }
}

function formatReadingFlowMode(
  mode: ReadingFlowModeValue,
): string {
  switch (mode) {
    case ReadingFlowMode.PAGINATED:
      return 'Navegação paginada'

    case ReadingFlowMode.CONTINUOUS:
      return 'Rolagem contínua'
  }
}

function formatZoomMode(
  mode: ZoomModeValue,
  customZoomScale: number,
): string {
  switch (mode) {
    case ZoomMode.FIT_WIDTH:
      return 'Ajustar à largura'

    case ZoomMode.FIT_PAGE:
      return 'Ajustar à página'

    case ZoomMode.CUSTOM:
      return `${Math.round(
        customZoomScale * 100,
      )}%`
  }
}

function InstallationIcon() {
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
      <path d="M12 3v12" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function formatStorageSize(
  bytes: number | null,
): string {
  if (bytes === null) {
    return 'Indisponível'
  }

  const units = [
    'B',
    'KB',
    'MB',
    'GB',
    'TB',
  ]

  if (bytes === 0) {
    return '0 B'
  }

  const unitIndex =
    Math.min(
      Math.floor(
        Math.log(bytes) /
        Math.log(1024),
      ),
      units.length - 1,
    )

  const value =
    bytes /
    1024 ** unitIndex

  const digits =
    value >= 100 ||
    unitIndex === 0
      ? 0
      : value >= 10
        ? 1
        : 2

  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

function StorageProtectionIcon() {
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
      <path d="M12 3 5.5 5.7v5.5c0 4.1 2.6 7.8 6.5 9.8 3.9-2 6.5-5.7 6.5-9.8V5.7L12 3Z" />
      <path d="m9.2 12 1.8 1.8 3.8-4" />
    </svg>
  )
}

function StorageProtectionSection() {
  const storageState =
    useSyncExternalStore(
      storagePersistenceService.subscribe,
      storagePersistenceService.getSnapshot,
      storagePersistenceService.getSnapshot,
    )

  const [
    requestMessage,
    setRequestMessage,
  ] = useState<string | null>(null)

  useEffect(() => {
    storagePersistenceService.initialize()
  }, [])

  const isLoading =
    storageState.status ===
    StoragePersistenceStatus.LOADING

  const handleProtectStorage =
    async () => {
      if (
        isLoading ||
        !storageState.isSupported ||
        storageState.isPersistent
      ) {
        return
      }

      setRequestMessage(null)

      const result =
        await storagePersistenceService.requestPersistence()

      switch (result) {
        case StoragePersistenceRequestResult.GRANTED:
          setRequestMessage(
            'Proteção concedida pelo navegador. Os dados locais ficam menos sujeitos à remoção automática por pressão de armazenamento.',
          )
          break

        case StoragePersistenceRequestResult.DENIED:
          setRequestMessage(
            'O navegador não concedeu armazenamento persistente. Sua biblioteca continua local e utilizável normalmente.',
          )
          break

        case StoragePersistenceRequestResult.ALREADY_PERSISTENT:
          setRequestMessage(
            'O armazenamento deste aplicativo já está protegido.',
          )
          break

        case StoragePersistenceRequestResult.UNSUPPORTED:
          setRequestMessage(
            'Este navegador não oferece a solicitação de armazenamento persistente.',
          )
          break

        case StoragePersistenceRequestResult.ERROR:
          setRequestMessage(
            'Não foi possível consultar a proteção de armazenamento agora.',
          )
          break
      }
    }

  const statusLabel =
    !storageState.isSupported
      ? 'Não suportado'
      : isLoading
        ? 'Verificando...'
        : storageState.isPersistent
          ? 'Protegido'
          : storageState.status ===
              StoragePersistenceStatus.ERROR
            ? 'Não foi possível verificar'
            : 'Proteção padrão'

  const description =
    storageState.isPersistent
      ? 'O navegador concedeu armazenamento persistente a este aplicativo. Isso reduz o risco de remoção automática dos dados locais quando o dispositivo estiver sob pressão de espaço.'
      : 'Se o navegador permitir, você pode solicitar armazenamento persistente para proteger melhor PDFs, progresso, notas e demais dados locais contra remoções automáticas.'

  const usageLabel =
    storageState.quotaBytes !== null
      ? `${formatStorageSize(
          storageState.usageBytes,
        )} usados de ${formatStorageSize(
          storageState.quotaBytes,
        )}`
      : `${formatStorageSize(
          storageState.usageBytes,
        )} usados`

  return (
    <section className="settings-page__section">
      <header className="settings-page__section-header">
        <div className="settings-page__section-heading">
          <span className="settings-page__section-icon">
            <StorageProtectionIcon />
          </span>

          <div>
            <h2 className="settings-page__section-title">
              Armazenamento local
            </h2>

            <p className="settings-page__section-description">
              Acompanhe o espaço utilizado e
              proteja melhor os dados mantidos
              somente neste dispositivo.
            </p>
          </div>
        </div>
      </header>

      <div className="settings-page__fields">
        <div className="settings-page__field">
          <div className="settings-page__field-information">
            <span className="settings-page__field-label">
              Proteção do armazenamento
            </span>

            <p className="settings-page__field-description">
              {description}
            </p>

            {storageState.isSupported && (
              <p className="settings-page__storage-usage">
                {usageLabel}
              </p>
            )}

            {requestMessage !== null && (
              <p
                className="settings-page__installation-message"
                aria-live="polite"
              >
                {requestMessage}
              </p>
            )}
          </div>

          <div className="settings-page__installation-control">
            <span
              className={
                storageState.isPersistent
                  ? 'settings-page__installation-status settings-page__installation-status--installed'
                  : 'settings-page__installation-status'
              }
            >
              {statusLabel}
            </span>

            {storageState.isSupported &&
              !storageState.isPersistent && (
                <Button
                  variant={ButtonVariant.SECONDARY}
                  disabled={isLoading}
                  aria-busy={isLoading}
                  onClick={handleProtectStorage}
                >
                  {isLoading
                    ? 'Verificando...'
                    : 'Proteger armazenamento'}
                </Button>
              )}
          </div>
        </div>
      </div>
    </section>
  )
}

function AppInstallationSection() {
  const installationState =
    useSyncExternalStore(
      appInstallationService
        .subscribe,
      appInstallationService
        .getSnapshot,
      appInstallationService
        .getSnapshot,
    )

  const [
    isInstalling,
    setIsInstalling,
  ] = useState(false)

  const [
    installationMessage,
    setInstallationMessage,
  ] = useState<string | null>(
    null,
  )

  const handleInstall = async () => {
    if (
      isInstalling ||
      !installationState
        .canInstall
    ) {
      return
    }

    setIsInstalling(true)
    setInstallationMessage(null)

    try {
      const result =
        await appInstallationService
          .requestInstallation()

      switch (result) {
        case AppInstallationResult.ACCEPTED:
          setInstallationMessage(
            'Aplicativo instalado. Você pode abri-lo como um programa independente.',
          )
          break

        case AppInstallationResult.DISMISSED:
          setInstallationMessage(
            'A instalação foi cancelada. O modo offline continua disponível no navegador.',
          )
          break

        case AppInstallationResult.UNAVAILABLE:
          setInstallationMessage(
            'A instalação direta não está disponível neste navegador neste momento.',
          )
          break

        case AppInstallationResult.ERROR:
          setInstallationMessage(
            'Não foi possível abrir a instalação agora. O leitor continua funcionando normalmente.',
          )
          break
      }
    } finally {
      setIsInstalling(false)
    }
  }

  const statusLabel =
    installationState.isInstalled
      ? 'Instalado'
      : installationState.canInstall
        ? 'Pronto para instalar'
        : 'Disponível offline'

  const description =
    installationState.isInstalled
      ? `${APP_CONFIG.shortName} está instalada neste dispositivo e pode ser aberta em uma janela própria.`
      : installationState.canInstall
        ? `${APP_CONFIG.shortName} pode ser instalada neste dispositivo e aberta em uma janela própria, mantendo sua biblioteca e o funcionamento offline.`
        : `${APP_CONFIG.shortName} já funciona offline após o primeiro carregamento. A instalação como aplicativo depende do suporte e das regras do navegador.`

  return (
    <section className="settings-page__section">
      <header className="settings-page__section-header">
        <div className="settings-page__section-heading">
          <span className="settings-page__section-icon">
            <InstallationIcon />
          </span>

          <div>
            <h2 className="settings-page__section-title">
              Aplicativo offline
            </h2>

            <p className="settings-page__section-description">
              Use o leitor mesmo sem conexão e,
              quando disponível, instale-o no
              dispositivo.
            </p>
          </div>
        </div>
      </header>

      <div className="settings-page__fields">
        <div className="settings-page__field">
          <div className="settings-page__field-information">
            <span className="settings-page__field-label">
              Instalação
            </span>

            <p className="settings-page__field-description">
              {description}
            </p>

            {installationMessage !== null && (
              <p
                className="settings-page__installation-message"
                aria-live="polite"
              >
                {installationMessage}
              </p>
            )}
          </div>

          <div className="settings-page__installation-control">
            <span
              className={
                installationState.isInstalled
                  ? 'settings-page__installation-status settings-page__installation-status--installed'
                  : 'settings-page__installation-status'
              }
            >
              {statusLabel}
            </span>

            {!installationState.isInstalled && (
              <Button
                variant={
                  installationState.canInstall
                    ? ButtonVariant.PRIMARY
                    : ButtonVariant.SECONDARY
                }
                disabled={
                  !installationState.canInstall ||
                  isInstalling
                }
                aria-busy={isInstalling}
                onClick={handleInstall}
              >
                {isInstalling
                  ? 'Instalando...'
                  : 'Instalar aplicativo'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function resolveInitialPageDisplayMode(
  settings: ReaderSettings,
): PageDisplayModeValue {
  if (
    settings.readingFlowMode ===
    ReadingFlowMode.CONTINUOUS
  ) {
    return PageDisplayMode.SINGLE
  }

  return settings.pageDisplayMode
}

function ReaderSettingsForm({
  settings,
  isSaving,
  onSave,
  onReset,
}: ReaderSettingsFormProps) {
  const [
    theme,
    setTheme,
  ] = useState<AppThemeValue>(
    settings.theme,
  )

  const [
    pageDisplayMode,
    setPageDisplayMode,
  ] = useState<PageDisplayModeValue>(
    resolveInitialPageDisplayMode(
      settings,
    ),
  )

  const [
    readingFlowMode,
    setReadingFlowMode,
  ] = useState<ReadingFlowModeValue>(
    settings.readingFlowMode,
  )

  const [
    zoomMode,
    setZoomMode,
  ] = useState<ZoomModeValue>(
    settings.zoomMode,
  )

  const [
    customZoomScale,
    setCustomZoomScale,
  ] = useState(
    settings.customZoomScale,
  )

  const [
    enableKeyboardShortcuts,
    setEnableKeyboardShortcuts,
  ] = useState(
    settings.enableKeyboardShortcuts,
  )

  const [
    autoHideReaderControls,
    setAutoHideReaderControls,
  ] = useState(
    settings.autoHideReaderControls,
  )

  const minimumZoomPercentage =
    READER_SETTINGS_CONFIG.zoom.minimumScale *
    100

  const maximumZoomPercentage =
    READER_SETTINGS_CONFIG.zoom.maximumScale *
    100

  const zoomStepPercentage =
    READER_SETTINGS_CONFIG.zoom.step * 100

  const customZoomPercentage =
    Math.round(customZoomScale * 100)

  const handleThemeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedTheme =
      event.currentTarget.value

    if (
      Object.values(AppTheme).includes(
        selectedTheme as AppThemeValue,
      )
    ) {
      setTheme(
        selectedTheme as AppThemeValue,
      )
    }
  }

  const handlePageDisplayModeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedMode =
      event.currentTarget.value

    if (
      !Object.values(
        PageDisplayMode,
      ).includes(
        selectedMode as PageDisplayModeValue,
      )
    ) {
      return
    }

    const nextPageDisplayMode =
      selectedMode as PageDisplayModeValue

    setPageDisplayMode(
      nextPageDisplayMode,
    )

    if (
      nextPageDisplayMode ===
      PageDisplayMode.DOUBLE
    ) {
      setReadingFlowMode(
        ReadingFlowMode.PAGINATED,
      )
    }
  }

  const handleReadingFlowModeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedMode =
      event.currentTarget.value

    if (
      !Object.values(
        ReadingFlowMode,
      ).includes(
        selectedMode as ReadingFlowModeValue,
      )
    ) {
      return
    }

    const nextReadingFlowMode =
      selectedMode as ReadingFlowModeValue

    setReadingFlowMode(
      nextReadingFlowMode,
    )

    if (
      nextReadingFlowMode ===
      ReadingFlowMode.CONTINUOUS
    ) {
      setPageDisplayMode(
        PageDisplayMode.SINGLE,
      )
    }
  }

  const handleZoomModeChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const selectedMode =
      event.currentTarget.value

    if (
      Object.values(ZoomMode).includes(
        selectedMode as ZoomModeValue,
      )
    ) {
      setZoomMode(
        selectedMode as ZoomModeValue,
      )
    }
  }

  const handleCustomZoomChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const percentage =
      event.currentTarget.valueAsNumber

    if (!Number.isFinite(percentage)) {
      return
    }

    setCustomZoomScale(
      percentage / 100,
    )
  }

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    const normalizedPageDisplayMode =
      readingFlowMode ===
      ReadingFlowMode.CONTINUOUS
        ? PageDisplayMode.SINGLE
        : pageDisplayMode

    await onSave({
      theme,

      pageDisplayMode:
        normalizedPageDisplayMode,

      readingFlowMode,
      zoomMode,
      customZoomScale,
      enableKeyboardShortcuts,
      autoHideReaderControls,
    })
  }

  const handleReset = async () => {
    if (isSaving) {
      return
    }

    await onReset()
  }

  return (
    <div className="settings-page__content">
      <div className="settings-page__sections">
        <header className="settings-page__hero">
          <div className="settings-page__hero-copy">
            <span className="settings-page__hero-eyebrow">
              Configurações
            </span>

            <h1 className="settings-page__hero-title">
              Configure a leitura do seu jeito.
            </h1>

            <p className="settings-page__hero-description">
              Aparência, navegação, zoom e comportamento
              reunidos em um só lugar.
            </p>
          </div>

          <p
            className="settings-page__hero-message"
            aria-hidden="true"
          >
            “Mais foco para o que importa.”
          </p>
        </header>
        <section className="settings-page__section">
          <header className="settings-page__section-header">
            <h2 className="settings-page__section-title">
              Aparência
            </h2>

            <p className="settings-page__section-description">
              Escolha a aparência geral do aplicativo.
              O conteúdo original das páginas do PDF
              permanece independente do tema.
            </p>
          </header>

          <div className="settings-page__fields">
            <div className="settings-page__field">
              <div className="settings-page__field-information">
                <label
                  className="settings-page__field-label"
                  htmlFor="application-theme"
                >
                  Tema da interface
                </label>

                <p className="settings-page__field-description">
                  Escolha uma aparência confortável
                  para o ambiente em que você está lendo.
                </p>
              </div>

              <div className="settings-page__field-control">
                <select
                  id="application-theme"
                  className="settings-page__select"
                  value={theme}
                  disabled={isSaving}
                  onChange={
                    handleThemeChange
                  }
                >
                  <option value={AppTheme.DARK}>
                    Escuro
                  </option>

                  <option value={AppTheme.OLED}>
                    Preto OLED
                  </option>

                  <option value={AppTheme.GRAPHITE}>
                    Grafite
                  </option>

                  <option value={AppTheme.LIGHT}>
                    Claro
                  </option>

                  <option value={AppTheme.SEPIA}>
                    Sépia
                  </option>

                  <option value={AppTheme.EMERALD}>
                    Esmeralda
                  </option>

                  <option value={AppTheme.DEEP_NIGHT}>
                    Noite Profunda
                  </option>

                  <option value={AppTheme.COPPER}>
                    Cobre
                  </option>

                  <option value={AppTheme.SILVER}>
                    Prata
                  </option>

                  <option value={AppTheme.IVORY}>
                    Marfim
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-page__section">
          <header className="settings-page__section-header">
            <h2 className="settings-page__section-title">
              Exibição das páginas
            </h2>

            <p className="settings-page__section-description">
              Defina como as páginas serão apresentadas
              durante a leitura.
            </p>
          </header>

          <div className="settings-page__fields">
            <div className="settings-page__field">
              <div className="settings-page__field-information">
                <label
                  className="settings-page__field-label"
                  htmlFor="reader-page-display-mode"
                >
                  Modo de exibição
                </label>

                <p className="settings-page__field-description">
                  Escolha uma página ou duas lado a lado.
                  O modo de duas páginas usa navegação
                  paginada.
                </p>
              </div>

              <div className="settings-page__field-control">
                <select
                  id="reader-page-display-mode"
                  className="settings-page__select"
                  value={pageDisplayMode}
                  disabled={isSaving}
                  onChange={
                    handlePageDisplayModeChange
                  }
                >
                  <option
                    value={
                      PageDisplayMode.SINGLE
                    }
                  >
                    Página única
                  </option>

                  <option
                    value={
                      PageDisplayMode.DOUBLE
                    }
                  >
                    Duas páginas
                  </option>
                </select>
              </div>
            </div>

            <div className="settings-page__field">
              <div className="settings-page__field-information">
                <label
                  className="settings-page__field-label"
                  htmlFor="reader-flow-mode"
                >
                  Fluxo de leitura
                </label>

                <p className="settings-page__field-description">
                  Use páginas separadas ou rolagem
                  contínua. A rolagem contínua exibe
                  uma página por linha.
                </p>
              </div>

              <div className="settings-page__field-control">
                <select
                  id="reader-flow-mode"
                  className="settings-page__select"
                  value={readingFlowMode}
                  disabled={isSaving}
                  onChange={
                    handleReadingFlowModeChange
                  }
                >
                  <option
                    value={
                      ReadingFlowMode.PAGINATED
                    }
                  >
                    Navegação paginada
                  </option>

                  <option
                    value={
                      ReadingFlowMode.CONTINUOUS
                    }
                  >
                    Rolagem contínua
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-page__section">
          <header className="settings-page__section-header">
            <h2 className="settings-page__section-title">
              Zoom
            </h2>

            <p className="settings-page__section-description">
              Determine como o tamanho inicial das
              páginas será calculado.
            </p>
          </header>

          <div className="settings-page__fields">
            <div className="settings-page__field">
              <div className="settings-page__field-information">
                <label
                  className="settings-page__field-label"
                  htmlFor="reader-zoom-mode"
                >
                  Modo de zoom
                </label>

                <p className="settings-page__field-description">
                  Ajuste automaticamente à área disponível
                  ou utilize um percentual personalizado.
                </p>
              </div>

              <div className="settings-page__field-control">
                <select
                  id="reader-zoom-mode"
                  className="settings-page__select"
                  value={zoomMode}
                  disabled={isSaving}
                  onChange={
                    handleZoomModeChange
                  }
                >
                  <option
                    value={ZoomMode.FIT_WIDTH}
                  >
                    Ajustar à largura
                  </option>

                  <option
                    value={ZoomMode.FIT_PAGE}
                  >
                    Ajustar à página
                  </option>

                  <option
                    value={ZoomMode.CUSTOM}
                  >
                    Zoom personalizado
                  </option>
                </select>
              </div>
            </div>

            <div className="settings-page__field">
              <div className="settings-page__field-information">
                <label
                  className="settings-page__field-label"
                  htmlFor="reader-custom-zoom"
                >
                  Zoom personalizado
                </label>

                <p className="settings-page__field-description">
                  Utilizado quando o modo de zoom
                  personalizado estiver selecionado.
                </p>
              </div>

              <div className="settings-page__field-control">
                <div className="settings-page__number-control">
                  <input
                    id="reader-custom-zoom"
                    className="settings-page__number-input"
                    type="number"
                    min={
                      minimumZoomPercentage
                    }
                    max={
                      maximumZoomPercentage
                    }
                    step={
                      zoomStepPercentage
                    }
                    value={
                      customZoomPercentage
                    }
                    disabled={
                      isSaving ||
                      zoomMode !==
                        ZoomMode.CUSTOM
                    }
                    onChange={
                      handleCustomZoomChange
                    }
                  />

                  <span className="settings-page__number-suffix">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-page__section">
          <header className="settings-page__section-header">
            <h2 className="settings-page__section-title">
              Comportamento
            </h2>

            <p className="settings-page__section-description">
              Personalize os controles e a interação
              durante a leitura.
            </p>
          </header>

          <div className="settings-page__fields">
            <div className="settings-page__field">
              <div className="settings-page__field-information">
                <label
                  className="settings-page__field-label"
                  htmlFor="reader-keyboard-shortcuts"
                >
                  Atalhos de teclado
                </label>

                <p className="settings-page__field-description">
                  Permite navegar, ajustar o zoom, girar
                  páginas e controlar o painel pelo
                  teclado.
                </p>
              </div>

              <div className="settings-page__field-control">
                <input
                  id="reader-keyboard-shortcuts"
                  type="checkbox"
                  checked={
                    enableKeyboardShortcuts
                  }
                  disabled={isSaving}
                  onChange={(event) => {
                    setEnableKeyboardShortcuts(
                      event.currentTarget.checked,
                    )
                  }}
                />
              </div>
            </div>

            <div className="settings-page__field">
              <div className="settings-page__field-information">
                <label
                  className="settings-page__field-label"
                  htmlFor="reader-auto-hide-controls"
                >
                  Ocultar controles automaticamente
                </label>

                <p className="settings-page__field-description">
                  Oculta a barra de ferramentas durante
                  períodos sem interação.
                </p>
              </div>

              <div className="settings-page__field-control">
                <input
                  id="reader-auto-hide-controls"
                  type="checkbox"
                  checked={
                    autoHideReaderControls
                  }
                  disabled={isSaving}
                  onChange={(event) => {
                    setAutoHideReaderControls(
                      event.currentTarget.checked,
                    )
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <StorageProtectionSection />

        <AppInstallationSection />

        <div className="settings-page__actions">
          <Button
            variant={ButtonVariant.SECONDARY}
            disabled={isSaving}
            onClick={handleReset}
          >
            Restaurar padrões
          </Button>

          <Button
            variant={ButtonVariant.PRIMARY}
            disabled={isSaving}
            aria-busy={isSaving}
            onClick={handleSave}
          >
            {isSaving
              ? 'Salvando...'
              : 'Salvar configurações'}
          </Button>
        </div>
      </div>

      <aside className="settings-page__aside">
        <div className="settings-page__summary">
          <header className="settings-page__summary-header">
            <span className="settings-page__summary-eyebrow">
              Visão geral
            </span>

            <h2 className="settings-page__summary-title">
              Resumo das preferências
            </h2>

            <p className="settings-page__summary-description">
              Suas escolhas atuais para a experiência de leitura.
            </p>
          </header>

          <div className="settings-page__summary-list">
            <div className="settings-page__summary-item">
              <span className="settings-page__summary-label">
                Tema
              </span>

              <strong className="settings-page__summary-value">
                {formatAppTheme(
                  theme,
                )}
              </strong>
            </div>

            <div className="settings-page__summary-item">
              <span className="settings-page__summary-label">
                Exibição
              </span>

              <strong className="settings-page__summary-value">
                {formatPageDisplayMode(
                  pageDisplayMode,
                )}
              </strong>
            </div>

            <div className="settings-page__summary-item">
              <span className="settings-page__summary-label">
                Fluxo de leitura
              </span>

              <strong className="settings-page__summary-value">
                {formatReadingFlowMode(
                  readingFlowMode,
                )}
              </strong>
            </div>

            <div className="settings-page__summary-item">
              <span className="settings-page__summary-label">
                Zoom inicial
              </span>

              <strong className="settings-page__summary-value">
                {formatZoomMode(
                  zoomMode,
                  customZoomScale,
                )}
              </strong>
            </div>

            <div className="settings-page__summary-item">
              <span className="settings-page__summary-label">
                Atalhos de teclado
              </span>

              <strong className="settings-page__summary-value">
                {enableKeyboardShortcuts
                  ? 'Ativados'
                  : 'Desativados'}
              </strong>
            </div>

            <div className="settings-page__summary-item">
              <span className="settings-page__summary-label">
                Controles automáticos
              </span>

              <strong className="settings-page__summary-value">
                {autoHideReaderControls
                  ? 'Ocultação ativada'
                  : 'Sempre visíveis'}
              </strong>
            </div>

            <div className="settings-page__summary-item">
              <span className="settings-page__summary-label">
                Última atualização
              </span>

              <strong className="settings-page__summary-value">
                {formatDate(
                  settings.updatedAt,
                )}
              </strong>
            </div>
          </div>

          <footer className="settings-page__summary-footer">
            <p className="settings-page__summary-quote">
              “Uma boa configuração desaparece
              enquanto você lê.”
            </p>

            <span className="settings-page__summary-signature">
              HWEI
            </span>
          </footer>
        </div>
      </aside>
    </div>
  )
}

export function SettingsPage() {
  const readerSettings = useAppStore(
    selectReaderSettings,
  )

  const loadStatus = useAppStore(
    selectReaderSettingsLoadStatus,
  )

  const saveStatus = useAppStore(
    selectReaderSettingsSaveStatus,
  )

  const errorMessage = useAppStore(
    selectReaderSettingsErrorMessage,
  )

  const saveReaderSettings = useAppStore(
    selectSaveReaderSettings,
  )

  const resetReaderSettings = useAppStore(
    selectResetReaderSettings,
  )

  const clearError = useAppStore(
    selectClearReaderSettingsError,
  )

  const isLoading =
    loadStatus === AsyncStatus.IDLE ||
    loadStatus === AsyncStatus.LOADING

  const isSaving =
    saveStatus === AsyncStatus.LOADING

  const handleSave = async (
    command: SaveReaderSettingsCommand,
  ) => {
    await saveReaderSettings(command)
  }

  const handleReset = async () => {
    await resetReaderSettings()
  }

  return (
    <section
      className="settings-page"
      aria-label="Configurações do leitor"
    >
      {errorMessage !== null && (
        <div className="settings-page__feedback">
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Não foi possível concluir a operação"
            description={errorMessage}
            icon={<ErrorIcon />}
            action={
              <Button
                variant={
                  ButtonVariant.GHOST
                }
                onClick={clearError}
              >
                Fechar
              </Button>
            }
          />
        </div>
      )}

      {isLoading && (
        <div className="settings-page__loading">
          <LoadingIndicator
            size={LoadingIndicatorSize.LARGE}
            label="Carregando configurações..."
            vertical
          />
        </div>
      )}

      {!isLoading &&
        readerSettings !== null && (
          <ReaderSettingsForm
            key={
              readerSettings.updatedAt
            }
            settings={readerSettings}
            isSaving={isSaving}
            onSave={handleSave}
            onReset={handleReset}
          />
        )}
    </section>
  )
}