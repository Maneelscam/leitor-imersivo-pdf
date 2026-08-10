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
  'reader-continuous-pages-book' as BookId

const TEST_DATE =
  '2026-08-10T10:00:00.000Z' as IsoDateTime

const TOTAL_PAGES = 12

interface TestLoadedPdfDocument {
  readonly loadedPdfDocument:
    LoadedPdfDocument

  closeDocument(): void
}

function createPdfPage(
  pageNumber: number,
): PDFPageProxy {
  return {
    pageNumber,
  } as unknown as PDFPageProxy
}

function createBatchResult(
  pageNumbers: readonly number[],
  totalPages = TOTAL_PAGES,
): LoadPdfPageBatchResult {
  const pages =
    pageNumbers.map(
      createPdfPage,
    )

  const firstPage =
    pages[0] ?? null

  const lastPage =
    pages[
      pages.length - 1
    ] ?? null

  return {
    pages,

    startPage:
      firstPage?.pageNumber ?? 0,

    endPage:
      lastPage?.pageNumber ?? 0,

    hasPreviousPages:
      firstPage !== null &&
      firstPage.pageNumber > 1,

    hasNextPages:
      lastPage !== null &&
      lastPage.pageNumber <
        totalPages,
  }
}

function createOpenedBook(
  totalPages = TOTAL_PAGES,
): OpenBookResult {
  return {
    book: {
      id:
        BOOK_ID,

      title:
        'Livro de rolagem contínua',

      author:
        null,

      originalFileName:
        'livro-continuo.pdf',

      fileSizeBytes:
        1024,

      mimeType:
        'application/pdf',

      totalPages,

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

function createLoadedPdfDocument(
  numPages = TOTAL_PAGES,
): TestLoadedPdfDocument {
  let isClosed = false

  const document = {
    numPages,
  } as unknown as PDFDocumentProxy

  const loadedPdfDocument:
    LoadedPdfDocument = {
      document,

      get isClosed() {
        return isClosed
      },

      close:
        vi.fn(
          async () => {
            isClosed = true
          },
        ),
    }

  return {
    loadedPdfDocument,

    closeDocument: () => {
      isClosed = true
    },
  }
}

function resetContinuousPagesState(): void {
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
  'createReaderSlice continuous PDF pages',
  () => {
    beforeEach(
      () => {
        resetContinuousPagesState()
      },
    )

    afterEach(
      () => {
        vi.restoreAllMocks()

        resetContinuousPagesState()
      },
    )

    it(
      'retorna erro ao iniciar rolagem contínua sem PDF aberto',
      async () => {
        const loadBatchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPageBatch,
            'execute',
          )

        await useAppStore
          .getState()
          .loadInitialContinuousPdfPages()

        const state =
          useAppStore.getState()

        expect(
          loadBatchSpy,
        ).not.toHaveBeenCalled()

        expect(
          state.loadedContinuousPdfPages,
        ).toEqual(
          [],
        )

        expect(
          state.continuousPagesStartPage,
        ).toBeNull()

        expect(
          state.continuousPagesEndPage,
        ).toBeNull()

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.continuousPagesLoadErrorMessage,
        ).not.toBeNull()
      },
    )

    it(
      'carrega o primeiro lote contínuo a partir da página atual',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        const result =
          createBatchResult(
            [
              5,
              6,
              7,
              8,
            ],
          )

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            5,
        })

        const loadBatchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPageBatch,
            'execute',
          )
            .mockResolvedValue(
              result,
            )

        await useAppStore
          .getState()
          .loadInitialContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            document
              .loadedPdfDocument
              .document,

          startPage:
            5,

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
          5,
          6,
          7,
          8,
        ])

        expect(
          state.continuousPagesStartPage,
        ).toBe(
          5,
        )

        expect(
          state.continuousPagesEndPage,
        ).toBe(
          8,
        )

        expect(
          state.continuousHasPreviousPages,
        ).toBe(
          true,
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

        expect(
          state.continuousPagesLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'registra erro quando o lote inicial falha',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            4,
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPageBatch,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha simulada no lote inicial.',
            ),
          )

        await useAppStore
          .getState()
          .loadInitialContinuousPdfPages()

        const state =
          useAppStore.getState()

        expect(
          state.loadedContinuousPdfPages,
        ).toEqual(
          [],
        )

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.continuousPagesLoadErrorMessage,
        ).not.toBeNull()
      },
    )

    it(
      'ignora resultado inicial quando o PDF é fechado durante o carregamento',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        let resolveLoad:
          (
            result:
              LoadPdfPageBatchResult,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            LoadPdfPageBatchResult
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPageBatch,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            5,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadInitialContinuousPdfPages()

        document.closeDocument()

        useAppStore.setState({
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

        resolveLoad(
          createBatchResult(
            [
              5,
              6,
              7,
              8,
            ],
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedContinuousPdfPages,
        ).toEqual(
          [],
        )

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.continuousPagesLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora erro inicial quando o PDF é fechado durante o carregamento',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        let rejectLoad:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            LoadPdfPageBatchResult
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectLoad =
                reject
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPageBatch,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            5,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadInitialContinuousPdfPages()

        document.closeDocument()

        useAppStore.setState({
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

        rejectLoad(
          new Error(
            'Erro inicial depois do fechamento.',
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedContinuousPdfPages,
        ).toEqual(
          [],
        )

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.continuousPagesLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'carrega o lote inicial ao pedir páginas anteriores sem estado contínuo',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            6,
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
                [
                  6,
                  7,
                  8,
                  9,
                ],
              ),
            )

        await useAppStore
          .getState()
          .loadPreviousContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            document
              .loadedPdfDocument
              .document,

          startPage:
            6,

          batchSize:
            4,

          totalPages:
            TOTAL_PAGES,
        })

        expect(
          useAppStore
            .getState()
            .loadedContinuousPdfPages
            .map(
              (page) =>
                page.pageNumber,
            ),
        ).toEqual([
          6,
          7,
          8,
          9,
        ])
      },
    )

    it(
      'não carrega páginas anteriores quando já está no início',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedContinuousPdfPages: [
            createPdfPage(
              1,
            ),
            createPdfPage(
              2,
            ),
            createPdfPage(
              3,
            ),
            createPdfPage(
              4,
            ),
          ],

          continuousPagesStartPage:
            1,

          continuousPagesEndPage:
            4,

          continuousHasPreviousPages:
            false,

          continuousHasNextPages:
            true,
        })

        const loadBatchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPageBatch,
            'execute',
          )

        await useAppStore
          .getState()
          .loadPreviousContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).not.toHaveBeenCalled()

        expect(
          useAppStore
            .getState()
            .continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'carrega páginas anteriores e mescla em ordem',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedContinuousPdfPages: [
            createPdfPage(
              5,
            ),
            createPdfPage(
              6,
            ),
            createPdfPage(
              7,
            ),
            createPdfPage(
              8,
            ),
          ],

          continuousPagesStartPage:
            5,

          continuousPagesEndPage:
            8,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            true,
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
                [
                  1,
                  2,
                  3,
                  4,
                ],
              ),
            )

        await useAppStore
          .getState()
          .loadPreviousContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            document
              .loadedPdfDocument
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
        ])

        expect(
          state.continuousPagesStartPage,
        ).toBe(
          1,
        )

        expect(
          state.continuousPagesEndPage,
        ).toBe(
          8,
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

    it(
      'ignora erro de páginas anteriores quando o PDF é fechado',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedContinuousPdfPages: [
            createPdfPage(
              5,
            ),
            createPdfPage(
              6,
            ),
            createPdfPage(
              7,
            ),
            createPdfPage(
              8,
            ),
          ],

          continuousPagesStartPage:
            5,

          continuousPagesEndPage:
            8,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            true,
        })

        let rejectLoad:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            LoadPdfPageBatchResult
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectLoad =
                reject
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPageBatch,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        const loadPromise =
          useAppStore
            .getState()
            .loadPreviousContinuousPdfPages()

        document.closeDocument()

        useAppStore.setState({
          continuousPagesLoadStatus:
            AsyncStatus.IDLE,

          continuousPagesLoadErrorMessage:
            null,
        })

        rejectLoad(
          new Error(
            'Erro anterior depois do fechamento.',
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.continuousPagesLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'carrega o lote inicial ao pedir próximas páginas sem estado contínuo',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            6,
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
                [
                  6,
                  7,
                  8,
                  9,
                ],
              ),
            )

        await useAppStore
          .getState()
          .loadNextContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            document
              .loadedPdfDocument
              .document,

          startPage:
            6,

          batchSize:
            4,

          totalPages:
            TOTAL_PAGES,
        })

        expect(
          useAppStore
            .getState()
            .loadedContinuousPdfPages
            .map(
              (page) =>
                page.pageNumber,
            ),
        ).toEqual([
          6,
          7,
          8,
          9,
        ])
      },
    )

    it(
      'não carrega próximas páginas quando já está no final',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedContinuousPdfPages: [
            createPdfPage(
              9,
            ),
            createPdfPage(
              10,
            ),
            createPdfPage(
              11,
            ),
            createPdfPage(
              12,
            ),
          ],

          continuousPagesStartPage:
            9,

          continuousPagesEndPage:
            12,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            false,
        })

        const loadBatchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPageBatch,
            'execute',
          )

        await useAppStore
          .getState()
          .loadNextContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).not.toHaveBeenCalled()

        expect(
          useAppStore
            .getState()
            .continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'carrega próximas páginas e mescla em ordem',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedContinuousPdfPages: [
            createPdfPage(
              5,
            ),
            createPdfPage(
              6,
            ),
            createPdfPage(
              7,
            ),
            createPdfPage(
              8,
            ),
          ],

          continuousPagesStartPage:
            5,

          continuousPagesEndPage:
            8,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            true,
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
                [
                  9,
                  10,
                  11,
                  12,
                ],
              ),
            )

        await useAppStore
          .getState()
          .loadNextContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).toHaveBeenCalledWith({
          document:
            document
              .loadedPdfDocument
              .document,

          startPage:
            9,

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
          state.continuousPagesStartPage,
        ).toBe(
          5,
        )

        expect(
          state.continuousPagesEndPage,
        ).toBe(
          12,
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
      'ignora erro de próximas páginas quando o PDF é fechado',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedContinuousPdfPages: [
            createPdfPage(
              5,
            ),
            createPdfPage(
              6,
            ),
            createPdfPage(
              7,
            ),
            createPdfPage(
              8,
            ),
          ],

          continuousPagesStartPage:
            5,

          continuousPagesEndPage:
            8,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            true,
        })

        let rejectLoad:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            LoadPdfPageBatchResult
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectLoad =
                reject
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPageBatch,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        const loadPromise =
          useAppStore
            .getState()
            .loadNextContinuousPdfPages()

        document.closeDocument()

        useAppStore.setState({
          continuousPagesLoadStatus:
            AsyncStatus.IDLE,

          continuousPagesLoadErrorMessage:
            null,
        })

        rejectLoad(
          new Error(
            'Erro seguinte depois do fechamento.',
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.continuousPagesLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora pedidos de páginas anteriores e próximas enquanto já está carregando',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedContinuousPdfPages: [
            createPdfPage(
              5,
            ),
            createPdfPage(
              6,
            ),
            createPdfPage(
              7,
            ),
            createPdfPage(
              8,
            ),
          ],

          continuousPagesStartPage:
            5,

          continuousPagesEndPage:
            8,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            true,

          continuousPagesLoadStatus:
            AsyncStatus.LOADING,
        })

        const loadBatchSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPageBatch,
            'execute',
          )

        await useAppStore
          .getState()
          .loadPreviousContinuousPdfPages()

        await useAppStore
          .getState()
          .loadNextContinuousPdfPages()

        expect(
          loadBatchSpy,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'limpa completamente o estado da rolagem contínua',
      () => {
        const openedBook =
          createOpenedBook()

        useAppStore.setState({
          openedBook,

          loadedContinuousPdfPages: [
            createPdfPage(
              3,
            ),
            createPdfPage(
              4,
            ),
            createPdfPage(
              5,
            ),
          ],

          continuousPagesStartPage:
            3,

          continuousPagesEndPage:
            5,

          continuousHasPreviousPages:
            true,

          continuousHasNextPages:
            true,

          continuousPagesLoadStatus:
            AsyncStatus.ERROR,

          continuousPagesLoadErrorMessage:
            'Erro antigo.',
        })

        useAppStore
          .getState()
          .clearContinuousPdfPages()

        const state =
          useAppStore.getState()

        expect(
          state.loadedContinuousPdfPages,
        ).toEqual(
          [],
        )

        expect(
          state.continuousPagesStartPage,
        ).toBeNull()

        expect(
          state.continuousPagesEndPage,
        ).toBeNull()

        expect(
          state.continuousHasPreviousPages,
        ).toBe(
          false,
        )

        expect(
          state.continuousHasNextPages,
        ).toBe(
          false,
        )

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.continuousPagesLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'limpar a rolagem contínua invalida carregamento inicial pendente',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        let resolveLoad:
          (
            result:
              LoadPdfPageBatchResult,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            LoadPdfPageBatchResult
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPageBatch,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            4,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadInitialContinuousPdfPages()

        expect(
          useAppStore
            .getState()
            .continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.LOADING,
        )

        useAppStore
          .getState()
          .clearContinuousPdfPages()

        resolveLoad(
          createBatchResult(
            [
              4,
              5,
              6,
              7,
            ],
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedContinuousPdfPages,
        ).toEqual(
          [],
        )

        expect(
          state.continuousPagesStartPage,
        ).toBeNull()

        expect(
          state.continuousPagesEndPage,
        ).toBeNull()

        expect(
          state.continuousPagesLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.continuousPagesLoadErrorMessage,
        ).toBeNull()
      },
    )
  },
)