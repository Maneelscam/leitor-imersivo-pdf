export interface PdfTextSearchHighlightArea {
  readonly left: number
  readonly bottom: number
  readonly right: number
  readonly top: number
}

export interface PdfTextSearchOccurrence {
  readonly pageNumber: number

  readonly occurrenceIndexOnPage:
    number

  readonly pageOffsetRatio: number

  readonly matchedText: string
  readonly preview: string

  readonly highlightAreas:
    readonly PdfTextSearchHighlightArea[]
}

export interface PdfTextSearchPageResult {
  readonly pageNumber: number

  readonly occurrenceCount: number

  readonly occurrences:
    readonly PdfTextSearchOccurrence[]
}

export interface PdfTextSearchResult {
  readonly query: string

  readonly totalPagesSearched:
    number

  readonly totalOccurrences:
    number

  readonly pagesWithOccurrences:
    number

  readonly pageResults:
    readonly PdfTextSearchPageResult[]
}