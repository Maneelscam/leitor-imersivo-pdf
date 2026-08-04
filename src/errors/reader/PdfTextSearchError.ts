export const PdfTextSearchErrorCode = {
  INVALID_QUERY: 'INVALID_QUERY',
  DOCUMENT_HAS_NO_PAGES:
    'DOCUMENT_HAS_NO_PAGES',
  PAGE_LOAD_FAILED:
    'PAGE_LOAD_FAILED',
  TEXT_EXTRACTION_FAILED:
    'TEXT_EXTRACTION_FAILED',
} as const

export type PdfTextSearchErrorCode =
  (typeof PdfTextSearchErrorCode)[
    keyof typeof PdfTextSearchErrorCode
  ]

export interface PdfTextSearchErrorOptions {
  readonly code:
    PdfTextSearchErrorCode

  readonly pageNumber?:
    number

  readonly totalPages:
    number

  readonly cause?: unknown
}

function createPdfTextSearchErrorMessage(
  code: PdfTextSearchErrorCode,
  pageNumber: number | undefined,
): string {
  switch (code) {
    case PdfTextSearchErrorCode.INVALID_QUERY:
      return 'Informe um termo válido para pesquisar no documento.'

    case PdfTextSearchErrorCode.DOCUMENT_HAS_NO_PAGES:
      return 'O documento PDF não possui páginas disponíveis para pesquisa.'

    case PdfTextSearchErrorCode.PAGE_LOAD_FAILED:
      return pageNumber === undefined
        ? 'Não foi possível carregar uma página durante a pesquisa.'
        : `Não foi possível carregar a página ${pageNumber} durante a pesquisa.`

    case PdfTextSearchErrorCode.TEXT_EXTRACTION_FAILED:
      return pageNumber === undefined
        ? 'Não foi possível extrair o texto do documento PDF.'
        : `Não foi possível extrair o texto da página ${pageNumber} do PDF.`
  }
}

export class PdfTextSearchError extends Error {
  readonly code:
    PdfTextSearchErrorCode

  readonly pageNumber:
    number | null

  readonly totalPages:
    number

  constructor({
    code,
    pageNumber,
    totalPages,
    cause,
  }: PdfTextSearchErrorOptions) {
    super(
      createPdfTextSearchErrorMessage(
        code,
        pageNumber,
      ),
      {
        cause,
      },
    )

    this.name = 'PdfTextSearchError'
    this.code = code
    this.pageNumber =
      pageNumber ?? null
    this.totalPages = totalPages
  }
}