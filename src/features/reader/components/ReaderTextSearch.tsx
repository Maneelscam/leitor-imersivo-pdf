import {
  useEffect,
  useId,
  useRef,
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
  PdfTextSearchOccurrence,
  PdfTextSearchResult,
} from '@/models/dtos/PdfTextSearchResult'

import '@/styles/components/reader-text-search.css'

export interface ReaderTextSearchProps
  extends HTMLAttributes<HTMLElement> {
  readonly searchQuery: string

  readonly result:
    PdfTextSearchResult | null

  readonly activeOccurrence?:
    PdfTextSearchOccurrence | null

  readonly isSearching?: boolean

  readonly completedPages?: number
  readonly totalPages?: number

  readonly errorMessage?:
    string | null

  readonly focusRequestId?: number

  readonly onSearch: (
    query: string,
  ) => void | Promise<void>

  readonly onOpenOccurrence: (
    occurrence:
      PdfTextSearchOccurrence,
  ) => void | Promise<void>

  readonly onClear: () => void

  readonly onDismissError: () => void
}

function SearchIcon() {
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
        cx="10.5"
        cy="10.5"
        r="6.5"
      />

      <path d="m15.5 15.5 5 5" />
    </svg>
  )
}

function ClearIcon() {
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

function ResultIcon() {
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
      <path d="M5 4h14" />
      <path d="M5 9h14" />
      <path d="M5 14h8" />
      <path d="M5 19h6" />
    </svg>
  )
}

function PreviousIcon() {
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

function NextIcon() {
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
      <path d="m9 18 6-6-6-6" />
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

function createTextSearchClassName(
  customClassName:
    string | undefined,
): string {
  const classNames = [
    'reader-text-search',
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

function createOccurrenceButtonClassName(
  isActive: boolean,
): string {
  const classNames = [
    'reader-text-search__occurrence-button',
  ]

  if (isActive) {
    classNames.push(
      'reader-text-search__occurrence-button--active',
    )
  }

  return classNames.join(' ')
}

function normalizePageCount(
  value: number,
): number {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 0
  }

  return Math.trunc(value)
}

function createProgressLabel(
  completedPages: number,
  totalPages: number,
): string {
  if (totalPages <= 0) {
    return 'Preparando pesquisa...'
  }

  return [
    'Pesquisando página ',
    Math.min(
      completedPages,
      totalPages,
    ),
    ' de ',
    totalPages,
    '...',
  ].join('')
}

function createResultCountLabel(
  totalOccurrences: number,
): string {
  if (totalOccurrences === 1) {
    return '1 ocorrência'
  }

  return `${totalOccurrences} ocorrências`
}

function isSameOccurrence(
  firstOccurrence:
    PdfTextSearchOccurrence | null,

  secondOccurrence:
    PdfTextSearchOccurrence,
): boolean {
  return (
    firstOccurrence !== null &&
    firstOccurrence.pageNumber ===
      secondOccurrence.pageNumber &&
    firstOccurrence
      .occurrenceIndexOnPage ===
      secondOccurrence
        .occurrenceIndexOnPage
  )
}

export function ReaderTextSearch({
  searchQuery,
  result,
  activeOccurrence = null,
  isSearching = false,
  completedPages = 0,
  totalPages = 0,
  errorMessage = null,
  focusRequestId = 0,
  onSearch,
  onOpenOccurrence,
  onClear,
  onDismissError,
  className,
  ...sectionProps
}: ReaderTextSearchProps) {
  const titleId = useId()
  const inputId = useId()

  const searchInputRef =
    useRef<HTMLInputElement>(null)

  const activeOccurrenceButtonRef =
    useRef<HTMLButtonElement>(null)

  const [
    inputValue,
    setInputValue,
  ] = useState(searchQuery)

  useEffect(() => {
    setInputValue(
      searchQuery,
    )
  }, [
    searchQuery,
  ])

  useEffect(() => {
    if (focusRequestId <= 0) {
      return
    }

    const animationFrameId =
      window.requestAnimationFrame(() => {
        const inputElement =
          searchInputRef.current

        if (inputElement === null) {
          return
        }

        inputElement.focus()
        inputElement.select()
      })

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )
    }
  }, [
    focusRequestId,
  ])

  useEffect(() => {
    if (activeOccurrence === null) {
      return
    }

    const animationFrameId =
      window.requestAnimationFrame(() => {
        activeOccurrenceButtonRef
          .current
          ?.scrollIntoView({
            block: 'nearest',
            inline: 'nearest',
          })
      })

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )
    }
  }, [
    activeOccurrence,
  ])

  const normalizedCompletedPages =
    normalizePageCount(
      completedPages,
    )

  const normalizedTotalPages =
    normalizePageCount(
      totalPages,
    )

  const normalizedErrorMessage =
    errorMessage?.trim() ?? ''

  const hasError =
    normalizedErrorMessage.length > 0

  const normalizedInputValue =
    inputValue.trim()

  const hasSearch =
    result !== null

  const hasResults =
    result !== null &&
    result.totalOccurrences > 0

  const occurrences =
    result?.pageResults.flatMap(
      (pageResult) =>
        pageResult.occurrences,
    ) ?? []

  const activeOccurrenceIndex =
    occurrences.findIndex(
      (occurrence) =>
        isSameOccurrence(
          activeOccurrence,
          occurrence,
        ),
    )

  const activeOccurrencePosition =
    activeOccurrenceIndex >= 0
      ? activeOccurrenceIndex + 1
      : 0

  const handleSubmit = (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (
      isSearching ||
      normalizedInputValue.length === 0
    ) {
      return
    }

    void onSearch(
      normalizedInputValue,
    )
  }

  const handleClear = () => {
    if (isSearching) {
      return
    }

    setInputValue('')
    onClear()
  }

  const handleOpenPreviousOccurrence =
    () => {
      if (occurrences.length === 0) {
        return
      }

      const previousIndex =
        activeOccurrenceIndex <= 0
          ? occurrences.length - 1
          : activeOccurrenceIndex - 1

      const previousOccurrence =
        occurrences[previousIndex]

      if (
        previousOccurrence === undefined
      ) {
        return
      }

      void onOpenOccurrence(
        previousOccurrence,
      )
    }

  const handleOpenNextOccurrence =
    () => {
      if (occurrences.length === 0) {
        return
      }

      const nextIndex =
        activeOccurrenceIndex < 0 ||
        activeOccurrenceIndex >=
          occurrences.length - 1
          ? 0
          : activeOccurrenceIndex + 1

      const nextOccurrence =
        occurrences[nextIndex]

      if (
        nextOccurrence === undefined
      ) {
        return
      }

      void onOpenOccurrence(
        nextOccurrence,
      )
    }

  return (
    <section
      {...sectionProps}
      className={
        createTextSearchClassName(
          className,
        )
      }
      aria-labelledby={titleId}
      aria-busy={isSearching}
    >
      <header className="reader-text-search__header">
        <div className="reader-text-search__title-group">
          <h3
            id={titleId}
            className="reader-text-search__title"
          >
            Pesquisar no PDF
          </h3>

          {result !== null && (
            <span
              className="reader-text-search__count"
              aria-label={
                createResultCountLabel(
                  result.totalOccurrences,
                )
              }
            >
              {result.totalOccurrences}
            </span>
          )}
        </div>
      </header>

      <form
        className="reader-text-search__form"
        role="search"
        onSubmit={handleSubmit}
      >
        <label
          className="reader-text-search__label"
          htmlFor={inputId}
        >
          Termo de pesquisa
        </label>

        <div className="reader-text-search__field">
          <input
            ref={searchInputRef}
            id={inputId}
            className="reader-text-search__input"
            type="search"
            value={inputValue}
            disabled={isSearching}
            autoComplete="off"
            placeholder="Digite uma palavra ou frase"
            aria-label="Pesquisar texto no PDF"
            onChange={(event) => {
              setInputValue(
                event.currentTarget.value,
              )
            }}
          />

          {(
            inputValue.length > 0 ||
            hasSearch
          ) && (
            <Button
              className="reader-text-search__clear-button"
              type="button"
              variant={
                ButtonVariant.GHOST
              }
              size={ButtonSize.SMALL}
              iconOnly
              disabled={isSearching}
              aria-label="Limpar pesquisa"
              title="Limpar pesquisa"
              onClick={
                handleClear
              }
            >
              <ClearIcon />
            </Button>
          )}
        </div>

        <Button
          className="reader-text-search__submit-button"
          type="submit"
          variant={
            ButtonVariant.PRIMARY
          }
          size={ButtonSize.SMALL}
          leadingIcon={
            <SearchIcon />
          }
          disabled={
            isSearching ||
            normalizedInputValue.length === 0
          }
        >
          {isSearching
            ? 'Pesquisando...'
            : 'Pesquisar'}
        </Button>
      </form>

      {hasError && (
        <div className="reader-text-search__feedback">
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Não foi possível pesquisar"
            description={
              normalizedErrorMessage
            }
            icon={<ErrorIcon />}
            compact
            action={
              <Button
                type="button"
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

      {isSearching && (
        <div className="reader-text-search__loading">
          <LoadingIndicator
            label={
              createProgressLabel(
                normalizedCompletedPages,
                normalizedTotalPages,
              )
            }
          />

          {normalizedTotalPages > 0 && (
            <progress
              className="reader-text-search__progress"
              value={
                Math.min(
                  normalizedCompletedPages,
                  normalizedTotalPages,
                )
              }
              max={
                normalizedTotalPages
              }
              aria-label="Progresso da pesquisa"
            />
          )}
        </div>
      )}

      {!isSearching &&
        result === null && (
          <div className="reader-text-search__empty">
            <div
              className="reader-text-search__empty-icon"
              aria-hidden="true"
            >
              <SearchIcon />
            </div>

            <p className="reader-text-search__empty-message">
              Encontre palavras ou frases em todas as
              páginas do documento.
            </p>
          </div>
        )}

      {!isSearching &&
        result !== null &&
        !hasResults && (
          <div className="reader-text-search__empty">
            <div
              className="reader-text-search__empty-icon"
              aria-hidden="true"
            >
              <ResultIcon />
            </div>

            <p className="reader-text-search__empty-message">
              Nenhuma ocorrência de “{result.query}” foi
              encontrada.
            </p>
          </div>
        )}

      {!isSearching &&
        hasResults &&
        result !== null && (
          <div className="reader-text-search__results">
            <div className="reader-text-search__results-toolbar">
              <p
                className="reader-text-search__summary"
                aria-live="polite"
              >
                {createResultCountLabel(
                  result.totalOccurrences,
                )}{' '}
                em{' '}
                {result.pagesWithOccurrences === 1
                  ? '1 página'
                  : `${result.pagesWithOccurrences} páginas`}
              </p>

              <div className="reader-text-search__navigation">
                <Button
                  type="button"
                  variant={
                    ButtonVariant.GHOST
                  }
                  size={ButtonSize.SMALL}
                  iconOnly
                  aria-label="Ir para a ocorrência anterior"
                  title="Ocorrência anterior"
                  onClick={
                    handleOpenPreviousOccurrence
                  }
                >
                  <PreviousIcon />
                </Button>

                <span
                  className="reader-text-search__position"
                  aria-live="polite"
                  aria-label={[
                    activeOccurrencePosition,
                    ' de ',
                    result.totalOccurrences,
                    ' ocorrências',
                  ].join('')}
                >
                  {activeOccurrencePosition}{' '}
                  de{' '}
                  {result.totalOccurrences}
                </span>

                <Button
                  type="button"
                  variant={
                    ButtonVariant.GHOST
                  }
                  size={ButtonSize.SMALL}
                  iconOnly
                  aria-label="Ir para a próxima ocorrência"
                  title="Próxima ocorrência"
                  onClick={
                    handleOpenNextOccurrence
                  }
                >
                  <NextIcon />
                </Button>
              </div>
            </div>

            <ol
              className="reader-text-search__page-list"
              aria-label="Resultados da pesquisa"
            >
              {result.pageResults.map(
                (pageResult) => (
                  <li
                    key={
                      pageResult.pageNumber
                    }
                    className="reader-text-search__page-item"
                  >
                    <div className="reader-text-search__page-header">
                      <strong className="reader-text-search__page-title">
                        Página{' '}
                        {pageResult.pageNumber}
                      </strong>

                      <span className="reader-text-search__page-count">
                        {createResultCountLabel(
                          pageResult.occurrenceCount,
                        )}
                      </span>
                    </div>

                    <ol className="reader-text-search__occurrence-list">
                      {pageResult.occurrences.map(
                        (occurrence) => {
                          const isActive =
                            isSameOccurrence(
                              activeOccurrence,
                              occurrence,
                            )

                          return (
                            <li
                              key={[
                                occurrence.pageNumber,
                                occurrence
                                  .occurrenceIndexOnPage,
                              ].join(':')}
                              className="reader-text-search__occurrence-item"
                            >
                              <button
                                ref={
                                  isActive
                                    ? activeOccurrenceButtonRef
                                    : undefined
                                }
                                type="button"
                                className={
                                  createOccurrenceButtonClassName(
                                    isActive,
                                  )
                                }
                                aria-current={
                                  isActive
                                    ? 'true'
                                    : undefined
                                }
                                aria-label={[
                                  'Ir para a ocorrência ',
                                  occurrence
                                    .occurrenceIndexOnPage,
                                  ' na página ',
                                  occurrence.pageNumber,
                                ].join('')}
                                onClick={() => {
                                  void onOpenOccurrence(
                                    occurrence,
                                  )
                                }}
                              >
                                <span className="reader-text-search__occurrence-heading">
                                  <span
                                    className="reader-text-search__occurrence-icon"
                                    aria-hidden="true"
                                  >
                                    <SearchIcon />
                                  </span>

                                  <strong className="reader-text-search__matched-text">
                                    {occurrence.matchedText}
                                  </strong>
                                </span>

                                <span className="reader-text-search__preview">
                                  {occurrence.preview}
                                </span>
                              </button>
                            </li>
                          )
                        },
                      )}
                    </ol>
                  </li>
                ),
              )}
            </ol>
          </div>
        )}
    </section>
  )
}