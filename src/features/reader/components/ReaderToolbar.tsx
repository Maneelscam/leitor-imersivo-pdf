import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'

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
  const normalizedTotalPages = Math.max(
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
      <div className="reader-page__toolbar-group">
        <Button
          variant={ButtonVariant.GHOST}
          size={ButtonSize.SMALL}
          leadingIcon={<BackIcon />}
          aria-label="Voltar para a biblioteca"
          onClick={onBack}
        >
          Biblioteca
        </Button>

        <div className="reader-page__book-info">
          <strong className="reader-page__book-title">
            {normalizedBookTitle}
          </strong>

          <span className="reader-page__book-file">
            {normalizedFileName}
          </span>
        </div>
      </div>

      <div
        className="
          reader-page__toolbar-group
          reader-page__toolbar-group--center
        "
      >
        <Button
          variant={ButtonVariant.GHOST}
          size={ButtonSize.SMALL}
          disabled={previousPageDisabled}
          aria-label="Ir para a página anterior"
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
          {normalizedTotalPages > 0
            ? `${normalizedCurrentPage} / ${normalizedTotalPages}`
            : '— / —'}
        </span>

        <Button
          variant={ButtonVariant.GHOST}
          size={ButtonSize.SMALL}
          disabled={nextPageDisabled}
          aria-label="Ir para a próxima página"
          onClick={onNextPage}
        >
          <NextPageIcon />
        </Button>
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
          leadingIcon={<PanelIcon />}
          aria-pressed={panelOpen}
          aria-label={
            panelOpen
              ? 'Fechar painel lateral'
              : 'Abrir painel lateral'
          }
          onClick={onTogglePanel}
        >
          Painel
        </Button>
      </div>
    </div>
  )
}