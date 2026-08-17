import {
  useId,
  type HTMLAttributes,
} from 'react'

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
import type {
  PdfOutlineItem,
} from '@/models/dtos/PdfOutlineItem'

import '@/styles/components/reader-outline.css'

export interface ReaderOutlineProps
  extends HTMLAttributes<HTMLElement> {
  readonly items:
    readonly PdfOutlineItem[]

  readonly currentPage: number

  readonly isLoading?: boolean

  readonly errorMessage?:
    string | null

  readonly onOpenItem: (
    item: PdfOutlineItem,
  ) => void | Promise<void>

  readonly onDismissError:
    () => void
}

interface OutlineListProps {
  readonly items:
    readonly PdfOutlineItem[]

  readonly currentPage:
    number

  readonly onOpenItem: (
    item: PdfOutlineItem,
  ) => void | Promise<void>
}

function OutlineIcon() {
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
      <path d="M4 5h2" />
      <path d="M4 12h2" />
      <path d="M4 19h2" />
      <path d="M9 5h11" />
      <path d="M9 12h11" />
      <path d="M9 19h11" />
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

function createOutlineClassName(
  customClassName:
    string | undefined,
): string {
  const classNames = [
    'reader-outline',
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
): number {
  if (
    !Number.isFinite(
      currentPage,
    ) ||
    currentPage <= 0
  ) {
    return 1
  }

  return Math.trunc(
    currentPage,
  )
}

function countOutlineItems(
  items:
    readonly PdfOutlineItem[],
): number {
  return items.reduce(
    (
      total,
      item,
    ) =>
      total +
      1 +
      countOutlineItems(
        item.children,
      ),
    0,
  )
}

function OutlineList({
  items,
  currentPage,
  onOpenItem,
}: OutlineListProps) {
  return (
    <ul
      className="reader-outline__list"
      role="tree"
    >
      {items.map(
        (item) => {
          const hasDestination =
            item.pageNumber !== null

          const isCurrentPage =
            item.pageNumber ===
            currentPage

          const hasChildren =
            item.children.length > 0

          return (
            <li
              key={item.id}
              className="reader-outline__item"
              role="treeitem"
              aria-current={
                isCurrentPage
                  ? 'page'
                  : undefined
              }
            >
              {hasDestination ? (
                <button
                  type="button"
                  className={
                    [
                      'reader-outline__open-button',
                      isCurrentPage
                        ? 'reader-outline__open-button--current'
                        : null,
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(' ')
                  }
                  aria-label={
                    `Ir para ${item.title}, página ${item.pageNumber}`
                  }
                  onClick={() => {
                    void onOpenItem(
                      item,
                    )
                  }}
                >
                  <span className="reader-outline__item-content">
                    <span className="reader-outline__item-title">
                      {item.title}
                    </span>

                    <span className="reader-outline__page">
                      {item.pageNumber}
                    </span>
                  </span>
                </button>
              ) : (
                <div
                  className="
                    reader-outline__open-button
                    reader-outline__open-button--unavailable
                  "
                  aria-label={
                    `${item.title}, destino indisponível`
                  }
                >
                  <span className="reader-outline__item-content">
                    <span className="reader-outline__item-title">
                      {item.title}
                    </span>

                    <span className="reader-outline__page reader-outline__page--unavailable">
                      —
                    </span>
                  </span>
                </div>
              )}

              {hasChildren && (
                <div className="reader-outline__children">
                  <OutlineList
                    items={
                      item.children
                    }
                    currentPage={
                      currentPage
                    }
                    onOpenItem={
                      onOpenItem
                    }
                  />
                </div>
              )}
            </li>
          )
        },
      )}
    </ul>
  )
}

export function ReaderOutline({
  items,
  currentPage,
  isLoading = false,
  errorMessage = null,
  onOpenItem,
  onDismissError,
  className,
  ...sectionProps
}: ReaderOutlineProps) {
  const titleId = useId()

  const normalizedCurrentPage =
    normalizeCurrentPage(
      currentPage,
    )

  const normalizedErrorMessage =
    errorMessage?.trim() ?? ''

  const hasError =
    normalizedErrorMessage.length >
    0

  const totalItems =
    countOutlineItems(
      items,
    )

  return (
    <section
      {...sectionProps}
      className={
        createOutlineClassName(
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
      <header className="reader-outline__header">
        <div className="reader-outline__title-group">
          <div className="reader-outline__title-heading">
            <span
              className="reader-outline__title-icon"
              aria-hidden="true"
            >
              <OutlineIcon />
            </span>

            <h3
              id={titleId}
              className="reader-outline__title"
            >
              Sumário
            </h3>
          </div>

          <span
            className="reader-outline__count"
            aria-label={
              totalItems === 1
                ? '1 item no sumário'
                : `${totalItems} itens no sumário`
            }
          >
            {totalItems}
          </span>
        </div>
      </header>

      {hasError && (
        <div className="reader-outline__feedback">
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Não foi possível carregar o sumário"
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

      {isLoading && (
        <div className="reader-outline__loading">
          <LoadingIndicator
            label="Carregando sumário..."
          />
        </div>
      )}

      {!isLoading &&
        !hasError &&
        items.length === 0 && (
          <div className="reader-outline__empty">
            <div
              className="reader-outline__empty-icon"
              aria-hidden="true"
            >
              <OutlineIcon />
            </div>

            <div className="reader-outline__empty-content">
              <strong className="reader-outline__empty-title">
                Sumário indisponível
              </strong>

              <p className="reader-outline__empty-message">
                Este PDF não possui um sumário
                navegável incorporado ao documento.
              </p>
            </div>
          </div>
        )}

      {!isLoading &&
        items.length > 0 && (
          <nav
            className="reader-outline__navigation"
            aria-label="Sumário do documento"
          >
            <OutlineList
              items={items}
              currentPage={
                normalizedCurrentPage
              }
              onOpenItem={
                onOpenItem
              }
            />
          </nav>
        )}
    </section>
  )
}