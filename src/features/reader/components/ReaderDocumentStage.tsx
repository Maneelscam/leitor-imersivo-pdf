import {
  forwardRef,
  useCallback,
  useState,
  type HTMLAttributes,
} from 'react'

import type {
  PDFPageProxy,
} from 'pdfjs-dist'

import {
  FeedbackMessage,
  FeedbackMessageVariant,
} from '@/components/feedback/FeedbackMessage'
import {
  LoadingIndicator,
  LoadingIndicatorSize,
} from '@/components/feedback/LoadingIndicator'
import {
  PdfPageCanvas,
} from '@/features/reader/components/PdfPageCanvas'
import {
  PageDisplayMode,
  type PageDisplayMode as PageDisplayModeValue,
} from '@/models/enums/PageDisplayMode'
import {
  ReadingFlowMode,
  type ReadingFlowMode as ReadingFlowModeValue,
} from '@/models/enums/ReadingFlowMode'

export interface ReaderDocumentStageProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly page: PDFPageProxy | null
  readonly secondaryPage?: PDFPageProxy | null

  readonly continuousPages?:
    readonly PDFPageProxy[]

  readonly pageDisplayMode?:
    PageDisplayModeValue

  readonly readingFlowMode?:
    ReadingFlowModeValue

  readonly scale: number
  readonly rotation?: number

  readonly isPageLoading?: boolean

  readonly isSecondaryPageLoading?:
    boolean

  readonly isContinuousPagesLoading?:
    boolean

  readonly pageLoadError?:
    string | null

  readonly secondaryPageLoadError?:
    string | null

  readonly continuousPagesLoadError?:
    string | null

  readonly continuousHasPreviousPages?:
    boolean

  readonly continuousHasNextPages?:
    boolean
}

interface PageRenderError {
  readonly pageNumber: number
  readonly message: string
}

interface ReaderPageCanvasProps {
  readonly page: PDFPageProxy
  readonly scale: number
  readonly rotation: number

  readonly renderError:
    string | null

  readonly onRenderSuccess: (
    pageNumber: number,
  ) => void

  readonly onRenderError: (
    pageNumber: number,
    error: unknown,
  ) => void
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

function createStageClassName(
  pageDisplayMode: PageDisplayModeValue,
  readingFlowMode: ReadingFlowModeValue,
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-page__stage',
    `reader-page__stage--${readingFlowMode}`,
  ]

  if (
    readingFlowMode ===
    ReadingFlowMode.PAGINATED
  ) {
    classNames.push(
      `reader-page__stage--${pageDisplayMode}`,
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

function createDocumentClassName(
  pageDisplayMode: PageDisplayModeValue,
  readingFlowMode: ReadingFlowModeValue,
): string {
  const classNames = [
    'reader-page__document',
    `reader-page__document--${readingFlowMode}`,
  ]

  if (
    readingFlowMode ===
    ReadingFlowMode.PAGINATED
  ) {
    classNames.push(
      `reader-page__document--${pageDisplayMode}`,
    )
  }

  return classNames.join(' ')
}

function getRenderErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message
  }

  return 'Não foi possível renderizar esta página do PDF.'
}

function normalizeErrorMessage(
  errorMessage:
    string | null | undefined,
): string {
  return errorMessage?.trim() ?? ''
}

function ReaderPageCanvas({
  page,
  scale,
  rotation,
  renderError,
  onRenderSuccess,
  onRenderError,
}: ReaderPageCanvasProps) {
  const pageNumber = page.pageNumber

  return (
    <div
      className="reader-page__page"
      aria-label={`Página ${pageNumber}`}
      data-page-number={pageNumber}
    >
      <PdfPageCanvas
        page={page}
        scale={scale}
        rotation={rotation}
        aria-label={
          `Página ${pageNumber} do documento`
        }
        onRenderSuccess={() => {
          onRenderSuccess(pageNumber)
        }}
        onRenderError={(error) => {
          onRenderError(
            pageNumber,
            error,
          )
        }}
      />

      {renderError !== null && (
        <div className="reader-page__feedback">
          <FeedbackMessage
            variant={
              FeedbackMessageVariant.ERROR
            }
            title="Erro ao renderizar a página"
            description={renderError}
            icon={<ErrorIcon />}
          />
        </div>
      )}
    </div>
  )
}

export const ReaderDocumentStage =
  forwardRef<
    HTMLDivElement,
    ReaderDocumentStageProps
  >(
    function ReaderDocumentStage(
      {
        page,
        secondaryPage = null,
        continuousPages = [],

        pageDisplayMode =
          PageDisplayMode.SINGLE,

        readingFlowMode =
          ReadingFlowMode.PAGINATED,

        scale,
        rotation = 0,

        isPageLoading = false,

        isSecondaryPageLoading =
          false,

        isContinuousPagesLoading =
          false,

        pageLoadError = null,

        secondaryPageLoadError =
          null,

        continuousPagesLoadError =
          null,

        continuousHasPreviousPages =
          false,

        continuousHasNextPages =
          false,

        className,
        ...stageProps
      },
      stageRef,
    ) {
      const [
        renderErrors,
        setRenderErrors,
      ] = useState<
        readonly PageRenderError[]
      >([])

      const normalizedPageLoadError =
        normalizeErrorMessage(
          pageLoadError,
        )

      const normalizedSecondaryPageLoadError =
        normalizeErrorMessage(
          secondaryPageLoadError,
        )

      const normalizedContinuousPagesLoadError =
        normalizeErrorMessage(
          continuousPagesLoadError,
        )

      const hasPageLoadError =
        normalizedPageLoadError.length > 0

      const hasSecondaryPageLoadError =
        normalizedSecondaryPageLoadError
          .length > 0

      const hasContinuousPagesLoadError =
        normalizedContinuousPagesLoadError
          .length > 0

      const isPaginatedMode =
        readingFlowMode ===
        ReadingFlowMode.PAGINATED

      const isContinuousMode =
        readingFlowMode ===
        ReadingFlowMode.CONTINUOUS

      const isDoublePageMode =
        isPaginatedMode &&
        pageDisplayMode ===
          PageDisplayMode.DOUBLE

      const hasContinuousPages =
        continuousPages.length > 0

      const getPageRenderError =
        useCallback(
          (
            pageNumber: number,
          ): string | null => {
            return (
              renderErrors.find(
                (renderError) =>
                  renderError.pageNumber ===
                  pageNumber,
              )?.message ?? null
            )
          },
          [renderErrors],
        )

      const handleRenderSuccess =
        useCallback(
          (
            pageNumber: number,
          ) => {
            setRenderErrors(
              (currentErrors) =>
                currentErrors.filter(
                  (renderError) =>
                    renderError.pageNumber !==
                    pageNumber,
                ),
            )
          },
          [],
        )

      const handleRenderError =
        useCallback(
          (
            pageNumber: number,
            error: unknown,
          ) => {
            const message =
              getRenderErrorMessage(
                error,
              )

            setRenderErrors(
              (currentErrors) => {
                const remainingErrors =
                  currentErrors.filter(
                    (renderError) =>
                      renderError.pageNumber !==
                      pageNumber,
                  )

                return [
                  ...remainingErrors,
                  {
                    pageNumber,
                    message,
                  },
                ]
              },
            )
          },
          [],
        )

      const stageIsBusy =
        isContinuousMode
          ? isContinuousPagesLoading
          : isPageLoading ||
            isSecondaryPageLoading

      return (
        <div
          {...stageProps}
          ref={stageRef}
          className={createStageClassName(
            pageDisplayMode,
            readingFlowMode,
            className,
          )}
          aria-busy={stageIsBusy}
        >
          <div
            className={createDocumentClassName(
              pageDisplayMode,
              readingFlowMode,
            )}
          >
            {isPaginatedMode && (
              <>
                {isPageLoading &&
                  page === null && (
                    <div className="reader-page__rendering">
                      <LoadingIndicator
                        size={
                          LoadingIndicatorSize.LARGE
                        }
                        label="Carregando página..."
                        vertical
                      />
                    </div>
                  )}

                {!isPageLoading &&
                  hasPageLoadError && (
                    <div className="reader-page__feedback">
                      <FeedbackMessage
                        variant={
                          FeedbackMessageVariant.ERROR
                        }
                        title="Não foi possível carregar a página"
                        description={
                          normalizedPageLoadError
                        }
                        icon={<ErrorIcon />}
                      />
                    </div>
                  )}

                {!hasPageLoadError &&
                  page !== null && (
                    <ReaderPageCanvas
                      page={page}
                      scale={scale}
                      rotation={rotation}
                      renderError={
                        getPageRenderError(
                          page.pageNumber,
                        )
                      }
                      onRenderSuccess={
                        handleRenderSuccess
                      }
                      onRenderError={
                        handleRenderError
                      }
                    />
                  )}

                {isDoublePageMode &&
                  isSecondaryPageLoading &&
                  secondaryPage ===
                    null && (
                    <div className="reader-page__rendering reader-page__rendering--secondary">
                      <LoadingIndicator
                        size={
                          LoadingIndicatorSize.LARGE
                        }
                        label="Carregando próxima página..."
                        vertical
                      />
                    </div>
                  )}

                {isDoublePageMode &&
                  !isSecondaryPageLoading &&
                  hasSecondaryPageLoadError && (
                    <div className="reader-page__feedback">
                      <FeedbackMessage
                        variant={
                          FeedbackMessageVariant.ERROR
                        }
                        title="Não foi possível carregar a próxima página"
                        description={
                          normalizedSecondaryPageLoadError
                        }
                        icon={<ErrorIcon />}
                      />
                    </div>
                  )}

                {isDoublePageMode &&
                  !hasSecondaryPageLoadError &&
                  secondaryPage !==
                    null && (
                    <ReaderPageCanvas
                      page={secondaryPage}
                      scale={scale}
                      rotation={rotation}
                      renderError={
                        getPageRenderError(
                          secondaryPage
                            .pageNumber,
                        )
                      }
                      onRenderSuccess={
                        handleRenderSuccess
                      }
                      onRenderError={
                        handleRenderError
                      }
                    />
                  )}
              </>
            )}

            {isContinuousMode && (
              <>
                {continuousHasPreviousPages && (
                  <div
                    className="reader-page__continuous-sentinel reader-page__continuous-sentinel--previous"
                    data-continuous-load="previous"
                    aria-hidden="true"
                  />
                )}

                {isContinuousPagesLoading &&
                  !hasContinuousPages && (
                    <div className="reader-page__rendering">
                      <LoadingIndicator
                        size={
                          LoadingIndicatorSize.LARGE
                        }
                        label="Carregando páginas..."
                        vertical
                      />
                    </div>
                  )}

                {!isContinuousPagesLoading &&
                  !hasContinuousPages &&
                  hasContinuousPagesLoadError && (
                    <div className="reader-page__feedback">
                      <FeedbackMessage
                        variant={
                          FeedbackMessageVariant.ERROR
                        }
                        title="Não foi possível carregar as páginas"
                        description={
                          normalizedContinuousPagesLoadError
                        }
                        icon={<ErrorIcon />}
                      />
                    </div>
                  )}

                {continuousPages.map(
                  (continuousPage) => (
                    <ReaderPageCanvas
                      key={
                        continuousPage.pageNumber
                      }
                      page={continuousPage}
                      scale={scale}
                      rotation={rotation}
                      renderError={
                        getPageRenderError(
                          continuousPage
                            .pageNumber,
                        )
                      }
                      onRenderSuccess={
                        handleRenderSuccess
                      }
                      onRenderError={
                        handleRenderError
                      }
                    />
                  ),
                )}

                {hasContinuousPages &&
                  hasContinuousPagesLoadError && (
                    <div className="reader-page__feedback reader-page__continuous-feedback">
                      <FeedbackMessage
                        variant={
                          FeedbackMessageVariant.ERROR
                        }
                        title="Não foi possível carregar mais páginas"
                        description={
                          normalizedContinuousPagesLoadError
                        }
                        icon={<ErrorIcon />}
                      />
                    </div>
                  )}

                {isContinuousPagesLoading &&
                  hasContinuousPages && (
                    <div className="reader-page__continuous-loading">
                      <LoadingIndicator
                        size={
                          LoadingIndicatorSize.MEDIUM
                        }
                        label="Carregando mais páginas..."
                      />
                    </div>
                  )}

                {continuousHasNextPages && (
                  <div
                    className="reader-page__continuous-sentinel reader-page__continuous-sentinel--next"
                    data-continuous-load="next"
                    aria-hidden="true"
                  />
                )}
              </>
            )}
          </div>
        </div>
      )
    },
  )