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
  Bookmark,
} from '@/models/entities/Bookmark'
import type {
  BookmarkId,
} from '@/models/value-objects/BookmarkId'
import {
  formatDate,
} from '@/utils/formatters/formatDate'

import '@/styles/components/reader-bookmarks.css'

export interface ReaderBookmarksProps
  extends HTMLAttributes<HTMLElement> {
  readonly bookmarks:
    readonly Bookmark[]

  readonly currentPage: number

  readonly isLoading?: boolean
  readonly isMutating?: boolean

  readonly errorMessage?: string | null

  readonly onAddCurrentPage: () =>
    void | Promise<void>

  readonly onOpenBookmark: (
    bookmark: Bookmark,
  ) => void | Promise<void>

  readonly onDeleteBookmark: (
    bookmarkId: BookmarkId,
  ) => void | Promise<void>

  readonly onDismissError: () => void
}

function BookmarkIcon() {
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
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4z" />
    </svg>
  )
}

function AddBookmarkIcon() {
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
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4z" />
      <path d="M12 7v6" />
      <path d="M9 10h6" />
    </svg>
  )
}

function DeleteIcon() {
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
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="m6.5 7 1 14h9l1-14" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
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

function createBookmarksClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-bookmarks',
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(customClassName)
  }

  return classNames.join(' ')
}

function normalizeCurrentPage(
  currentPage: number,
): number {
  if (
    !Number.isFinite(currentPage) ||
    currentPage <= 0
  ) {
    return 1
  }

  return Math.trunc(currentPage)
}

export function ReaderBookmarks({
  bookmarks,
  currentPage,
  isLoading = false,
  isMutating = false,
  errorMessage = null,
  onAddCurrentPage,
  onOpenBookmark,
  onDeleteBookmark,
  onDismissError,
  className,
  ...sectionProps
}: ReaderBookmarksProps) {
  const titleId = useId()

  const normalizedCurrentPage =
    normalizeCurrentPage(currentPage)

  const currentPageBookmark =
    bookmarks.find(
      (bookmark) =>
        bookmark.pageNumber ===
        normalizedCurrentPage,
    ) ?? null

  const normalizedErrorMessage =
    errorMessage?.trim() ?? ''

  const hasError =
    normalizedErrorMessage.length > 0

  const handleAddCurrentPage = () => {
    if (
      isMutating ||
      currentPageBookmark !== null
    ) {
      return
    }

    void onAddCurrentPage()
  }

  return (
    <section
      {...sectionProps}
      className={createBookmarksClassName(
        className,
      )}
      aria-labelledby={titleId}
      aria-busy={
        isLoading || isMutating
      }
    >
      <header className="reader-bookmarks__header">
        <div className="reader-bookmarks__title-group">
          <h3
            id={titleId}
            className="reader-bookmarks__title"
          >
            Favoritos
          </h3>

          <span
            className="reader-bookmarks__count"
            aria-label={
              bookmarks.length === 1
                ? '1 favorito'
                : `${bookmarks.length} favoritos`
            }
          >
            {bookmarks.length}
          </span>
        </div>

        <Button
          variant={
            currentPageBookmark !== null
              ? ButtonVariant.SECONDARY
              : ButtonVariant.PRIMARY
          }
          size={ButtonSize.SMALL}
          leadingIcon={
            <AddBookmarkIcon />
          }
          disabled={
            isLoading ||
            isMutating ||
            currentPageBookmark !== null
          }
          onClick={
            handleAddCurrentPage
          }
        >
          {currentPageBookmark !== null
            ? 'Favoritada'
            : 'Favoritar página'}
        </Button>
      </header>

      {hasError && (
        <div className="reader-bookmarks__feedback">
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Não foi possível concluir a operação"
            description={
              normalizedErrorMessage
            }
            icon={<ErrorIcon />}
            compact
            action={
              <Button
                variant={
                  ButtonVariant.GHOST
                }
                size={ButtonSize.SMALL}
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
        <div className="reader-bookmarks__loading">
          <LoadingIndicator
            label="Carregando favoritos..."
          />
        </div>
      )}

      {!isLoading &&
        bookmarks.length === 0 && (
          <div className="reader-bookmarks__empty">
            <div
              className="reader-bookmarks__empty-icon"
              aria-hidden="true"
            >
              <BookmarkIcon />
            </div>

            <p className="reader-bookmarks__empty-message">
              Adicione páginas importantes para
              encontrá-las rapidamente durante a
              leitura.
            </p>
          </div>
        )}

      {!isLoading &&
        bookmarks.length > 0 && (
          <ul
            className="reader-bookmarks__list"
            aria-label="Páginas favoritas"
          >
            {bookmarks.map(
              (bookmark) => (
                <li
                  key={bookmark.id}
                  className="reader-bookmarks__item"
                >
                  <button
                    type="button"
                    className="reader-bookmarks__open-button"
                    disabled={isMutating}
                    aria-label={
                      `Ir para a página ${bookmark.pageNumber}`
                    }
                    onClick={() => {
                      void onOpenBookmark(
                        bookmark,
                      )
                    }}
                  >
                    <span
                      className="reader-bookmarks__icon"
                      aria-hidden="true"
                    >
                      <BookmarkIcon />
                    </span>

                    <span className="reader-bookmarks__information">
                      <strong className="reader-bookmarks__page">
                        Página{' '}
                        {bookmark.pageNumber}
                      </strong>

                      <span className="reader-bookmarks__date">
                        Adicionado em{' '}
                        {formatDate(
                          bookmark.createdAt,
                        )}
                      </span>
                    </span>
                  </button>

                  <Button
                    className="reader-bookmarks__delete-button"
                    variant={
                      ButtonVariant.DANGER
                    }
                    size={ButtonSize.SMALL}
                    iconOnly
                    disabled={isMutating}
                    aria-label={
                      `Remover favorito da página ${bookmark.pageNumber}`
                    }
                    title="Remover favorito"
                    onClick={() => {
                      void onDeleteBookmark(
                        bookmark.id,
                      )
                    }}
                  >
                    <DeleteIcon />
                  </Button>
                </li>
              ),
            )}
          </ul>
        )}
    </section>
  )
}