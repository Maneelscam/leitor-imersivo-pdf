import {
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'

import '@/styles/components/reader-side-panel.css'

export interface ReaderSidePanelProps
  extends HTMLAttributes<HTMLElement> {
  readonly currentPage: number
  readonly totalPages: number

  readonly searchContent?: ReactNode

  readonly bookmarksContent?: ReactNode

  readonly onClose: () => void
}

type ProgressBarStyle = CSSProperties & {
  readonly '--reader-progress': string
}

function CloseIcon() {
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
      <path d="m7 7 10 10" />
      <path d="M17 7 7 17" />
    </svg>
  )
}

function createPanelClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-page__panel',
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(
      customClassName,
    )
  }

  return classNames.join(' ')
}

function normalizeTotalPages(
  totalPages: number,
): number {
  return Math.max(
    0,
    Math.trunc(totalPages),
  )
}

function normalizeCurrentPage(
  currentPage: number,
  totalPages: number,
): number {
  if (totalPages === 0) {
    return 0
  }

  return Math.min(
    Math.max(
      1,
      Math.trunc(currentPage),
    ),
    totalPages,
  )
}

export function ReaderSidePanel({
  currentPage,
  totalPages,
  searchContent,
  bookmarksContent,
  onClose,
  className,
  ...panelProps
}: ReaderSidePanelProps) {
  const progressTitleId = useId()

  const normalizedTotalPages =
    normalizeTotalPages(
      totalPages,
    )

  const normalizedCurrentPage =
    normalizeCurrentPage(
      currentPage,
      normalizedTotalPages,
    )

  const progressPercentage =
    normalizedTotalPages > 0
      ? Math.round(
          (
            normalizedCurrentPage /
            normalizedTotalPages
          ) * 100,
        )
      : 0

  const progressBarStyle:
    ProgressBarStyle = {
      '--reader-progress':
        `${progressPercentage}%`,
    }

  return (
    <aside
      {...panelProps}
      className={
        createPanelClassName(
          className,
        )
      }
      aria-label="Painel lateral do leitor"
    >
      <header className="reader-page__panel-header">
        <h2 className="reader-page__panel-title">
          Leitura
        </h2>

        <Button
          variant={
            ButtonVariant.GHOST
          }
          size={
            ButtonSize.SMALL
          }
          aria-label="Fechar painel lateral"
          onClick={onClose}
        >
          <CloseIcon />
        </Button>
      </header>

      <div className="reader-page__panel-content">
        <section
          className="reader-side-panel__section"
          aria-labelledby={
            progressTitleId
          }
        >
          <h3
            id={progressTitleId}
            className="reader-side-panel__section-title"
          >
            Progresso
          </h3>

          <div className="reader-side-panel__progress-summary">
            <p
              className="reader-side-panel__progress-page"
              aria-live="polite"
            >
              {normalizedTotalPages > 0
                ? `Página ${normalizedCurrentPage} de ${normalizedTotalPages}`
                : 'Progresso indisponível'}
            </p>

            <strong className="reader-side-panel__progress-value">
              {progressPercentage}%
            </strong>
          </div>

          <div
            className="reader-side-panel__progress-track"
            role="progressbar"
            aria-label="Progresso da leitura"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              progressPercentage
            }
          >
            <span
              className="reader-side-panel__progress-bar"
              style={
                progressBarStyle
              }
            />
          </div>
        </section>

        {searchContent !== undefined && (
          <div className="reader-side-panel__section">
            {searchContent}
          </div>
        )}

        {bookmarksContent !== undefined && (
          <div className="reader-side-panel__section">
            {bookmarksContent}
          </div>
        )}
      </div>
    </aside>
  )
}