import {
  useId,
  useState,
  type FormEvent,
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
  Annotation,
} from '@/models/entities/Annotation'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import {
  formatDate,
} from '@/utils/formatters/formatDate'

import '@/styles/components/reader-annotations.css'

const NOTE_MAX_LENGTH = 2000

export interface ReaderAnnotationsProps
  extends HTMLAttributes<HTMLElement> {
  readonly annotations:
    readonly Annotation[]

  readonly currentPage: number

  readonly isLoading?: boolean
  readonly isMutating?: boolean

  readonly errorMessage?: string | null

  readonly onAddNote: (
    content: string,
  ) => void | Promise<void>

  readonly onOpenAnnotation: (
    annotation: Annotation,
  ) => void | Promise<void>

  readonly onDeleteAnnotation: (
    annotationId: AnnotationId,
  ) => void | Promise<void>

  readonly onDismissError: () => void
}

function NoteIcon() {
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
      <path d="M6 3.5h9l3 3V20.5H6z" />
      <path d="M15 3.5v4h3" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </svg>
  )
}

function HighlightIcon() {
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
      <path d="m14.5 4.5 5 5-9.5 9.5H5v-5z" />
      <path d="m12.5 6.5 5 5" />
      <path d="M4 21h16" />
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

function EmptyIcon() {
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
      <path d="M5 4h14v16H5z" />
      <path d="M8.5 9h7" />
      <path d="M8.5 13h4.5" />
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

function createAnnotationsClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-annotations',
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
    !Number.isFinite(currentPage) ||
    currentPage <= 0
  ) {
    return 1
  }

  return Math.trunc(currentPage)
}

function createAnnotationItemClassName(
  annotation: Annotation,
): string {
  const classNames = [
    'reader-annotations__item',
    `reader-annotations__item--${annotation.type}`,
  ]

  if (
    annotation.type ===
    AnnotationType.HIGHLIGHT
  ) {
    classNames.push(
      `reader-annotations__item--${annotation.color}`,
    )
  }

  return classNames.join(' ')
}

function getAnnotationLabel(
  annotation: Annotation,
): string {
  return annotation.type ===
    AnnotationType.HIGHLIGHT
    ? 'Marcação'
    : 'Nota'
}

function getAnnotationDescription(
  annotation: Annotation,
): string {
  return annotation.type ===
    AnnotationType.HIGHLIGHT
    ? annotation.selectedText
    : annotation.content
}

export function ReaderAnnotations({
  annotations,
  currentPage,
  isLoading = false,
  isMutating = false,
  errorMessage = null,
  onAddNote,
  onOpenAnnotation,
  onDeleteAnnotation,
  onDismissError,
  className,
  ...sectionProps
}: ReaderAnnotationsProps) {
  const titleId = useId()
  const noteInputId = useId()

  const [
    noteContent,
    setNoteContent,
  ] = useState('')

  const normalizedCurrentPage =
    normalizeCurrentPage(
      currentPage,
    )

  const normalizedNoteContent =
    noteContent.trim()

  const normalizedErrorMessage =
    errorMessage?.trim() ?? ''

  const hasError =
    normalizedErrorMessage.length > 0

  const canSubmitNote =
    !isLoading &&
    !isMutating &&
    normalizedNoteContent.length > 0

  const handleSubmitNote = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!canSubmitNote) {
      return
    }

    void Promise.resolve(
      onAddNote(
        normalizedNoteContent,
      ),
    ).then(() => {
      setNoteContent('')
    })
  }

  return (
    <section
      {...sectionProps}
      className={
        createAnnotationsClassName(
          className,
        )
      }
      aria-labelledby={titleId}
      aria-busy={
        isLoading || isMutating
      }
    >
      <header className="reader-annotations__header">
        <div className="reader-annotations__title-group">
          <h3
            id={titleId}
            className="reader-annotations__title"
          >
            Anotações
          </h3>

          <span
            className="reader-annotations__count"
            aria-label={
              annotations.length === 1
                ? '1 anotação'
                : `${annotations.length} anotações`
            }
          >
            {annotations.length}
          </span>
        </div>
      </header>

      <form
        className="reader-annotations__note-form"
        onSubmit={handleSubmitNote}
      >
        <label
          className="reader-annotations__note-label"
          htmlFor={noteInputId}
        >
          Nota na página{' '}
          {normalizedCurrentPage}
        </label>

        <textarea
          id={noteInputId}
          className="reader-annotations__note-input"
          value={noteContent}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          disabled={
            isLoading ||
            isMutating
          }
          placeholder="Escreva uma observação sobre esta página..."
          onChange={(event) => {
            setNoteContent(
              event.target.value,
            )
          }}
        />

        <div className="reader-annotations__note-footer">
          <span className="reader-annotations__character-count">
            {noteContent.length}/
            {NOTE_MAX_LENGTH}
          </span>

          <Button
            type="submit"
            variant={
              ButtonVariant.PRIMARY
            }
            size={ButtonSize.SMALL}
            leadingIcon={<NoteIcon />}
            disabled={!canSubmitNote}
          >
            Salvar nota
          </Button>
        </div>
      </form>

      {hasError && (
        <div className="reader-annotations__feedback">
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
        <div className="reader-annotations__loading">
          <LoadingIndicator
            label="Carregando anotações..."
          />
        </div>
      )}

      {!isLoading &&
        annotations.length === 0 && (
          <div className="reader-annotations__empty">
            <div
              className="reader-annotations__empty-icon"
              aria-hidden="true"
            >
              <EmptyIcon />
            </div>

            <p className="reader-annotations__empty-message">
              Suas notas e marcações aparecerão aqui,
              organizadas pela posição no documento.
            </p>
          </div>
        )}

      {!isLoading &&
        annotations.length > 0 && (
          <ul
            className="reader-annotations__list"
            aria-label="Anotações do documento"
          >
            {annotations.map(
              (annotation) => (
                <li
                  key={annotation.id}
                  className={
                    createAnnotationItemClassName(
                      annotation,
                    )
                  }
                >
                  <button
                    type="button"
                    className="reader-annotations__open-button"
                    disabled={isMutating}
                    aria-label={
                      `Ir para ${getAnnotationLabel(annotation).toLocaleLowerCase('pt-BR')} da página ${annotation.pageNumber}`
                    }
                    onClick={() => {
                      void onOpenAnnotation(
                        annotation,
                      )
                    }}
                  >
                    <span
                      className="reader-annotations__icon"
                      aria-hidden="true"
                    >
                      {annotation.type ===
                      AnnotationType.HIGHLIGHT
                        ? <HighlightIcon />
                        : <NoteIcon />}
                    </span>

                    <span className="reader-annotations__information">
                      <span className="reader-annotations__meta">
                        <strong className="reader-annotations__type">
                          {getAnnotationLabel(
                            annotation,
                          )}
                        </strong>

                        <span className="reader-annotations__page">
                          Página{' '}
                          {annotation.pageNumber}
                        </span>
                      </span>

                      <span className="reader-annotations__description">
                        {getAnnotationDescription(
                          annotation,
                        )}
                      </span>

                      <span className="reader-annotations__date">
                        Criada em{' '}
                        {formatDate(
                          annotation.createdAt,
                        )}
                      </span>
                    </span>
                  </button>

                  <Button
                    className="reader-annotations__delete-button"
                    variant={
                      ButtonVariant.DANGER
                    }
                    size={ButtonSize.SMALL}
                    iconOnly
                    disabled={isMutating}
                    aria-label={
                      `Excluir ${getAnnotationLabel(annotation).toLocaleLowerCase('pt-BR')} da página ${annotation.pageNumber}`
                    }
                    title="Excluir anotação"
                    onClick={() => {
                      void onDeleteAnnotation(
                        annotation.id,
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
