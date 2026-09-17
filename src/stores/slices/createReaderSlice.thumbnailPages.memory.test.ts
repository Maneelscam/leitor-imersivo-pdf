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
  'reader-thumbnail-memory-book' as BookId

const TEST_DATE =
  '2026-09-17T12:00:00.000Z' as IsoDateTime

const TOTAL_PAGES = 80

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
  return {
    pages:
      createPdfPages(
        startPage,
        endPage,
      ),

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
        'Livro para teste de miniaturas',

      author:
        null,

      originalFileName:
        'miniaturas.pdf',

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
  return {
    document: {
      numPages:
        TOTAL_PAGES,
    } as unknown as PDFDocumentProxy,

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

    loadedThumbnailPdfPages:
      [],

    thumbnailPagesStartPage:
      null,

    thumbnailPagesEndPage:
      null,

    thumbnailHasPreviousPages:
      false,

    thumbnailHasNextPages:
      false,

    thumbnailPagesLoadStatus:
      AsyncStatus.IDLE,

    thumbnailPagesLoadErrorMessage:
      null,
  })
}

describe(
  'createReaderSlice thumbnail pages memory window',
  () => {
    beforeEach(() => {
      resetState()
    })

    afterEach(() => {
      vi.restoreAllMocks()
      resetState()
    })

    it(
      'mantém no máximo 32 miniaturas e descarta as mais antigas ao avançar',
      async () => {
        const openedBook =
          createOpenedBook()

        const loadedPdfDocument =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument,

          loadedThumbnailPdfPages:
            createPdfPages(
              9,
              40,
            ),

          thumbnailPagesStartPage:
            9,

          thumbnailPagesEndPage:
            40,

          thumbnailHasPreviousPages:
            true,

          thumbnailHasNextPages:
            true,

          thumbnailPagesLoadStatus:
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
                41,
                48,
              ),
            )

        await useAppStore
          .getState()
          .loadNextThumbnailPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            loadedPdfDocument
              .document,

          startPage:
            41,

          batchSize:
            8,

          totalPages:
            TOTAL_PAGES,
        })

        const state =
          useAppStore.getState()

        expect(
          state
            .loadedThumbnailPdfPages
            .map(
              (page) =>
                page.pageNumber,
            ),
        ).toEqual(
          Array.from(
            {
              length:
                32,
            },
            (
              _,
              index,
            ) =>
              index + 17,
          ),
        )

        expect(
          state.loadedThumbnailPdfPages,
        ).toHaveLength(
          32,
        )

        expect(
          state.thumbnailPagesStartPage,
        ).toBe(
          17,
        )

        expect(
          state.thumbnailPagesEndPage,
        ).toBe(
          48,
        )
      },
    )

    it(
      'mantém no máximo 32 miniaturas e descarta as mais distantes ao voltar',
      async () => {
        const openedBook =
          createOpenedBook()

        const loadedPdfDocument =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument,

          loadedThumbnailPdfPages:
            createPdfPages(
              9,
              40,
            ),

          thumbnailPagesStartPage:
            9,

          thumbnailPagesEndPage:
            40,

          thumbnailHasPreviousPages:
            true,

          thumbnailHasNextPages:
            true,

          thumbnailPagesLoadStatus:
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
                8,
              ),
            )

        await useAppStore
          .getState()
          .loadPreviousThumbnailPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            loadedPdfDocument
              .document,

          startPage:
            1,

          batchSize:
            8,

          totalPages:
            TOTAL_PAGES,
        })

        const state =
          useAppStore.getState()

        expect(
          state
            .loadedThumbnailPdfPages
            .map(
              (page) =>
                page.pageNumber,
            ),
        ).toEqual(
          Array.from(
            {
              length:
                32,
            },
            (
              _,
              index,
            ) =>
              index + 1,
          ),
        )

        expect(
          state.loadedThumbnailPdfPages,
        ).toHaveLength(
          32,
        )

        expect(
          state.thumbnailPagesStartPage,
        ).toBe(
          1,
        )

        expect(
          state.thumbnailPagesEndPage,
        ).toBe(
          32,
        )
      },
    )
  },
)
