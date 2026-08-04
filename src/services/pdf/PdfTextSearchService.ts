import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'

import {
  PdfTextSearchError,
  PdfTextSearchErrorCode,
} from '@/errors/reader/PdfTextSearchError'
import type {
  PdfTextSearchHighlightArea,
  PdfTextSearchOccurrence,
  PdfTextSearchPageResult,
  PdfTextSearchResult,
} from '@/models/dtos/PdfTextSearchResult'

const PREVIEW_CONTEXT_LENGTH = 56

const COMBINING_MARKS_PATTERN =
  /\p{M}/gu

interface SearchableTextItem {
  readonly text: string

  readonly x: number
  readonly y: number

  readonly width: number
  readonly height: number

  readonly hasEndOfLine: boolean
}

interface PageTextSegment {
  readonly startIndex: number
  readonly endIndex: number

  readonly pageOffsetRatio: number

  readonly x: number
  readonly y: number

  readonly width: number
  readonly height: number
}

interface NormalizedText {
  readonly value: string

  readonly sourceIndexByNormalizedIndex:
    readonly number[]
}

interface ExtractedPageText {
  readonly sourceText: string

  readonly normalizedText:
    NormalizedText

  readonly segments:
    readonly PageTextSegment[]
}

export interface PdfTextSearchProgress {
  readonly completedPages: number
  readonly totalPages: number
}

export interface PdfTextSearchOptions {
  readonly onProgress?: (
    progress: PdfTextSearchProgress,
  ) => void
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isSearchableTextItem(
  value: unknown,
): value is {
  readonly str: string
  readonly transform: readonly number[]
  readonly width: number
  readonly height: number
  readonly hasEOL: boolean
} {
  if (!isRecord(value)) {
    return false
  }

  if (
    typeof value.str !== 'string' ||
    !Array.isArray(value.transform) ||
    value.transform.length < 6 ||
    typeof value.width !== 'number' ||
    !Number.isFinite(value.width) ||
    typeof value.height !== 'number' ||
    !Number.isFinite(value.height) ||
    typeof value.hasEOL !== 'boolean'
  ) {
    return false
  }

  const x = value.transform[4]
  const y = value.transform[5]

  return (
    typeof x === 'number' &&
    Number.isFinite(x) &&
    typeof y === 'number' &&
    Number.isFinite(y)
  )
}

function createSearchableTextItem(
  value: unknown,
): SearchableTextItem | null {
  if (
    !isSearchableTextItem(value) ||
    value.str.length === 0
  ) {
    return null
  }

  return {
    text: value.str,

    x: value.transform[4] ?? 0,
    y: value.transform[5] ?? 0,

    width: Math.max(
      0,
      value.width,
    ),

    height: Math.max(
      0,
      value.height,
    ),

    hasEndOfLine:
      value.hasEOL,
  }
}

function startsWithWhitespace(
  value: string,
): boolean {
  return /^\s/u.test(value)
}

function endsWithWhitespace(
  value: string,
): boolean {
  return /\s$/u.test(value)
}

function resolveItemSeparator(
  previousItem:
    SearchableTextItem | null,

  currentItem:
    SearchableTextItem,
): string {
  if (previousItem === null) {
    return ''
  }

  if (
    previousItem.hasEndOfLine
  ) {
    return '\n'
  }

  if (
    endsWithWhitespace(
      previousItem.text,
    ) ||
    startsWithWhitespace(
      currentItem.text,
    )
  ) {
    return ''
  }

  const referenceHeight =
    Math.max(
      previousItem.height,
      currentItem.height,
      1,
    )

  const lineTolerance =
    referenceHeight * 0.35

  const isSameLine =
    Math.abs(
      previousItem.y -
        currentItem.y,
    ) <= lineTolerance

  if (!isSameLine) {
    return '\n'
  }

  const expectedNextX =
    previousItem.x +
    previousItem.width

  const horizontalGap =
    currentItem.x -
    expectedNextX

  const spacingThreshold =
    Math.max(
      1,
      referenceHeight * 0.2,
    )

  return horizontalGap <=
    spacingThreshold
    ? ''
    : ' '
}

function normalizePageOffsetRatio(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  )
}

function createPageOffsetRatio(
  item: SearchableTextItem,
  viewportHeight: number,
): number {
  if (
    !Number.isFinite(
      viewportHeight,
    ) ||
    viewportHeight <= 0
  ) {
    return 0
  }

  return normalizePageOffsetRatio(
    1 -
      item.y /
        viewportHeight,
  )
}

function normalizeCharacter(
  value: string,
): string {
  return value
    .normalize('NFKD')
    .replace(
      COMBINING_MARKS_PATTERN,
      '',
    )
    .toLocaleLowerCase('pt-BR')
}

function createNormalizedText(
  sourceText: string,
): NormalizedText {
  let normalizedValue = ''

  const sourceIndexByNormalizedIndex:
    number[] = []

  let previousCharacterWasWhitespace =
    true

  for (
    let sourceIndex = 0;
    sourceIndex <
    sourceText.length;
    sourceIndex += 1
  ) {
    const sourceCharacter =
      sourceText.charAt(
        sourceIndex,
      )

    if (
      /\s/u.test(
        sourceCharacter,
      )
    ) {
      if (
        normalizedValue.length >
          0 &&
        !previousCharacterWasWhitespace
      ) {
        normalizedValue += ' '

        sourceIndexByNormalizedIndex.push(
          sourceIndex,
        )

        previousCharacterWasWhitespace =
          true
      }

      continue
    }

    const normalizedCharacter =
      normalizeCharacter(
        sourceCharacter,
      )

    for (
      let normalizedIndex = 0;
      normalizedIndex <
      normalizedCharacter.length;
      normalizedIndex += 1
    ) {
      const character =
        normalizedCharacter.charAt(
          normalizedIndex,
        )

      if (
        character.length === 0
      ) {
        continue
      }

      normalizedValue +=
        character

      sourceIndexByNormalizedIndex.push(
        sourceIndex,
      )

      previousCharacterWasWhitespace =
        false
    }
  }

  return {
    value:
      normalizedValue.trimEnd(),

    sourceIndexByNormalizedIndex,
  }
}

function createNormalizedQuery(
  query: string,
  totalPages: number,
): string {
  const normalizedQuery =
    createNormalizedText(
      query.trim(),
    ).value.trim()

  if (
    normalizedQuery.length === 0
  ) {
    throw new PdfTextSearchError({
      code:
        PdfTextSearchErrorCode.INVALID_QUERY,

      totalPages,
    })
  }

  return normalizedQuery
}

function createPreview(
  sourceText: string,
  matchStartIndex: number,
  matchEndIndex: number,
): string {
  const previewStartIndex =
    Math.max(
      0,
      matchStartIndex -
        PREVIEW_CONTEXT_LENGTH,
    )

  const previewEndIndex =
    Math.min(
      sourceText.length,
      matchEndIndex +
        PREVIEW_CONTEXT_LENGTH,
    )

  const previewText =
    sourceText
      .slice(
        previewStartIndex,
        previewEndIndex,
      )
      .replace(
        /\s+/gu,
        ' ',
      )
      .trim()

  const prefix =
    previewStartIndex > 0
      ? '…'
      : ''

  const suffix =
    previewEndIndex <
    sourceText.length
      ? '…'
      : ''

  return [
    prefix,
    previewText,
    suffix,
  ].join('')
}

function findPageOffsetRatio(
  segments:
    readonly PageTextSegment[],

  sourceIndex: number,
): number {
  for (
    const segment of segments
  ) {
    if (
      sourceIndex >=
        segment.startIndex &&
      sourceIndex <
        segment.endIndex
    ) {
      return segment.pageOffsetRatio
    }
  }

  let nearestSegment:
    PageTextSegment | null = null

  let nearestDistance =
    Number.POSITIVE_INFINITY

  for (
    const segment of segments
  ) {
    const distance =
      sourceIndex <
      segment.startIndex
        ? segment.startIndex -
          sourceIndex
        : sourceIndex -
          segment.endIndex

    if (
      distance <
      nearestDistance
    ) {
      nearestDistance =
        distance

      nearestSegment =
        segment
    }
  }

  return (
    nearestSegment
      ?.pageOffsetRatio ??
    0
  )
}

function createHighlightArea(
  segment: PageTextSegment,
  overlapStartIndex: number,
  overlapEndIndex: number,
): PdfTextSearchHighlightArea | null {
  const segmentLength =
    segment.endIndex -
    segment.startIndex

  if (
    segmentLength <= 0 ||
    overlapEndIndex <=
      overlapStartIndex
  ) {
    return null
  }

  const relativeStart =
    Math.min(
      1,
      Math.max(
        0,
        (
          overlapStartIndex -
          segment.startIndex
        ) /
          segmentLength,
      ),
    )

  const relativeEnd =
    Math.min(
      1,
      Math.max(
        relativeStart,
        (
          overlapEndIndex -
          segment.startIndex
        ) /
          segmentLength,
      ),
    )

  const effectiveWidth =
    Math.max(
      segment.width,
      segment.height * 0.35,
      1,
    )

  const effectiveHeight =
    Math.max(
      segment.height,
      1,
    )

  const firstX =
    segment.x +
    effectiveWidth *
      relativeStart

  const secondX =
    segment.x +
    effectiveWidth *
      relativeEnd

  const firstY =
    segment.y

  const secondY =
    segment.y +
    effectiveHeight

  return {
    left:
      Math.min(
        firstX,
        secondX,
      ),

    bottom:
      Math.min(
        firstY,
        secondY,
      ),

    right:
      Math.max(
        firstX,
        secondX,
      ),

    top:
      Math.max(
        firstY,
        secondY,
      ),
  }
}

function createHighlightAreas(
  segments:
    readonly PageTextSegment[],

  matchStartIndex: number,
  matchEndIndex: number,
): readonly PdfTextSearchHighlightArea[] {
  const highlightAreas:
    PdfTextSearchHighlightArea[] = []

  for (
    const segment of segments
  ) {
    const overlapStartIndex =
      Math.max(
        matchStartIndex,
        segment.startIndex,
      )

    const overlapEndIndex =
      Math.min(
        matchEndIndex,
        segment.endIndex,
      )

    if (
      overlapEndIndex <=
      overlapStartIndex
    ) {
      continue
    }

    const highlightArea =
      createHighlightArea(
        segment,
        overlapStartIndex,
        overlapEndIndex,
      )

    if (
      highlightArea !== null
    ) {
      highlightAreas.push(
        highlightArea,
      )
    }
  }

  return highlightAreas
}

function createPageOccurrences(
  pageNumber: number,
  extractedPage:
    ExtractedPageText,
  normalizedQuery: string,
): readonly PdfTextSearchOccurrence[] {
  const occurrences:
    PdfTextSearchOccurrence[] = []

  const normalizedPageText =
    extractedPage
      .normalizedText.value

  const sourceIndexMap =
    extractedPage
      .normalizedText
      .sourceIndexByNormalizedIndex

  let searchStartIndex = 0

  while (
    searchStartIndex <
    normalizedPageText.length
  ) {
    const normalizedMatchStart =
      normalizedPageText.indexOf(
        normalizedQuery,
        searchStartIndex,
      )

    if (
      normalizedMatchStart < 0
    ) {
      break
    }

    const normalizedMatchEnd =
      normalizedMatchStart +
      normalizedQuery.length

    const sourceMatchStart =
      sourceIndexMap[
        normalizedMatchStart
      ]

    const sourceMatchLastIndex =
      sourceIndexMap[
        normalizedMatchEnd - 1
      ]

    if (
      sourceMatchStart !==
        undefined &&
      sourceMatchLastIndex !==
        undefined
    ) {
      const sourceMatchEnd =
        sourceMatchLastIndex + 1

      const matchedText =
        extractedPage.sourceText
          .slice(
            sourceMatchStart,
            sourceMatchEnd,
          )
          .replace(
            /\s+/gu,
            ' ',
          )
          .trim()

      occurrences.push({
        pageNumber,

        occurrenceIndexOnPage:
          occurrences.length + 1,

        pageOffsetRatio:
          findPageOffsetRatio(
            extractedPage.segments,
            sourceMatchStart,
          ),

        matchedText,

        preview:
          createPreview(
            extractedPage.sourceText,
            sourceMatchStart,
            sourceMatchEnd,
          ),

        highlightAreas:
          createHighlightAreas(
            extractedPage.segments,
            sourceMatchStart,
            sourceMatchEnd,
          ),
      })
    }

    searchStartIndex =
      normalizedMatchEnd
  }

  return occurrences
}

async function extractPageText(
  page: PDFPageProxy,
  totalPages: number,
): Promise<ExtractedPageText> {
  let textContent:
    Awaited<
      ReturnType<
        PDFPageProxy['getTextContent']
      >
    >

  try {
    textContent =
      await page.getTextContent()
  } catch (error) {
    throw new PdfTextSearchError({
      code:
        PdfTextSearchErrorCode
          .TEXT_EXTRACTION_FAILED,

      pageNumber:
        page.pageNumber,

      totalPages,

      cause: error,
    })
  }

  const viewport =
    page.getViewport({
      scale: 1,
    })

  let sourceText = ''

  const segments:
    PageTextSegment[] = []

  let previousItem:
    SearchableTextItem | null =
    null

  for (
    const contentItem of
    textContent.items
  ) {
    const currentItem =
      createSearchableTextItem(
        contentItem,
      )

    if (
      currentItem === null
    ) {
      continue
    }

    const separator =
      resolveItemSeparator(
        previousItem,
        currentItem,
      )

    sourceText += separator

    const startIndex =
      sourceText.length

    sourceText +=
      currentItem.text

    const endIndex =
      sourceText.length

    segments.push({
      startIndex,
      endIndex,

      pageOffsetRatio:
        createPageOffsetRatio(
          currentItem,
          viewport.height,
        ),

      x: currentItem.x,
      y: currentItem.y,

      width:
        currentItem.width,

      height:
        currentItem.height,
    })

    previousItem =
      currentItem
  }

  return {
    sourceText,

    normalizedText:
      createNormalizedText(
        sourceText,
      ),

    segments,
  }
}

export class PdfTextSearchService {
  private readonly pageTextCache =
    new WeakMap<
      PDFDocumentProxy,
      Map<
        number,
        Promise<ExtractedPageText>
      >
    >()

  private getCachedPageText(
    document: PDFDocumentProxy,
    pageNumber: number,
  ): Promise<ExtractedPageText> {
    let documentCache =
      this.pageTextCache.get(
        document,
      )

    if (
      documentCache === undefined
    ) {
      documentCache =
        new Map()

      this.pageTextCache.set(
        document,
        documentCache,
      )
    }

    const cachedPageText =
      documentCache.get(
        pageNumber,
      )

    if (
      cachedPageText !== undefined
    ) {
      return cachedPageText
    }

    const extractedPageText =
      this.loadAndExtractPageText(
        document,
        pageNumber,
      ).catch((error: unknown) => {
        documentCache?.delete(
          pageNumber,
        )

        throw error
      })

    documentCache.set(
      pageNumber,
      extractedPageText,
    )

    return extractedPageText
  }

  private async loadAndExtractPageText(
    document: PDFDocumentProxy,
    pageNumber: number,
  ): Promise<ExtractedPageText> {
    let page: PDFPageProxy

    try {
      page =
        await document.getPage(
          pageNumber,
        )
    } catch (error) {
      throw new PdfTextSearchError({
        code:
          PdfTextSearchErrorCode
            .PAGE_LOAD_FAILED,

        pageNumber,
        totalPages:
          document.numPages,

        cause: error,
      })
    }

    try {
      return await extractPageText(
        page,
        document.numPages,
      )
    } catch (error) {
      if (
        error instanceof
        PdfTextSearchError
      ) {
        throw new PdfTextSearchError({
          code: error.code,

          pageNumber:
            error.pageNumber ??
            pageNumber,

          totalPages:
            document.numPages,

          cause:
            error.cause ??
            error,
        })
      }

      throw error
    }
  }

  async search(
    document: PDFDocumentProxy,
    query: string,
    options:
      PdfTextSearchOptions = {},
  ): Promise<PdfTextSearchResult> {
    const totalPages =
      Math.max(
        0,
        Math.trunc(
          document.numPages,
        ),
      )

    if (
      totalPages === 0
    ) {
      throw new PdfTextSearchError({
        code:
          PdfTextSearchErrorCode
            .DOCUMENT_HAS_NO_PAGES,

        totalPages,
      })
    }

    const normalizedQuery =
      createNormalizedQuery(
        query,
        totalPages,
      )

    const pageResults:
      PdfTextSearchPageResult[] = []

    let totalOccurrences = 0

    for (
      let pageNumber = 1;
      pageNumber <= totalPages;
      pageNumber += 1
    ) {
      const extractedPage =
        await this.getCachedPageText(
          document,
          pageNumber,
        )

      const occurrences =
        createPageOccurrences(
          pageNumber,
          extractedPage,
          normalizedQuery,
        )

      if (
        occurrences.length > 0
      ) {
        pageResults.push({
          pageNumber,

          occurrenceCount:
            occurrences.length,

          occurrences,
        })

        totalOccurrences +=
          occurrences.length
      }

      options.onProgress?.({
        completedPages:
          pageNumber,

        totalPages,
      })
    }

    return {
      query:
        query.trim(),

      totalPagesSearched:
        totalPages,

      totalOccurrences,

      pagesWithOccurrences:
        pageResults.length,

      pageResults,
    }
  }
}
