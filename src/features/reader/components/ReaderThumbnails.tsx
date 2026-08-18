import {
  useId,
  type HTMLAttributes,
} from 'react'

import type {
  PDFPageProxy,
} from 'pdfjs-dist'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'
import {
  FeedbackMessage,
  FeedbackMessageVariant,
} from '@/components/feedback/FeedbackMessage'
import {
  LoadingIndicator,
} from '@/components/feedback/LoadingIndicator'
import {
  PdfPageCanvas,
} from '@/features/reader/components/PdfPageCanvas'

import '@/styles/components/reader-thumbnails.css'

export interface ReaderThumbnailsProps
  extends HTMLAttributes<HTMLElement> {
  readonly pages:
    readonly PDFPageProxy[]

  readonly currentPage:
    number

  readonly totalPages:
    number

  readonly rotation?: number

  readonly isLoading?: boolean

  readonly hasPreviousPages:
    boolean

  readonly hasNextPages:
    boolean

  readonly errorMessage?:
    string | null

  readonly onOpenPage: (
    pageNumber: number,
  ) => void | Promise<void>

  readonly onLoadPrevious:
    () => void | Promise<void>

  readonly onLoadNext:
    () => void | Promise<void>

  readonly onDismissError:
    () => void
}

function ThumbnailsIcon() {
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
        x="4"
        y="3"
        width="16"
        height="7"
        rx="1.5"
      />

      <rect
        x="4"
        y="14"
        width="16"
        height="7"
        rx="1.5"
      />
    </svg>
  )
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

function createThumbnailsClassName(
  customClassName:
    string | undefined,
): string {
  const classNames = [
    'reader-thumbnails',
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

function normalizeCurrentPage(
  currentPage: number,
  totalPages: number,
): number {
  const normalizedTotalPages =
    Number.isFinite(totalPages) &&
    totalPages > 0
      ? Math.trunc(totalPages)
      : 1

  if (
    !Number.isFinite(currentPage) ||
    currentPage <= 0
  ) {
    return 1
  }

  return Math.min(
    Math.trunc(currentPage),
    normalizedTotalPages,
  )
}

function normalizeTotalPages(
  totalPages: number,
): number {
  if (
    !Number.isFinite(totalPages) ||
    totalPages <= 0
  ) {
    return 0
  }

  return Math.trunc(totalPages)
}

export function ReaderThumbnails({
  pages,
  currentPage,
  totalPages,
  rotation = 0,
  isLoading = false,
  hasPreviousPages,
  hasNextPages,
  errorMessage = null,
  onOpenPage,
  onLoadPrevious,
  onLoadNext,
  onDismissError,
  className,
  ...sectionProps
}: ReaderThumbnailsProps) {
  const titleId = useId()

  const normalizedTotalPages =
    normalizeTotalPages(
      totalPages,
    )

  const normalizedCurrentPage =
    normalizeCurrentPage(
      currentPage,
      normalizedTotalPages,
    )

  const normalizedErrorMessage =
    errorMessage?.trim() ?? ''

  const hasError =
    normalizedErrorMessage.length >
    0

  const hasPages =
    pages.length > 0

  return (
    <section
      {...sectionProps}
      className={
        createThumbnailsClassName(
          className,
        )
      }
      aria-labelledby={
        titleId
      }
      aria-busy={
        isLoading
      }
    >
      <header className="reader-thumbnails__header">
        <div className="reader-thumbnails__title-group">
          <div className="reader-thumbnails__title-heading">
            <span
              className="reader-thumbnails__title-icon"
              aria-hidden="true"
            >
              <ThumbnailsIcon />
            </span>

            <h3
              id={titleId}
              className="reader-thumbnails__title"
            >
              Miniaturas
            </h3>
          </div>

          <span
            className="reader-thumbnails__count"
            aria-label={
              normalizedTotalPages === 1
                ? '1 página no documento'
                : `${normalizedTotalPages} páginas no documento`
            }
          >
            {normalizedTotalPages}
          </span>
        </div>
      </header>

      {hasError && (
        <div className="reader-thumbnails__feedback">
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Não foi possível carregar as miniaturas"
            description={
              normalizedErrorMessage
            }
            icon={
              <ErrorIcon />
            }
            compact
            action={
              <Button
                variant={
                  ButtonVariant.GHOST
                }
                size={
                  ButtonSize.SMALL
                }
                onClick={
                  onDismissError
                }
              >
                Fechar
              </Button>
            }
          />
        </div>
      )}

      {hasPreviousPages && (
        <div className="reader-thumbnails__load-more">
          <Button
            variant={
              ButtonVariant.GHOST
            }
            size={
              ButtonSize.SMALL
            }
            disabled={
              isLoading
            }
            onClick={() => {
              void onLoadPrevious()
            }}
          >
            Carregar anteriores
          </Button>
        </div>
      )}

      {!hasPages &&
        isLoading && (
          <div className="reader-thumbnails__loading">
            <LoadingIndicator
              label="Carregando miniaturas..."
            />
          </div>
        )}

      {!hasPages &&
        !isLoading &&
        !hasError && (
          <div className="reader-thumbnails__empty">
            <div
              className="reader-thumbnails__empty-icon"
              aria-hidden="true"
            >
              <ThumbnailsIcon />
            </div>

            <div className="reader-thumbnails__empty-content">
              <strong className="reader-thumbnails__empty-title">
                Miniaturas indisponíveis
              </strong>

              <p className="reader-thumbnails__empty-message">
                Nenhuma página está disponível
                para visualização.
              </p>
            </div>
          </div>
        )}

      {hasPages && (
        <nav
          className="reader-thumbnails__navigation"
          aria-label="Miniaturas das páginas do documento"
        >
          <ol className="reader-thumbnails__list">
            {pages.map(
              (page) => {
                const pageNumber =
                  page.pageNumber

                const isCurrentPage =
                  pageNumber ===
                  normalizedCurrentPage

                return (
                  <li
                    key={
                      pageNumber
                    }
                    className="reader-thumbnails__item"
                  >
                    <button
                      type="button"
                      className={
                        [
                          'reader-thumbnails__open-button',
                          isCurrentPage
                            ? 'reader-thumbnails__open-button--current'
                            : null,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(' ')
                      }
                      aria-label={
                        `Ir para a página ${pageNumber}`
                      }
                      aria-current={
                        isCurrentPage
                          ? 'page'
                          : undefined
                      }
                      onClick={() => {
                        void onOpenPage(
                          pageNumber,
                        )
                      }}
                    >
                      <span className="reader-thumbnails__preview">
                        <PdfPageCanvas
                          page={page}
                          scale={0.25}
                          rotation={
                            rotation
                          }
                          className="reader-thumbnails__canvas"
                          aria-hidden="true"
                        />
                      </span>

                      <span className="reader-thumbnails__page-number">
                        {pageNumber}
                      </span>
                    </button>
                  </li>
                )
              },
            )}
          </ol>
        </nav>
      )}

      {hasPages &&
        isLoading && (
          <div className="reader-thumbnails__loading reader-thumbnails__loading--inline">
            <LoadingIndicator
              label="Carregando mais miniaturas..."
            />
          </div>
        )}

      {hasNextPages && (
        <div className="reader-thumbnails__load-more">
          <Button
            variant={
              ButtonVariant.GHOST
            }
            size={
              ButtonSize.SMALL
            }
            disabled={
              isLoading
            }
            onClick={() => {
              void onLoadNext()
            }}
          >
            Carregar próximas
          </Button>
        </div>
      )}
    </section>
  )
}