import {
  useState,
  type ChangeEvent,
} from 'react'

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
                  O modo de duas páginas usa navegação paginada.
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
                  Use páginas separadas ou rolagem contínua.
                  A rolagem contínua exibe uma página por linha.
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
                  páginas e controlar o painel pelo teclado.
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
          <h2 className="settings-page__summary-title">
            Resumo das preferências
          </h2>

          <div className="settings-page__summary-list">
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
                Fluxo
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
                Atalhos
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
