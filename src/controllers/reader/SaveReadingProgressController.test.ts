import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  SaveReadingProgressController,
  type SaveReadingProgressCommand,
} from '@/controllers/reader/SaveReadingProgressController'
import type { Book } from '@/models/entities/Book'
import type { ReadingProgress } from '@/models/entities/ReadingProgress'
import type { BookRepository } from '@/repositories/contracts/BookRepository'
import type { ReadingProgressRepository } from '@/repositories/contracts/ReadingProgressRepository'
import type { BookId } from '@/models/value-objects/BookId'
import {
  ReaderError,
  ReaderErrorCode,
} from '@/utils/errors/ReaderError'

const BOOK_ID =
  'book_test-reading-progress' as BookId

function createBook(
  overrides: Partial<Book> = {},
): Book {
  return {
    id: BOOK_ID,
    title: 'Livro de teste',
    author: null,
    originalFileName: 'livro.pdf',
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    totalPages: 10,
    pdfFingerprint: 'fingerprint-test',
    importedAt:
      '2026-08-12T10:00:00.000Z' as Book['importedAt'],
    updatedAt:
      '2026-08-12T10:00:00.000Z' as Book['updatedAt'],
    lastOpenedAt:
      '2026-08-12T11:00:00.000Z' as Book['lastOpenedAt'],
    ...overrides,
  }
}

function createCommand(
  overrides: Partial<SaveReadingProgressCommand> = {},
): SaveReadingProgressCommand {
  return {
    bookId: BOOK_ID,
    currentPage: 4,
    pageOffsetRatio: 0.35,
    ...overrides,
  }
}

function createBookRepository(): BookRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByPdfFingerprint: vi.fn(),
    findAll: vi.fn(),
    deleteById: vi.fn(),
  }
}

function createReadingProgressRepository():
  ReadingProgressRepository {
  return {
    save: vi.fn(),
    findByBookId: vi.fn(),
    deleteByBookId: vi.fn(),
  }
}

describe('SaveReadingProgressController', () => {
  const fixedDate =
    new Date('2026-08-12T12:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fixedDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('salva e retorna o progresso de leitura com updatedAt atual', async () => {
    const bookRepository =
      createBookRepository()

    const readingProgressRepository =
      createReadingProgressRepository()

    vi.mocked(
      bookRepository.findById,
    ).mockResolvedValue(
      createBook(),
    )

    vi.mocked(
      readingProgressRepository.save,
    ).mockResolvedValue(
      undefined,
    )

    const controller =
      new SaveReadingProgressController({
        bookRepository,
        readingProgressRepository,
      })

    const command =
      createCommand()

    const result =
      await controller.execute(
        command,
      )

    const expected:
      ReadingProgress = {
        bookId: command.bookId,
        currentPage:
          command.currentPage,
        pageOffsetRatio:
          command.pageOffsetRatio,
        updatedAt:
          fixedDate.toISOString() as ReadingProgress['updatedAt'],
      }

    expect(result).toEqual(
      expected,
    )

    expect(
      bookRepository.findById,
    ).toHaveBeenCalledWith(
      BOOK_ID,
    )

    expect(
      readingProgressRepository.save,
    ).toHaveBeenCalledWith(
      expected,
    )
  })

  it('aceita a primeira página do livro', async () => {
    const bookRepository =
      createBookRepository()

    const readingProgressRepository =
      createReadingProgressRepository()

    vi.mocked(
      bookRepository.findById,
    ).mockResolvedValue(
      createBook(),
    )

    const controller =
      new SaveReadingProgressController({
        bookRepository,
        readingProgressRepository,
      })

    await expect(
      controller.execute(
        createCommand({
          currentPage: 1,
        }),
      ),
    ).resolves.toMatchObject({
      currentPage: 1,
    })
  })

  it('aceita a última página do livro', async () => {
    const bookRepository =
      createBookRepository()

    const readingProgressRepository =
      createReadingProgressRepository()

    vi.mocked(
      bookRepository.findById,
    ).mockResolvedValue(
      createBook({
        totalPages: 10,
      }),
    )

    const controller =
      new SaveReadingProgressController({
        bookRepository,
        readingProgressRepository,
      })

    await expect(
      controller.execute(
        createCommand({
          currentPage: 10,
        }),
      ),
    ).resolves.toMatchObject({
      currentPage: 10,
    })
  })

  it.each([
    0,
    -1,
    1.5,
    11,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])(
    'rejeita página atual inválida: %s',
    async (
      currentPage,
    ) => {
      const bookRepository =
        createBookRepository()

      const readingProgressRepository =
        createReadingProgressRepository()

      vi.mocked(
        bookRepository.findById,
      ).mockResolvedValue(
        createBook({
          totalPages: 10,
        }),
      )

      const controller =
        new SaveReadingProgressController({
          bookRepository,
          readingProgressRepository,
        })

      await expect(
        controller.execute(
          createCommand({
            currentPage,
          }),
        ),
      ).rejects.toMatchObject({
        name:
          'ReaderError',
        code:
          ReaderErrorCode.INVALID_PAGE_NUMBER,
      })

      expect(
        readingProgressRepository.save,
      ).not.toHaveBeenCalled()
    },
  )

  it.each([
    -0.01,
    1.01,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])(
    'rejeita pageOffsetRatio inválido: %s',
    async (
      pageOffsetRatio,
    ) => {
      const bookRepository =
        createBookRepository()

      const readingProgressRepository =
        createReadingProgressRepository()

      vi.mocked(
        bookRepository.findById,
      ).mockResolvedValue(
        createBook(),
      )

      const controller =
        new SaveReadingProgressController({
          bookRepository,
          readingProgressRepository,
        })

      await expect(
        controller.execute(
          createCommand({
            pageOffsetRatio,
          }),
        ),
      ).rejects.toMatchObject({
        name:
          'ReaderError',
        code:
          ReaderErrorCode.INVALID_PAGE_OFFSET,
      })

      expect(
        readingProgressRepository.save,
      ).not.toHaveBeenCalled()
    },
  )

  it.each([
    0,
    1,
  ])(
    'aceita pageOffsetRatio no limite %s',
    async (
      pageOffsetRatio,
    ) => {
      const bookRepository =
        createBookRepository()

      const readingProgressRepository =
        createReadingProgressRepository()

      vi.mocked(
        bookRepository.findById,
      ).mockResolvedValue(
        createBook(),
      )

      const controller =
        new SaveReadingProgressController({
          bookRepository,
          readingProgressRepository,
        })

      await expect(
        controller.execute(
          createCommand({
            pageOffsetRatio,
          }),
        ),
      ).resolves.toMatchObject({
        pageOffsetRatio,
      })

      expect(
        readingProgressRepository.save,
      ).toHaveBeenCalledTimes(
        1,
      )
    },
  )

  it('retorna BOOK_NOT_OPEN quando o livro não existe', async () => {
    const bookRepository =
      createBookRepository()

    const readingProgressRepository =
      createReadingProgressRepository()

    vi.mocked(
      bookRepository.findById,
    ).mockResolvedValue(
      null,
    )

    const controller =
      new SaveReadingProgressController({
        bookRepository,
        readingProgressRepository,
      })

    try {
      await controller.execute(
        createCommand(),
      )

      throw new Error(
        'O salvamento deveria falhar.',
      )
    } catch (error) {
      expect(error).toBeInstanceOf(
        ReaderError,
      )

      expect(error).toMatchObject({
        code:
          ReaderErrorCode.BOOK_NOT_OPEN,
      })
    }

    expect(
      readingProgressRepository.save,
    ).not.toHaveBeenCalled()
  })

  it('converte falha ao consultar o livro em SAVE_PROGRESS_FAILED preservando a causa', async () => {
    const lookupError =
      new Error(
        'falha ao consultar livro',
      )

    const bookRepository =
      createBookRepository()

    const readingProgressRepository =
      createReadingProgressRepository()

    vi.mocked(
      bookRepository.findById,
    ).mockRejectedValue(
      lookupError,
    )

    const controller =
      new SaveReadingProgressController({
        bookRepository,
        readingProgressRepository,
      })

    try {
      await controller.execute(
        createCommand(),
      )

      throw new Error(
        'O salvamento deveria falhar.',
      )
    } catch (error) {
      expect(error).toBeInstanceOf(
        ReaderError,
      )

      expect(error).toMatchObject({
        code:
          ReaderErrorCode.SAVE_PROGRESS_FAILED,
        cause:
          lookupError,
      })
    }

    expect(
      readingProgressRepository.save,
    ).not.toHaveBeenCalled()
  })

  it('converte falha ao persistir o progresso em SAVE_PROGRESS_FAILED preservando a causa', async () => {
    const saveError =
      new Error(
        'falha ao salvar progresso',
      )

    const bookRepository =
      createBookRepository()

    const readingProgressRepository =
      createReadingProgressRepository()

    vi.mocked(
      bookRepository.findById,
    ).mockResolvedValue(
      createBook(),
    )

    vi.mocked(
      readingProgressRepository.save,
    ).mockRejectedValue(
      saveError,
    )

    const controller =
      new SaveReadingProgressController({
        bookRepository,
        readingProgressRepository,
      })

    try {
      await controller.execute(
        createCommand(),
      )

      throw new Error(
        'O salvamento deveria falhar.',
      )
    } catch (error) {
      expect(error).toBeInstanceOf(
        ReaderError,
      )

      expect(error).toMatchObject({
        code:
          ReaderErrorCode.SAVE_PROGRESS_FAILED,
        cause:
          saveError,
      })
    }

    expect(
      readingProgressRepository.save,
    ).toHaveBeenCalledTimes(
      1,
    )
  })
})
