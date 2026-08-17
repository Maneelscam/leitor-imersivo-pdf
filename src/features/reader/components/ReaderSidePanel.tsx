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

  readonly outlineContent?: ReactNode

  readonly searchContent?: ReactNode

  readonly bookmarksContent?: ReactNode

  readonly annotationsContent?: ReactNode

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

function ReadingIcon() {
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
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
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
  outlineContent,
  searchContent,
  bookmarksContent,
  annotationsContent,
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

  const progressDescription =
    normalizedTotalPages > 0
      ? `Página ${normalizedCurrentPage} de ${normalizedTotalPages}`
      : 'Progresso indisponível'

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
        <div className="reader-side-panel__heading">
          <span
            className="reader-side-panel__heading-icon"
            aria-hidden="true"
          >
            <ReadingIcon />
          </span>

          <div className="reader-side-panel__heading-text">
            <span className="reader-side-panel__eyebrow">
              Documento
            </span>

            <h2 className="reader-page__panel-title">
              Leitura
            </h2>
          </div>
        </div>

        <Button
          variant={
            ButtonVariant.GHOST
          }
          size={
            ButtonSize.SMALL
          }
          iconOnly
          aria-label="Fechar painel lateral"
          title="Fechar painel"
          onClick={onClose}
        >
          <CloseIcon />
        </Button>
      </header>

      <div className="reader-page__panel-content">
        <section
          className="
            reader-side-panel__section
            reader-side-panel__section--progress
          "
          aria-labelledby={
            progressTitleId
          }
        >
          <div className="reader-side-panel__progress-header">
            <div>
              <span className="reader-side-panel__section-eyebrow">
                Sessão atual
              </span>

              <h3
                id={progressTitleId}
                className="reader-side-panel__section-title"
              >
                Progresso
              </h3>
            </div>

            <strong className="reader-side-panel__progress-value">
              {progressPercentage}%
            </strong>
          </div>

          <p
            className="reader-side-panel__progress-page"
            aria-live="polite"
          >
            {progressDescription}
          </p>

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

        {outlineContent !== undefined && (
          <div
            className="
              reader-side-panel__section
              reader-side-panel__section--content
            "
            data-reader-section="outline"
          >
            {outlineContent}
          </div>
        )}

        {searchContent !== undefined && (
          <div
            className="
              reader-side-panel__section
              reader-side-panel__section--content
            "
            data-reader-section="search"
          >
            {searchContent}
          </div>
        )}

        {annotationsContent !== undefined && (
          <div
            className="
              reader-side-panel__section
              reader-side-panel__section--content
            "
            data-reader-section="annotations"
          >
            {annotationsContent}
          </div>
        )}

        {bookmarksContent !== undefined && (
          <div
            className="
              reader-side-panel__section
              reader-side-panel__section--content
            "
            data-reader-section="bookmarks"
          >
            {bookmarksContent}
          </div>
        )}
      </div>
    </aside>
  )
}