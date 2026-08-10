import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  OpenBookController,
} from '@/controllers/reader/OpenBookController'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookFile,
} from '@/models/entities/BookFile'
import type {
  ReadingProgress,
} from '@/models/entities/ReadingProgress'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  BookFileRepository,
} from '@/repositories/contracts/BookFileRepository'
import type {
  BookRepository,
} from '@/repositories/contracts/BookRepository'
import type {
  ReadingProgressRepository,
} from '@/repositories/contracts/ReadingProgressRepository'
import {
  LibraryErrorCode,
} from '@/utils/errors/LibraryError'

interface ControllerFixture {
  readonly bookId:
    BookId

  readonly book:
    Book

  readonly bookFile:
    BookFile

  readonly readingProgress:
    ReadingProgress

  readonly findBookById:
    ReturnType<typeof vi.fn>

  readonly saveBook:
    ReturnType<typeof vi.fn>

  readonly findBookFileByBookId:
    ReturnType<typeof vi.fn>

  readonly findReadingProgressByBookId:
    ReturnType<typeof vi.fn>

  readonly controller:
    OpenBookController
}

function asBookId(
  value: string,
): BookId {
  return value as BookId
}

function asIsoDateTime(
  value: string,
): IsoDateTime {
  return value as IsoDateTime
}

function createFixture():
  ControllerFixture {
  const bookId =
    asBookId(
      'book-open-controller',
    )

  const book: Book = {
    id:
      bookId,

    title:
      'Livro de teste',

    author:
      'Autor de teste',

    originalFileName:
      'livro-teste.pdf',

    fileSizeBytes:
      1024,

    mimeType:
      'application/pdf',

    totalPages:
      120,

    pdfFingerprint:
      'fingerprint-open-book',

    importedAt:
      asIsoDateTime(
        '2026-01-01T10:00:00.000Z',
      ),

    updatedAt:
      asIsoDateTime(
        '2026-01-02T10:00:00.000Z',
      ),

    lastOpenedAt:
      null,
  }

  const bookFile: BookFile = {
    bookId,

    file:
      new Blob(
        ['PDF de teste'],
        {
          type:
            'application/pdf',
        },
      ),

    storedAt:
      asIsoDateTime(
        '2026-01-01T10:00:00.000Z',
      ),
  }

  const readingProgress:
    ReadingProgress = {
      bookId,

      currentPage:
        37,

      pageOffsetRatio:
        0.42,

      updatedAt:
        asIsoDateTime(
          '2026-01-05T10:00:00.000Z',
        ),
    }

  const findBookById =
    vi.fn()
      .mockResolvedValue(
        book,
      )

  const saveBook =
    vi.fn()
      .mockResolvedValue(
        undefined,
      )

  const findBookFileByBookId =
    vi.fn()
      .mockResolvedValue(
        bookFile,
      )

  const findReadingProgressByBookId =
    vi.fn()
      .mockResolvedValue(
        readingProgress,
      )

  const bookRepository = {
    findById:
      findBookById,

    save:
      saveBook,
  } as unknown as
    BookRepository

  const bookFileRepository = {
    findByBookId:
      findBookFileByBookId,
  } as unknown as
    BookFileRepository

  const readingProgressRepository = {
    findByBookId:
      findReadingProgressByBookId,
  } as unknown as
    ReadingProgressRepository

  const controller =
    new OpenBookController({
      bookRepository,
      bookFileRepository,
      readingProgressRepository,
    })

  return {
    bookId,
    book,
    bookFile,
    readingProgress,

    findBookById,
    saveBook,
    findBookFileByBookId,
    findReadingProgressByBookId,

    controller,
  }
}

describe(
  'OpenBookController',
  () => {
    it(
      'abre livro, carrega arquivo e progresso e registra o último acesso',
      async () => {
        const fixture =
          createFixture()

        const result =
          await fixture
            .controller
            .execute({
              bookId:
                fixture.bookId,
            })

        expect(
          fixture.findBookById,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          fixture.findBookById,
        ).toHaveBeenCalledWith(
          fixture.bookId,
        )

        expect(
          fixture
            .findBookFileByBookId,
        ).toHaveBeenCalledWith(
          fixture.bookId,
        )

        expect(
          fixture
            .findReadingProgressByBookId,
        ).toHaveBeenCalledWith(
          fixture.bookId,
        )

        expect(
          result.bookFile,
        ).toBe(
          fixture.bookFile,
        )

        expect(
          result.readingProgress,
        ).toBe(
          fixture.readingProgress,
        )

        expect(
          result.book.id,
        ).toBe(
          fixture.bookId,
        )

        expect(
          result.book.lastOpenedAt,
        ).not.toBeNull()

        expect(
          result.book.updatedAt,
        ).toBe(
          result.book.lastOpenedAt,
        )

        expect(
          result.book.updatedAt,
        ).not.toBe(
          fixture.book.updatedAt,
        )

        expect(
          fixture.saveBook,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          fixture.saveBook,
        ).toHaveBeenCalledWith(
          result.book,
        )

        expect(
          fixture.book.lastOpenedAt,
        ).toBeNull()

        expect(
          fixture.book.updatedAt,
        ).toBe(
          asIsoDateTime(
            '2026-01-02T10:00:00.000Z',
          ),
        )
      },
    )

    it(
      'permite abrir livro sem progresso salvo',
      async () => {
        const fixture =
          createFixture()

        fixture
          .findReadingProgressByBookId
          .mockResolvedValue(
            null,
          )

        const result =
          await fixture
            .controller
            .execute({
              bookId:
                fixture.bookId,
            })

        expect(
          result.readingProgress,
        ).toBeNull()

        expect(
          result.bookFile,
        ).toBe(
          fixture.bookFile,
        )

        expect(
          fixture.saveBook,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'retorna BOOK_NOT_FOUND quando o livro não existe',
      async () => {
        const fixture =
          createFixture()

        fixture
          .findBookById
          .mockResolvedValue(
            null,
          )

        await expect(
          fixture
            .controller
            .execute({
              bookId:
                fixture.bookId,
            }),
        ).rejects.toMatchObject({
          code:
            LibraryErrorCode
              .BOOK_NOT_FOUND,
        })

        expect(
          fixture
            .findBookFileByBookId,
        ).not.toHaveBeenCalled()

        expect(
          fixture
            .findReadingProgressByBookId,
        ).not.toHaveBeenCalled()

        expect(
          fixture.saveBook,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'converte falha ao consultar o livro em OPEN_FAILED',
      async () => {
        const fixture =
          createFixture()

        const originalError =
          new Error(
            'Falha simulada ao consultar livro.',
          )

        fixture
          .findBookById
          .mockRejectedValue(
            originalError,
          )

        await expect(
          fixture
            .controller
            .execute({
              bookId:
                fixture.bookId,
            }),
        ).rejects.toMatchObject({
          code:
            LibraryErrorCode
              .OPEN_FAILED,

          cause:
            originalError,
        })

        expect(
          fixture
            .findBookFileByBookId,
        ).not.toHaveBeenCalled()

        expect(
          fixture
            .findReadingProgressByBookId,
        ).not.toHaveBeenCalled()

        expect(
          fixture.saveBook,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'converte falha ao preparar arquivo ou progresso em OPEN_FAILED',
      async () => {
        const fixture =
          createFixture()

        const originalError =
          new Error(
            'Falha simulada ao carregar arquivo.',
          )

        fixture
          .findBookFileByBookId
          .mockRejectedValue(
            originalError,
          )

        await expect(
          fixture
            .controller
            .execute({
              bookId:
                fixture.bookId,
            }),
        ).rejects.toMatchObject({
          code:
            LibraryErrorCode
              .OPEN_FAILED,

          cause:
            originalError,
        })

        expect(
          fixture
            .findBookFileByBookId,
        ).toHaveBeenCalledWith(
          fixture.bookId,
        )

        expect(
          fixture
            .findReadingProgressByBookId,
        ).toHaveBeenCalledWith(
          fixture.bookId,
        )

        expect(
          fixture.saveBook,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'retorna BOOK_FILE_NOT_FOUND quando o PDF original não existe',
      async () => {
        const fixture =
          createFixture()

        fixture
          .findBookFileByBookId
          .mockResolvedValue(
            null,
          )

        await expect(
          fixture
            .controller
            .execute({
              bookId:
                fixture.bookId,
            }),
        ).rejects.toMatchObject({
          code:
            LibraryErrorCode
              .BOOK_FILE_NOT_FOUND,
        })

        expect(
          fixture
            .findReadingProgressByBookId,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          fixture.saveBook,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'converte falha ao registrar o último acesso em UPDATE_FAILED',
      async () => {
        const fixture =
          createFixture()

        const originalError =
          new Error(
            'Falha simulada ao salvar livro.',
          )

        fixture
          .saveBook
          .mockRejectedValue(
            originalError,
          )

        await expect(
          fixture
            .controller
            .execute({
              bookId:
                fixture.bookId,
            }),
        ).rejects.toMatchObject({
          code:
            LibraryErrorCode
              .UPDATE_FAILED,

          cause:
            originalError,
        })

        expect(
          fixture.saveBook,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )
  },
)