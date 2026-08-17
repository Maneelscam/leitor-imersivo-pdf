import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'
import {
  useAppShell,
} from '@/components/layout/AppShellContext'

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
    </div>
  )
}