import type {
  CSSProperties,
  HTMLAttributes,
} from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'
import { useBookCoverUrl } from '@/hooks/useBookCoverUrl'
import type { LibraryBookItem } from '@/models/dtos/LibraryBookItem'
import type { BookId } from '@/models/value-objects/BookId'
import { formatDate } from '@/utils/formatters/formatDate'
import { formatFileSize } from '@/utils/formatters/formatFileSize'
import {
  calculateReadingProgressRatio,
  formatReadingProgress,
} from '@/utils/formatters/formatReadingProgress'

import '@/styles/components/library-book-card.css'

export interface LibraryBookCardProps
  extends HTMLAttributes<HTMLElement> {
  readonly item: LibraryBookItem

  readonly isOpening?: boolean
  readonly isDeleting?: boolean
  readonly isEditing?: boolean

  readonly onOpen: (
    bookId: BookId,
  ) => void | Promise<void>

  readonly onDelete: (
    bookId: BookId,
  ) => void | Promise<void>

  readonly onEdit: (
    bookId: BookId,
  ) => void

  readonly onManageCollections?: (
    bookId: BookId,
  ) => void
}

interface ReadingProgressStyle
  extends CSSProperties {
  readonly '--library-book-progress': string
}

function DocumentIcon() {
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
      <path d="M6 2.5h8l4 4V21.5H6z" />
      <path d="M14 2.5v5h4" />
      <path d="M9 12h6" />
      <path d="M9 15.5h6" />
    </svg>
  )
}

function EditIcon() {
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
      <path d="M4 20h4l11-11-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

function CollectionIcon() {
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
      <path d="M3.5 6.5h6l2 2h9v10.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z" />
      <path d="M3.5 9h17" />
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

function formatPageCount(
  totalPages: number,
): string {
  return totalPages === 1
    ? '1 página'
    : `${totalPages} páginas`
}

function createCardClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'library-book-card',
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

export function LibraryBookCard({
  item,
  isOpening = false,
  isDeleting = false,
  isEditing = false,
  onOpen,
  onDelete,
  onEdit,
  onManageCollections,
  className,
  ...articleProps
}: LibraryBookCardProps) {
  const {
    book,
    cover,
    readingProgress,
  } = item

  const coverUrl =
    useBookCoverUrl(cover)

  const progressRatio =
    calculateReadingProgressRatio(
      readingProgress,
      book.totalPages,
    )

  const progressPercentage =
    Math.round(
      progressRatio * 100,
    )

  const progressLabel =
    formatReadingProgress(
      readingProgress,
      book.totalPages,
    )

  const progressStyle:
    ReadingProgressStyle = {
      '--library-book-progress':
        `${progressPercentage}%`,
    }

  const cardClassName =
    createCardClassName(
      className,
    )

  const isBusy =
    isOpening ||
    isDeleting ||
    isEditing

  const authorLabel =
    book.author ??
    'Autor não informado'

  const lastAccessLabel =
    book.lastOpenedAt === null
      ? 'Ainda não aberto'
      : `Aberto em ${formatDate(
          book.lastOpenedAt,
        )}`

  const handleOpen = () => {
    if (isBusy) {
      return
    }

    void onOpen(
      book.id,
    )
  }

  const handleEdit = () => {
    if (isBusy) {
      return
    }

    onEdit(
      book.id,
    )
  }

  const handleManageCollections = () => {
    if (
      isBusy ||
      onManageCollections === undefined
    ) {
      return
    }

    onManageCollections(
      book.id,
    )
  }

  const handleDelete = () => {
    if (isBusy) {
      return
    }

    void onDelete(
      book.id,
    )
  }

  return (
    <article
      {...articleProps}
      className={cardClassName}
      aria-busy={isBusy}
    >
      <button
        type="button"
        className="library-book-card__cover-button"
        aria-label={`Abrir ${book.title}`}
        disabled={isBusy}
        onClick={handleOpen}
      >
        <div className="library-book-card__cover-frame">
          {coverUrl !== null ? (
            <img
              className="library-book-card__cover"
              src={coverUrl}
              alt={`Capa de ${book.title}`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="library-book-card__cover-placeholder">
              <span className="library-book-card__cover-placeholder-icon">
                <DocumentIcon />
              </span>

              <span className="library-book-card__cover-placeholder-label">
                Capa indisponível
              </span>
            </div>
          )}

          <div
            className="library-book-card__progress-overlay"
            role="progressbar"
            aria-label={`Progresso de leitura de ${book.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              progressPercentage
            }
            aria-valuetext={
              progressLabel
            }
          >
            <span className="library-book-card__progress-track">
              <span
                className="library-book-card__progress-value"
                style={
                  progressStyle
                }
              />
            </span>

            <span className="library-book-card__progress-label">
              {progressLabel}
            </span>
          </div>
        </div>
      </button>

      <div className="library-book-card__body">
        <div className="library-book-card__information">
          <button
            type="button"
            className="library-book-card__title-button"
            disabled={isBusy}
            onClick={handleOpen}
          >
            <span className="library-book-card__title">
              {book.title}
            </span>
          </button>

          <span
            className="library-book-card__author"
            title={authorLabel}
          >
            {authorLabel}
          </span>

          <div className="library-book-card__metadata">
            <span className="library-book-card__metadata-item">
              {formatPageCount(
                book.totalPages,
              )}
            </span>

            <span className="library-book-card__metadata-item">
              {formatFileSize(
                book.fileSizeBytes,
              )}
            </span>

            <span className="library-book-card__metadata-item">
              Importado em{' '}
              {formatDate(
                book.importedAt,
              )}
            </span>
          </div>
        </div>

        <div className="library-book-card__footer">
          <span
            className="library-book-card__last-access"
            title={
              lastAccessLabel
            }
          >
            {lastAccessLabel}
          </span>

          <div className="library-book-card__actions">
            {onManageCollections !== undefined && (
              <Button
                className="library-book-card__collection-button"
                variant={
                  ButtonVariant.GHOST
                }
                size={
                  ButtonSize.SMALL
                }
                iconOnly
                disabled={isBusy}
                aria-label={`Organizar ${book.title} em coleções`}
                title={`Organizar ${book.title} em coleções`}
                onClick={
                  handleManageCollections
                }
              >
                <CollectionIcon />
              </Button>
            )}

            <Button
              className="library-book-card__edit-button"
              variant={
                ButtonVariant.GHOST
              }
              size={
                ButtonSize.SMALL
              }
              iconOnly
              disabled={isBusy}
              aria-label={`Editar informações de ${book.title}`}
              title={`Editar informações de ${book.title}`}
              onClick={
                handleEdit
              }
            >
              <EditIcon />
            </Button>

            <Button
              className="library-book-card__delete-button"
              variant={
                ButtonVariant.DANGER
              }
              size={
                ButtonSize.SMALL
              }
              iconOnly
              disabled={isBusy}
              aria-label={`Excluir ${book.title}`}
              title={`Excluir ${book.title}`}
              onClick={
                handleDelete
              }
            >
              <DeleteIcon />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}