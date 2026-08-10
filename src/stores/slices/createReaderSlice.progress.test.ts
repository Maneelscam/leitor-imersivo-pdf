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
import {
  useAppStore,
} from '@/stores/useAppStore'

const FIRST_BOOK_ID =
  'reader-progress-book-1' as BookId

const SECOND_BOOK_ID =
  'reader-progress-book-2' as BookId

const TEST_DATE =
  '2026-08-10T10:00:00.000Z' as IsoDateTime

function createOpenedBook(
  bookId: BookId,
  totalPages = 20,
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

    readingProgress:
      null,
  }
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

function resetReaderState(): void {
  useAppStore.setState({
    openedBook:
      null,

    currentPage:
      1,

    pageOffsetRatio:
      0,

    progressSaveStatus:
      AsyncStatus.IDLE,

    readerErrorMessage:
      null,
  })
}

describe(
  'createReaderSlice reading progress',
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
      'não altera posição quando nenhum livro está aberto',
      () => {
        useAppStore
          .getState()
          .setReadingPosition(
            10,
            0.5,
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
      },
    )

    it(
      'atualiza página e deslocamento da leitura',
      () => {
        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
              20,
            ),
        })

        useAppStore
          .getState()
          .setReadingPosition(
            8,
            0.42,
          )

        const state =
          useAppStore.getState()

        expect(
          state.currentPage,
        ).toBe(
          8,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          0.42,
        )
      },
    )

    it(
      'normaliza página e deslocamento para os limites válidos',
      () => {
        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
              20,
            ),
        })

        useAppStore
          .getState()
          .setReadingPosition(
            999,
            4,
          )

        let state =
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

        useAppStore
          .getState()
          .setReadingPosition(
            -10,
            -3,
          )

        state =
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
      },
    )

    it(
      'normaliza valores não finitos da posição',
      () => {
        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
              20,
            ),

          currentPage:
            7,

          pageOffsetRatio:
            0.6,
        })

        useAppStore
          .getState()
          .setReadingPosition(
            Number.NaN,
            Number.POSITIVE_INFINITY,
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
      },
    )

    it(
      'retorna erro ao salvar progresso sem livro aberto',
      async () => {
        const saveProgressSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .saveReadingProgress,
            'execute',
          )

        await useAppStore
          .getState()
          .saveReadingProgress()

        const state =
          useAppStore.getState()

        expect(
          saveProgressSpy,
        ).not.toHaveBeenCalled()

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

    it(
      'salva o progresso atual e atualiza o livro aberto',
      async () => {
        const openedBook =
          createOpenedBook(
            FIRST_BOOK_ID,
            30,
          )

        useAppStore.setState({
          openedBook,

          currentPage:
            14,

          pageOffsetRatio:
            0.67,
        })

        const savedProgress =
          createReadingProgress(
            FIRST_BOOK_ID,
            14,
            0.67,
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
          .saveReadingProgress()

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
            14,

          pageOffsetRatio:
            0.67,
        })

        const state =
          useAppStore.getState()

        expect(
          state.openedBook
            ?.readingProgress,
        ).toBe(
          savedProgress,
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
      'registra erro quando o salvamento falha',
      async () => {
        useAppStore.setState({
          openedBook:
            createOpenedBook(
              FIRST_BOOK_ID,
            ),

          currentPage:
            6,

          pageOffsetRatio:
            0.3,
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .saveReadingProgress,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha simulada no salvamento.',
            ),
          )

        await useAppStore
          .getState()
          .saveReadingProgress()

        const state =
          useAppStore.getState()

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

    it(
      'ignora resultado antigo do salvamento quando outro livro é aberto',
      async () => {
        const firstBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const secondBook =
          createOpenedBook(
            SECOND_BOOK_ID,
          )

        useAppStore.setState({
          openedBook:
            firstBook,

          currentPage:
            9,

          pageOffsetRatio:
            0.45,
        })

        let resolveSave:
          (
            value:
              ReadingProgress,
          ) => void =
          () => undefined

        const pendingSave =
          new Promise<
            ReadingProgress
          >(
            (resolve) => {
              resolveSave =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .saveReadingProgress,
          'execute',
        )
          .mockReturnValue(
            pendingSave,
          )

        const savePromise =
          useAppStore
            .getState()
            .saveReadingProgress()

        useAppStore.setState({
          openedBook:
            secondBook,

          currentPage:
            2,

          pageOffsetRatio:
            0.1,

          progressSaveStatus:
            AsyncStatus.IDLE,
        })

        resolveSave(
          createReadingProgress(
            FIRST_BOOK_ID,
            9,
            0.45,
          ),
        )

        await savePromise

        const state =
          useAppStore.getState()

        expect(
          state.openedBook,
        ).toBe(
          secondBook,
        )

        expect(
          state.currentPage,
        ).toBe(
          2,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          0.1,
        )

        expect(
          state.progressSaveStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )

    it(
      'ignora erro antigo do salvamento quando outro livro é aberto',
      async () => {
        const firstBook =
          createOpenedBook(
            FIRST_BOOK_ID,
          )

        const secondBook =
          createOpenedBook(
            SECOND_BOOK_ID,
          )

        useAppStore.setState({
          openedBook:
            firstBook,

          currentPage:
            5,

          pageOffsetRatio:
            0.25,
        })

        let rejectSave:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingSave =
          new Promise<
            ReadingProgress
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectSave =
                reject
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .saveReadingProgress,
          'execute',
        )
          .mockReturnValue(
            pendingSave,
          )

        const savePromise =
          useAppStore
            .getState()
            .saveReadingProgress()

        useAppStore.setState({
          openedBook:
            secondBook,

          progressSaveStatus:
            AsyncStatus.IDLE,

          readerErrorMessage:
            null,
        })

        rejectSave(
          new Error(
            'Erro antigo.',
          ),
        )

        await savePromise

        const state =
          useAppStore.getState()

        expect(
          state.openedBook,
        ).toBe(
          secondBook,
        )

        expect(
          state.progressSaveStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.readerErrorMessage,
        ).toBeNull()
      },
    )
  },
)