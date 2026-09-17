import type {
  PDFDocumentProxy,
  PDFPageProxy,
} from 'pdfjs-dist'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  applicationContainer,
} from '@/app/providers/applicationContainer'
import type {
  LoadPdfPageBatchResult,
} from '@/controllers/reader/LoadPdfPageBatchController'
import type {
  OpenBookResult,
} from '@/models/dtos/OpenBookResult'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  LoadedPdfDocument,
} from '@/services/pdf/PdfDocumentService'
import {
  useAppStore,
} from '@/stores/useAppStore'

const BOOK_ID =
  'reader-continuous-memory-book' as BookId

const TEST_DATE =
  '2026-08-28T12:00:00.000Z' as IsoDateTime

const TOTAL_PAGES = 20

function createPdfPage(
  pageNumber: number,
): PDFPageProxy {
  return {
    pageNumber,
  } as unknown as PDFPageProxy
}

function createPdfPages(
  startPage: number,
  endPage: number,
): readonly PDFPageProxy[] {
  const pages: PDFPageProxy[] = []

  for (
    let pageNumber = startPage;
    pageNumber <= endPage;
    pageNumber += 1
  ) {
    pages.push(
      createPdfPage(
        pageNumber,
      ),
    )
  }

  return pages
}

function createBatchResult(
  startPage: number,
  endPage: number,
): LoadPdfPageBatchResult {
  const pages =
    createPdfPages(
      startPage,
      endPage,
    )

  return {
    pages,
    startPage,
    endPage,

    hasPreviousPages:
      startPage > 1,

    hasNextPages:
      endPage < TOTAL_PAGES,
  }
}

function createOpenedBook():
  OpenBookResult {
  return {
    book: {
      id:
        BOOK_ID,

      title:
        'Livro para teste de memória',

      author:
        null,

      originalFileName:
        'memoria.pdf',

      fileSizeBytes:
        1024,

      mimeType:
        'application/pdf',

      totalPages:
        TOTAL_PAGES,

      pdfFingerprint:
        null,

      importedAt:
        TEST_DATE,

      updatedAt:
        TEST_DATE,

      lastOpenedAt:
        TEST_DATE,
    },

    bookFile: {
      bookId:
        BOOK_ID,

      file:
        new Blob(
          ['%PDF'],
          {
            type:
              'application/pdf',
          },
        ),

      storedAt:
        TEST_DATE,
    },

    readingProgress:
      null,
  }
}

function createLoadedPdfDocument():
  LoadedPdfDocument {
  const document = {
    numPages:
      TOTAL_PAGES,
  } as unknown as PDFDocumentProxy

  return {
    document,

    isClosed:
      false,

    close:
      vi.fn(
        async () => undefined,
      ),
  }
}

function resetState(): void {
  useAppStore.setState({
    openedBook:
      null,

    loadedPdfDocument:
      null,

    currentPage:
      1,

    loadedContinuousPdfPages:
      [],

    continuousPagesStartPage:
      null,

    continuousPagesEndPage:
      null,

    continuousHasPreviousPages:
      false,

    continuousHasNextPages:
      false,

    continuousPagesLoadStatus:
      AsyncStatus.IDLE,

    continuousPagesLoadErrorMessage:
      null,
  })
}

describe(
  'createReaderSlice continuous pages memory window',
  () => {
    beforeEach(() => {
      resetState()
    })

    afterEach(() => {
      vi.restoreAllMocks()
      resetState()
    })

    it(
      'mantém no máximo 12 páginas e descarta as mais antigas ao avançar',
      async () => {
        const openedBook =
          createOpenedBook()

        const loadedPdfDocument =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument,

          loadedContinuousPdfPages:
            createPdfPages(
              5,
              16,
            ),

          continuousPagesStartPage:
            5,

          continuousPagesEndPage:
            16,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            true,

          continuousPagesLoadStatus:
            AsyncStatus.SUCCESS,
        })

        const loadBatchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPageBatch,
            'execute',
          )
            .mockResolvedValue(
              createBatchResult(
                17,
                20,
              ),
            )

        await useAppStore
          .getState()
          .loadNextContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            loadedPdfDocument
              .document,

          startPage:
            17,

          batchSize:
            4,

          totalPages:
            TOTAL_PAGES,
        })

        const state =
          useAppStore.getState()

        expect(
          state
            .loadedContinuousPdfPages
            .map(
              (page) =>
                page.pageNumber,
            ),
        ).toEqual([
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
        ])

        expect(
          state.loadedContinuousPdfPages,
        ).toHaveLength(
          12,
        )

        expect(
          state.continuousPagesStartPage,
        ).toBe(
          9,
        )

        expect(
          state.continuousPagesEndPage,
        ).toBe(
          20,
        )

        expect(
          state.continuousHasPreviousPages,
        ).toBe(
          true,
        )

        expect(
          state.continuousHasNextPages,
        ).toBe(
          false,
        )

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'mantém no máximo 12 páginas e descarta as mais distantes ao voltar',
      async () => {
        const openedBook =
          createOpenedBook()

        const loadedPdfDocument =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument,

          loadedContinuousPdfPages:
            createPdfPages(
              5,
              16,
            ),

          continuousPagesStartPage:
            5,

          continuousPagesEndPage:
            16,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            true,

          continuousPagesLoadStatus:
            AsyncStatus.SUCCESS,
        })

        const loadBatchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPageBatch,
            'execute',
          )
            .mockResolvedValue(
              createBatchResult(
                1,
                4,
              ),
            )

        await useAppStore
          .getState()
          .loadPreviousContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            loadedPdfDocument
              .document,

          startPage:
            1,

          batchSize:
            4,

          totalPages:
            TOTAL_PAGES,
        })

        const state =
          useAppStore.getState()

        expect(
          state
            .loadedContinuousPdfPages
            .map(
              (page) =>
                page.pageNumber,
            ),
        ).toEqual([
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
        ])

        expect(
          state.loadedContinuousPdfPages,
        ).toHaveLength(
          12,
        )

        expect(
          state.continuousPagesStartPage,
        ).toBe(
          1,
        )

        expect(
          state.continuousPagesEndPage,
        ).toBe(
          12,
        )

        expect(
          state.continuousHasPreviousPages,
        ).toBe(
          false,
        )

        expect(
          state.continuousHasNextPages,
        ).toBe(
          true,
        )

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )
  },
)
