import type {
  PDFDocumentProxy,
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
import type {
  ReadingProgress,
} from '@/models/entities/ReadingProgress'
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

const FIRST_BOOK_ID =
  'reader-open-close-book-1' as BookId

const SECOND_BOOK_ID =
  'reader-open-close-book-2' as BookId

const TEST_DATE =
  '2026-08-10T10:00:00.000Z' as IsoDateTime

interface TestLoadedPdfDocument {
  readonly loadedPdfDocument:
    LoadedPdfDocument

  readonly close:
    ReturnType<typeof vi.fn>
}

function createReadingProgress(
  bookId: BookId,
  currentPage: number,
  pageOffsetRatio: number,
): ReadingProgress {
  return {
    bookId,

    currentPage,
    pageOffsetRatio,

    updatedAt:
      TEST_DATE,
  }
}

function createOpenedBook(
  bookId: BookId,
  {
    totalPages = 20,
    readingProgress = null,
  }: {
    readonly totalPages?: number
    readonly readingProgress?:
      ReadingProgress | null
  } = {},
): OpenBookResult {
  return {
    book: {
      id:
        bookId,

      title:
        `Livro ${bookId}`,

      author:
        null,

      originalFileName:
        `${bookId}.pdf`,

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
      bookId,

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

    readingProgress,
  }
}

function createLoadedPdfDocument(
  numPages = 20,
): TestLoadedPdfDocument {
  let isClosed = false

  const document = {
    numPages,
  } as unknown as PDFDocumentProxy

  const close =
    vi.fn(
      async () => {
        isClosed = true
      },
    )

  const loadedPdfDocument:
    LoadedPdfDocument = {
      document,

      get isClosed() {
        return isClosed
      },

      close,
    }

  return {
    loadedPdfDocument,
    close,
  }
}

function resetReaderState(): void {
  useAppStore.setState({
    openedBook:
      null,

    loadedPdfDocument:
      null,

    loadedPdfPage:
      null,

    loadedSecondaryPdfPage:
      null,

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

    bookmarks:
      [],

    currentPage:
      1,

    pageOffsetRatio:
      0,

    readerOpenStatus:
      AsyncStatus.IDLE,

    pageLoadStatus:
      AsyncStatus.IDLE,

    secondaryPageLoadStatus:
      AsyncStatus.IDLE,

    continuousPagesLoadStatus:
      AsyncStatus.IDLE,

    progressSaveStatus:
      AsyncStatus.IDLE,

    bookmarksLoadStatus:
      AsyncStatus.IDLE,

    bookmarkMutationStatus:
      AsyncStatus.IDLE,

    readerErrorMessage:
      null,

    pageLoadErrorMessage:
      null,

    secondaryPageLoadErrorMessage:
      null,

    continuousPagesLoadErrorMessage:
      null,

    bookmarkErrorMessage:
      null,
  })
}

describe(
  'createReaderSlice open and close',
  () => {
    beforeEach(
      () => {
        resetReaderState()
      },
    )

    afterEach(
      () => {
        vi.restoreAllMocks()

        resetReaderState()
      },
    )

    it(
      'abre o primeiro livro e restaura o progresso salvo',
      async () => {
        const readingProgress =
          createReadingProgress(
            FIRST_BOOK_ID,
            7,
            0.35,
          )

        const openedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
            {
              readingProgress,
            },
          )

        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument()

        const openBookSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .openBook,
            'execute',
          )
            .mockResolvedValue(
              openedBook,
            )

        const openPdfSpy =
          vi.spyOn(
            applicationContainer
              .services
              .pdfDocument,
            'open',
          )
            .mockResolvedValue(
              loadedPdfDocument,
            )

        await useAppStore
          .getState()
          .openBook(
            FIRST_BOOK_ID,
          )

        const state =
          useAppStore.getState()

        expect(
          openBookSpy,
        ).toHaveBeenCalledWith({
          bookId:
            FIRST_BOOK_ID,
        })

        expect(
          openPdfSpy,
        ).toHaveBeenCalledWith(
          openedBook.bookFile.file,
          {},
        )

        expect(
          state.openedBook,
        ).toBe(
          openedBook,
        )

        expect(
          state.loadedPdfDocument,
        ).toBe(
          loadedPdfDocument,
        )

        expect(
          state.currentPage,
        ).toBe(
          7,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          0.35,
        )

        expect(
          state.readerOpenStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.readerErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'inicia na primeira página quando o livro não possui progresso',
      async () => {
        const openedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument()

        vi.spyOn(
          applicationContainer
            .controllers
            .openBook,
          'execute',
        )
          .mockResolvedValue(
            openedBook,
          )

        vi.spyOn(
          applicationContainer
            .services
            .pdfDocument,
          'open',
        )
          .mockResolvedValue(
            loadedPdfDocument,
          )

        await useAppStore
          .getState()
          .openBook(
            FIRST_BOOK_ID,
          )

        const state =
          useAppStore.getState()

        expect(
          state.currentPage,
        ).toBe(
          1,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          0,
        )

        expect(
          state.readerOpenStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'normaliza progresso salvo fora dos limites do livro',
      async () => {
        const readingProgress =
          createReadingProgress(
            FIRST_BOOK_ID,
            999,
            2,
          )

        const openedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
            {
              totalPages:
                20,

              readingProgress,
            },
          )

        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument(
            20,
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .openBook,
          'execute',
        )
          .mockResolvedValue(
            openedBook,
          )

        vi.spyOn(
          applicationContainer
            .services
            .pdfDocument,
          'open',
        )
          .mockResolvedValue(
            loadedPdfDocument,
          )

        await useAppStore
          .getState()
          .openBook(
            FIRST_BOOK_ID,
          )

        const state =
          useAppStore.getState()

        expect(
          state.currentPage,
        ).toBe(
          20,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          1,
        )
      },
    )

    it(
      'envia a senha informada ao abrir um PDF protegido',
      async () => {
        const openedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument()

        vi.spyOn(
          applicationContainer
            .controllers
            .openBook,
          'execute',
        )
          .mockResolvedValue(
            openedBook,
          )

        const openPdfSpy =
          vi.spyOn(
            applicationContainer
              .services
              .pdfDocument,
            'open',
          )
            .mockResolvedValue(
              loadedPdfDocument,
            )

        await useAppStore
          .getState()
          .openBook(
            FIRST_BOOK_ID,
            'senha-secreta',
          )

        expect(
          openPdfSpy,
        ).toHaveBeenCalledWith(
          openedBook.bookFile.file,
          {
            password:
              'senha-secreta',
          },
        )
      },
    )

    it(
      'salva o progresso e fecha o PDF anterior ao trocar de livro',
      async () => {
        const firstOpenedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const secondOpenedBook =
          createOpenedBook(
            SECOND_BOOK_ID,
          )

        const firstDocument =
          createLoadedPdfDocument()

        const secondDocument =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook:
            firstOpenedBook,

          loadedPdfDocument:
            firstDocument
              .loadedPdfDocument,

          currentPage:
            11,

          pageOffsetRatio:
            0.63,

          readerOpenStatus:
            AsyncStatus.SUCCESS,
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .openBook,
          'execute',
        )
          .mockResolvedValue(
            secondOpenedBook,
          )

        vi.spyOn(
          applicationContainer
            .services
            .pdfDocument,
          'open',
        )
          .mockResolvedValue(
            secondDocument
              .loadedPdfDocument,
          )

        const saveProgressSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .saveReadingProgress,
            'execute',
          )
            .mockResolvedValue(
              createReadingProgress(
                FIRST_BOOK_ID,
                11,
                0.63,
              ),
            )

        await useAppStore
          .getState()
          .openBook(
            SECOND_BOOK_ID,
          )

        expect(
          saveProgressSpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          saveProgressSpy,
        ).toHaveBeenCalledWith({
          bookId:
            FIRST_BOOK_ID,

          currentPage:
            11,

          pageOffsetRatio:
            0.63,
        })

        expect(
          firstDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )

        const state =
          useAppStore.getState()

        expect(
          state.openedBook,
        ).toBe(
          secondOpenedBook,
        )

        expect(
          state.loadedPdfDocument,
        ).toBe(
          secondDocument
            .loadedPdfDocument,
        )

        expect(
          state.readerOpenStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'mantém o novo livro aberto mesmo quando falha ao salvar o progresso anterior',
      async () => {
        const firstOpenedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const secondOpenedBook =
          createOpenedBook(
            SECOND_BOOK_ID,
          )

        const firstDocument =
          createLoadedPdfDocument()

        const secondDocument =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook:
            firstOpenedBook,

          loadedPdfDocument:
            firstDocument
              .loadedPdfDocument,

          currentPage:
            8,

          pageOffsetRatio:
            0.5,
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .openBook,
          'execute',
        )
          .mockResolvedValue(
            secondOpenedBook,
          )

        vi.spyOn(
          applicationContainer
            .services
            .pdfDocument,
          'open',
        )
          .mockResolvedValue(
            secondDocument
              .loadedPdfDocument,
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .saveReadingProgress,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha simulada ao salvar progresso anterior.',
            ),
          )

        await useAppStore
          .getState()
          .openBook(
            SECOND_BOOK_ID,
          )

        const state =
          useAppStore.getState()

        expect(
          state.openedBook,
        ).toBe(
          secondOpenedBook,
        )

        expect(
          state.loadedPdfDocument,
        ).toBe(
          secondDocument
            .loadedPdfDocument,
        )

        expect(
          state.readerOpenStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.readerErrorMessage,
        ).not.toBeNull()

        expect(
          firstDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'preserva o livro anterior quando a abertura do novo PDF falha',
      async () => {
        const firstOpenedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const secondOpenedBook =
          createOpenedBook(
            SECOND_BOOK_ID,
          )

        const firstDocument =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook:
            firstOpenedBook,

          loadedPdfDocument:
            firstDocument
              .loadedPdfDocument,

          currentPage:
            6,

          pageOffsetRatio:
            0.25,

          readerOpenStatus:
            AsyncStatus.SUCCESS,
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .openBook,
          'execute',
        )
          .mockResolvedValue(
            secondOpenedBook,
          )

        vi.spyOn(
          applicationContainer
            .services
            .pdfDocument,
          'open',
        )
          .mockRejectedValue(
            new Error(
              'Falha simulada ao abrir PDF.',
            ),
          )

        const saveProgressSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .saveReadingProgress,
            'execute',
          )

        await useAppStore
          .getState()
          .openBook(
            SECOND_BOOK_ID,
          )

        const state =
          useAppStore.getState()

        expect(
          state.openedBook,
        ).toBe(
          firstOpenedBook,
        )

        expect(
          state.loadedPdfDocument,
        ).toBe(
          firstDocument
            .loadedPdfDocument,
        )

        expect(
          state.currentPage,
        ).toBe(
          6,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          0.25,
        )

        expect(
          state.readerOpenStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.readerErrorMessage,
        ).not.toBeNull()

        expect(
          saveProgressSpy,
        ).not.toHaveBeenCalled()

        expect(
          firstDocument.close,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'ignora abertura antiga que termina depois de uma abertura mais recente',
      async () => {
        const firstOpenedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const secondOpenedBook =
          createOpenedBook(
            SECOND_BOOK_ID,
          )

        let resolveFirstOpen:
          (
            value:
              OpenBookResult,
          ) => void =
          () => undefined

        const firstPendingOpen =
          new Promise<
            OpenBookResult
          >(
            (resolve) => {
              resolveFirstOpen =
                resolve
            },
          )

        const openBookSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .openBook,
            'execute',
          )
            .mockReturnValueOnce(
              firstPendingOpen,
            )
            .mockResolvedValueOnce(
              secondOpenedBook,
            )

        const firstDocument =
          createLoadedPdfDocument()

        const secondDocument =
          createLoadedPdfDocument()

        const openPdfSpy =
          vi.spyOn(
            applicationContainer
              .services
              .pdfDocument,
            'open',
          )
            .mockResolvedValueOnce(
              secondDocument
                .loadedPdfDocument,
            )
            .mockResolvedValueOnce(
              firstDocument
                .loadedPdfDocument,
            )

        const firstOpenPromise =
          useAppStore
            .getState()
            .openBook(
              FIRST_BOOK_ID,
            )

        await useAppStore
          .getState()
          .openBook(
            SECOND_BOOK_ID,
          )

        resolveFirstOpen(
          firstOpenedBook,
        )

        await firstOpenPromise

        const state =
          useAppStore.getState()

        expect(
          openBookSpy,
        ).toHaveBeenCalledTimes(
          2,
        )

        expect(
          openPdfSpy,
        ).toHaveBeenCalledTimes(
          2,
        )

        expect(
          state.openedBook,
        ).toBe(
          secondOpenedBook,
        )

        expect(
          state.loadedPdfDocument,
        ).toBe(
          secondDocument
            .loadedPdfDocument,
        )

        expect(
          secondDocument.close,
        ).not.toHaveBeenCalled()

        expect(
          firstDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'salva progresso, fecha o PDF e limpa o estado ao fechar o livro',
      async () => {
        const openedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            13,

          pageOffsetRatio:
            0.72,

          readerOpenStatus:
            AsyncStatus.SUCCESS,
        })

        const savedProgress =
          createReadingProgress(
            FIRST_BOOK_ID,
            13,
            0.72,
          )

        const saveProgressSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .saveReadingProgress,
            'execute',
          )
            .mockResolvedValue(
              savedProgress,
            )

        await useAppStore
          .getState()
          .closeBook()

        expect(
          saveProgressSpy,
        ).toHaveBeenCalledWith({
          bookId:
            FIRST_BOOK_ID,

          currentPage:
            13,

          pageOffsetRatio:
            0.72,
        })

        expect(
          document.close,
        ).toHaveBeenCalledTimes(
          1,
        )

        const state =
          useAppStore.getState()

        expect(
          state.openedBook,
        ).toBeNull()

        expect(
          state.loadedPdfDocument,
        ).toBeNull()

        expect(
          state.currentPage,
        ).toBe(
          1,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          0,
        )

        expect(
          state.readerOpenStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.progressSaveStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.readerErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'fecha o livro mesmo quando o salvamento do progresso falha',
      async () => {
        const openedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          openedBook,

          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            4,

          pageOffsetRatio:
            0.2,
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .saveReadingProgress,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha simulada ao salvar progresso.',
            ),
          )

        await useAppStore
          .getState()
          .closeBook()

        const state =
          useAppStore.getState()

        expect(
          document.close,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          state.openedBook,
        ).toBeNull()

        expect(
          state.loadedPdfDocument,
        ).toBeNull()

        expect(
          state.readerOpenStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.progressSaveStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.readerErrorMessage,
        ).not.toBeNull()
      },
    )
  },
)