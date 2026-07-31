export const PdfPageLoadErrorCode = {
  INVALID_PAGE_NUMBER: 'INVALID_PAGE_NUMBER',
  PAGE_OUT_OF_RANGE: 'PAGE_OUT_OF_RANGE',
  PAGE_LOAD_FAILED: 'PAGE_LOAD_FAILED',
} as const

export type PdfPageLoadErrorCode =
  (typeof PdfPageLoadErrorCode)[
    keyof typeof PdfPageLoadErrorCode
  ]

export interface PdfPageLoadErrorOptions {
  readonly code: PdfPageLoadErrorCode
  readonly pageNumber: number
  readonly totalPages: number
  readonly cause?: unknown
}

function createPdfPageLoadErrorMessage(
  code: PdfPageLoadErrorCode,
  pageNumber: number,
  totalPages: number,
): string {
  switch (code) {
    case PdfPageLoadErrorCode.INVALID_PAGE_NUMBER:
      return 'O número informado para a página do PDF é inválido.'

    case PdfPageLoadErrorCode.PAGE_OUT_OF_RANGE:
      return totalPages > 0
        ? `A página ${pageNumber} não existe. O documento possui ${totalPages} páginas.`
        : 'O documento PDF não possui páginas disponíveis.'

    case PdfPageLoadErrorCode.PAGE_LOAD_FAILED:
      return `Não foi possível carregar a página ${pageNumber} do PDF.`
  }
}

export class PdfPageLoadError extends Error {
  readonly code: PdfPageLoadErrorCode
  readonly pageNumber: number
  readonly totalPages: number

  constructor({
    code,
    pageNumber,
    totalPages,
    cause,
  }: PdfPageLoadErrorOptions) {
    super(
      createPdfPageLoadErrorMessage(
        code,
        pageNumber,
        totalPages,
      ),
      {
        cause,
      },
    )

    this.name = 'PdfPageLoadError'
    this.code = code
    this.pageNumber = pageNumber
    this.totalPages = totalPages
  }
}