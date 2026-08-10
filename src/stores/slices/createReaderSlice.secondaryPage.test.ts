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
  'reader-secondary-page-book' as BookId

const TEST_DATE =
  '2026-08-10T10:00:00.000Z' as IsoDateTime

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

function createOpenedBook(
  totalPages = 20,
): OpenBookResult {
  return {
    book: {
      id:
        BOOK_ID,

      title:
        'Livro de teste',

      author:
        null,

      originalFileName:
        'livro-de-teste.pdf',

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
  numPages = 20,
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

function resetSecondaryPageState(): void {
  useAppStore.setState({
    openedBook:
      null,

    loadedPdfDocument:
      null,

    loadedPdfPage:
      null,

    loadedSecondaryPdfPage:
      null,

    secondaryPageLoadStatus:
      AsyncStatus.IDLE,

    secondaryPageLoadErrorMessage:
      null,
  })
}

describe(
  'createReaderSlice secondary PDF page',
  () => {
    beforeEach(
      () => {
        resetSecondaryPageState()
      },
    )

    afterEach(
      () => {
        vi.restoreAllMocks()

        resetSecondaryPageState()
      },
    )

    it(
      'retorna erro quando a página principal não está disponível',
      async () => {
        const loadSecondarySpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadSecondaryPdfPage,
            'execute',
          )

        await useAppStore
          .getState()
          .loadSecondaryPdfPage()

        const state =
          useAppStore.getState()

        expect(
          loadSecondarySpy,
        ).not.toHaveBeenCalled()

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.secondaryPageLoadErrorMessage,
        ).not.toBeNull()
      },
    )

    it(
      'não carrega página secundária depois da última página do livro',
      async () => {
        const openedBook =
          createOpenedBook(
            20,
          )

        const document =
          createLoadedPdfDocument(
            20,
          )

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedPdfPage:
            createPdfPage(
              20,
            ),
        })

        const loadSecondarySpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadSecondaryPdfPage,
            'execute',
          )

        await useAppStore
          .getState()
          .loadSecondaryPdfPage()

        const state =
          useAppStore.getState()

        expect(
          loadSecondarySpy,
        ).not.toHaveBeenCalled()

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.secondaryPageLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'carrega a página seguinte à página principal',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        const primaryPage =
          createPdfPage(
            7,
          )

        const secondaryPage =
          createPdfPage(
            8,
          )

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedPdfPage:
            primaryPage,
        })

        const loadSecondarySpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadSecondaryPdfPage,
            'execute',
          )
            .mockResolvedValue(
              secondaryPage,
            )

        await useAppStore
          .getState()
          .loadSecondaryPdfPage()

        expect(
          loadSecondarySpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          loadSecondarySpy,
        ).toHaveBeenCalledWith({
          document:
            document
              .loadedPdfDocument
              .document,

          primaryPageNumber:
            7,

          totalPages:
            20,
        })

        const state =
          useAppStore.getState()

        expect(
          state.loadedSecondaryPdfPage,
        ).toBe(
          secondaryPage,
        )

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.secondaryPageLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'não recarrega a página secundária quando ela já está correta',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        const primaryPage =
          createPdfPage(
            4,
          )

        const secondaryPage =
          createPdfPage(
            5,
          )

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedPdfPage:
            primaryPage,

          loadedSecondaryPdfPage:
            secondaryPage,

          secondaryPageLoadStatus:
            AsyncStatus.SUCCESS,
        })

        const loadSecondarySpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadSecondaryPdfPage,
            'execute',
          )

        await useAppStore
          .getState()
          .loadSecondaryPdfPage()

        expect(
          loadSecondarySpy,
        ).not.toHaveBeenCalled()

        expect(
          useAppStore
            .getState()
            .loadedSecondaryPdfPage,
        ).toBe(
          secondaryPage,
        )
      },
    )

    it(
      'registra erro quando o carregamento da página secundária falha',
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

          loadedPdfPage:
            createPdfPage(
              3,
            ),
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .loadSecondaryPdfPage,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha simulada na página secundária.',
            ),
          )

        await useAppStore
          .getState()
          .loadSecondaryPdfPage()

        const state =
          useAppStore.getState()

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.secondaryPageLoadErrorMessage,
        ).not.toBeNull()
      },
    )

    it(
      'ignora resultado quando a página principal muda durante o carregamento',
      async () => {
        const openedBook =
          createOpenedBook()

        const document =
          createLoadedPdfDocument()

        const oldSecondaryPage =
          createPdfPage(
            6,
          )

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          loadedPdfPage:
            createPdfPage(
              5,
            ),
        })

        let resolveLoad:
          (
            page:
              PDFPageProxy | null,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            PDFPageProxy | null
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadSecondaryPdfPage,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        const loadPromise =
          useAppStore
            .getState()
            .loadSecondaryPdfPage()

        useAppStore.setState({
          loadedPdfPage:
            createPdfPage(
              10,
            ),

          loadedSecondaryPdfPage:
            null,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          secondaryPageLoadErrorMessage:
            null,
        })

        resolveLoad(
          oldSecondaryPage,
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfPage
            ?.pageNumber,
        ).toBe(
          10,
        )

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )

    it(
      'ignora resultado quando o documento aberto muda durante o carregamento',
      async () => {
        const openedBook =
          createOpenedBook()

        const firstDocument =
          createLoadedPdfDocument()

        const secondDocument =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            firstDocument
              .loadedPdfDocument,

          loadedPdfPage:
            createPdfPage(
              2,
            ),
        })

        let resolveLoad:
          (
            page:
              PDFPageProxy | null,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            PDFPageProxy | null
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadSecondaryPdfPage,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        const loadPromise =
          useAppStore
            .getState()
            .loadSecondaryPdfPage()

        useAppStore.setState({
          loadedPdfDocument:
            secondDocument
              .loadedPdfDocument,

          loadedSecondaryPdfPage:
            null,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          secondaryPageLoadErrorMessage:
            null,
        })

        resolveLoad(
          createPdfPage(
            3,
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfDocument,
        ).toBe(
          secondDocument
            .loadedPdfDocument,
        )

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )

    it(
      'ignora resultado quando o PDF é fechado durante o carregamento',
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

          loadedPdfPage:
            createPdfPage(
              4,
            ),
        })

        let resolveLoad:
          (
            page:
              PDFPageProxy | null,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            PDFPageProxy | null
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadSecondaryPdfPage,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        const loadPromise =
          useAppStore
            .getState()
            .loadSecondaryPdfPage()

        document.closeDocument()

        useAppStore.setState({
          loadedSecondaryPdfPage:
            null,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          secondaryPageLoadErrorMessage:
            null,
        })

        resolveLoad(
          createPdfPage(
            5,
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.secondaryPageLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora erro quando o PDF é fechado durante o carregamento',
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

          loadedPdfPage:
            createPdfPage(
              6,
            ),
        })

        let rejectLoad:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            PDFPageProxy | null
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
            .loadSecondaryPdfPage,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        const loadPromise =
          useAppStore
            .getState()
            .loadSecondaryPdfPage()

        document.closeDocument()

        useAppStore.setState({
          loadedSecondaryPdfPage:
            null,

          secondaryPageLoadStatus:
            AsyncStatus.IDLE,

          secondaryPageLoadErrorMessage:
            null,
        })

        rejectLoad(
          new Error(
            'Erro depois do fechamento.',
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.secondaryPageLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'limpa a página secundária e invalida carregamento pendente',
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

          loadedPdfPage:
            createPdfPage(
              8,
            ),
        })

        let resolveLoad:
          (
            page:
              PDFPageProxy | null,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            PDFPageProxy | null
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadSecondaryPdfPage,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        const loadPromise =
          useAppStore
            .getState()
            .loadSecondaryPdfPage()

        useAppStore
          .getState()
          .clearSecondaryPdfPage()

        let state =
          useAppStore.getState()

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.secondaryPageLoadErrorMessage,
        ).toBeNull()

        resolveLoad(
          createPdfPage(
            9,
          ),
        )

        await loadPromise

        state =
          useAppStore.getState()

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )
  },
)