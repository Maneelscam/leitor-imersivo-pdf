import {
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'
import {
  useAppShell,
} from '@/components/layout/AppShellContext'

import '@/styles/components/reader-shortcuts-dialog.css'

export interface ReaderToolbarProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly bookTitle: string
  readonly originalFileName: string

  readonly currentPage: number
  readonly totalPages: number

  readonly navigationDisabled?: boolean
  readonly panelOpen: boolean
  readonly isHidden?: boolean

  readonly zoomControls?: ReactNode

  readonly onBack: () => void
  readonly onPreviousPage: () => void
  readonly onNextPage: () => void
  readonly onTogglePanel: () => void
}

function BackIcon() {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function PreviousPageIcon() {
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
      <path d="m14 17-5-5 5-5" />
    </svg>
  )
}

function NextPageIcon() {
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
      <path d="m10 17 5-5-5-5" />
    </svg>
  )
}

function PanelIcon() {
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
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
      />

      <path d="M15 4v16" />
    </svg>
  )
}

function HelpIcon() {
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
      <path d="M9.75 9a2.5 2.5 0 1 1 3.4 2.34c-.72.32-1.15.88-1.15 1.66" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function EnterImmersiveIcon() {
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
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M16 21h5v-5" />
    </svg>
  )
}

function ExitImmersiveIcon() {
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
      <path d="M8 3v5H3" />
      <path d="M16 3v5h5" />
      <path d="M8 21v-5H3" />
      <path d="M16 21v-5h5" />
    </svg>
  )
}

function createToolbarClassName(
  isHidden: boolean,
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-page__toolbar',
  ]

  if (isHidden) {
    classNames.push(
      'reader-page__toolbar--hidden',
    )
  }

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

function normalizePageNumber(
  pageNumber: number,
  totalPages: number,
): number {
  if (totalPages <= 0) {
    return 0
  }

  return Math.min(
    Math.max(
      1,
      Math.trunc(pageNumber),
    ),
    totalPages,
  )
}

export function ReaderToolbar({
  bookTitle,
  originalFileName,
  currentPage,
  totalPages,
  navigationDisabled = false,
  panelOpen,
  isHidden = false,
  zoomControls,
  onBack,
  onPreviousPage,
  onNextPage,
  onTogglePanel,
  className,
  ...containerProps
}: ReaderToolbarProps) {
  const {
    immersiveMode,
    toggleImmersiveMode,
  } = useAppShell()

  const [
    shortcutsHelpOpen,
    setShortcutsHelpOpen,
  ] = useState(false)

  const normalizedTotalPages =
    Math.max(
      0,
      Math.trunc(totalPages),
    )

  const normalizedCurrentPage =
    normalizePageNumber(
      currentPage,
      normalizedTotalPages,
    )

  const normalizedBookTitle =
    bookTitle.trim().length > 0
      ? bookTitle.trim()
      : 'Documento sem título'

  const normalizedFileName =
    originalFileName.trim().length > 0
      ? originalFileName.trim()
      : 'Arquivo PDF'

  const previousPageDisabled =
    navigationDisabled ||
    normalizedCurrentPage <= 1

  const nextPageDisabled =
    navigationDisabled ||
    normalizedCurrentPage === 0 ||
    normalizedCurrentPage >=
      normalizedTotalPages

  const immersiveButtonLabel =
    immersiveMode
      ? 'Sair do modo imersivo'
      : 'Entrar no modo imersivo'

  return (
    <div
      {...containerProps}
      className={createToolbarClassName(
        isHidden,
        className,
      )}
      data-controls-hidden={
        isHidden
          ? 'true'
          : 'false'
      }
      data-immersive-mode={
        immersiveMode
          ? 'true'
          : 'false'
      }
      aria-hidden={
        isHidden
          ? true
          : undefined
      }
      inert={
        isHidden
          ? true
          : undefined
      }
    >
      <div className="reader-page__toolbar-primary">
        <div className="reader-page__toolbar-group">
          <Button
            variant={ButtonVariant.GHOST}
            size={ButtonSize.SMALL}
            iconOnly
            aria-label="Voltar para a biblioteca"
            title="Voltar para a biblioteca"
            onClick={onBack}
          >
            <BackIcon />
          </Button>

          <div className="reader-page__book-info">
            <strong
              className="reader-page__book-title"
              title={normalizedBookTitle}
            >
              {normalizedBookTitle}
            </strong>

            <span
              className="reader-page__book-file"
              title={normalizedFileName}
            >
              {normalizedFileName}
            </span>
          </div>
        </div>

        <div
          className="
            reader-page__toolbar-group
            reader-page__toolbar-group--end
          "
        >
          {zoomControls}

          <Button
            variant={
              panelOpen
                ? ButtonVariant.SECONDARY
                : ButtonVariant.GHOST
            }
            size={ButtonSize.SMALL}
            iconOnly
            aria-pressed={panelOpen}
            aria-label={
              panelOpen
                ? 'Fechar painel lateral'
                : 'Abrir painel lateral'
            }
            title={
              panelOpen
                ? 'Fechar painel'
                : 'Abrir painel'
            }
            onClick={onTogglePanel}
          >
            <PanelIcon />
          </Button>

          <Button
            variant={ButtonVariant.GHOST}
            size={ButtonSize.SMALL}
            iconOnly
            aria-label="Ver atalhos do teclado"
            title="Atalhos do teclado"
            onClick={() => {
              setShortcutsHelpOpen(true)
            }}
          >
            <HelpIcon />
          </Button>

          <Button
            variant={
              immersiveMode
                ? ButtonVariant.SECONDARY
                : ButtonVariant.GHOST
            }
            size={ButtonSize.SMALL}
            iconOnly
            className="reader-page__immersive-toggle"
            aria-pressed={immersiveMode}
            aria-label={immersiveButtonLabel}
            title={immersiveButtonLabel}
            onClick={toggleImmersiveMode}
          >
            {immersiveMode
              ? <ExitImmersiveIcon />
              : <EnterImmersiveIcon />}
          </Button>
        </div>
      </div>

      <div className="reader-page__navigation">
        <Button
          variant={ButtonVariant.GHOST}
          size={ButtonSize.SMALL}
          iconOnly
          disabled={previousPageDisabled}
          aria-label="Ir para a página anterior"
          title="Página anterior"
          onClick={onPreviousPage}
        >
          <PreviousPageIcon />
        </Button>

        <span
          className="reader-page__page-indicator"
          aria-live="polite"
          aria-label={
            normalizedTotalPages > 0
              ? `Página ${normalizedCurrentPage} de ${normalizedTotalPages}`
              : 'Página indisponível'
          }
        >
          <span className="reader-page__page-indicator-current">
            {normalizedTotalPages > 0
              ? normalizedCurrentPage
              : '—'}
          </span>

          <span className="reader-page__page-indicator-separator">
            de
          </span>

          <span className="reader-page__page-indicator-total">
            {normalizedTotalPages > 0
              ? normalizedTotalPages
              : '—'}
          </span>
        </span>

        <Button
          variant={ButtonVariant.GHOST}
          size={ButtonSize.SMALL}
          iconOnly
          disabled={nextPageDisabled}
          aria-label="Ir para a próxima página"
          title="Próxima página"
          onClick={onNextPage}
        >
          <NextPageIcon />
        </Button>
      </div>
      {shortcutsHelpOpen && (
        <div
          className="reader-shortcuts-dialog__overlay"
          role="presentation"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShortcutsHelpOpen(false)
            }
          }}
        >
          <section
            className="reader-shortcuts-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-shortcuts-dialog-title"
            onKeyDown={(event) => {
              event.stopPropagation()

              if (
                event.key === 'Escape'
              ) {
                event.preventDefault()
                setShortcutsHelpOpen(false)
              }
            }}
          >
            <div className="reader-shortcuts-dialog__header">
              <div>
                <p className="reader-shortcuts-dialog__eyebrow">
                  Leitor
                </p>

                <h2
                  id="reader-shortcuts-dialog-title"
                  className="reader-shortcuts-dialog__title"
                >
                  Atalhos do teclado
                </h2>
              </div>

              <button
                type="button"
                className="reader-shortcuts-dialog__close"
                aria-label="Fechar atalhos"
                autoFocus
                onClick={() => {
                  setShortcutsHelpOpen(false)
                }}
              >
                ×
              </button>
            </div>

            <div className="reader-shortcuts-dialog__grid">
              <div className="reader-shortcuts-dialog__item">
                <span>Página anterior</span>
                <kbd>←</kbd>
                <kbd>Page Up</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Próxima página</span>
                <kbd>→</kbd>
                <kbd>Page Down</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Aumentar zoom</span>
                <kbd>+</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Diminuir zoom</span>
                <kbd>-</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Restaurar zoom</span>
                <kbd>0</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Ajustar à largura</span>
                <kbd>F</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Girar para a direita</span>
                <kbd>R</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Girar para a esquerda</span>
                <kbd>Shift + R</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Abrir ou fechar painel</span>
                <kbd>P</kbd>
              </div>

              <div className="reader-shortcuts-dialog__item">
                <span>Buscar no PDF</span>
                <kbd>Ctrl + F</kbd>
              </div>
            </div>

            <p className="reader-shortcuts-dialog__hint">
              Os atalhos respeitam a opção de teclado configurada no leitor.
            </p>
          </section>
        </div>
      )}

    </div>
  )
}