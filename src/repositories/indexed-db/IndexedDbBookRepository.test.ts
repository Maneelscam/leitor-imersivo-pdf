import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  closeIndexedDbConnection,
} from '@/database/indexedDbConnection'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  IndexedDbBookRepository,
} from '@/repositories/indexed-db/IndexedDbBookRepository'

const FIRST_BOOK_ID =
  'livro-1' as BookId

const SECOND_BOOK_ID =
  'livro-2' as BookId

const FIRST_DATE =
  '2026-08-11T10:00:00.000Z' as IsoDateTime

const UPDATED_DATE =
  '2026-08-11T10:30:00.000Z' as IsoDateTime

const FIRST_FINGERPRINT =
  'fingerprint-livro-1'

const SECOND_FINGERPRINT =
  'fingerprint-livro-2'

function deleteTestDatabase():
  Promise<void> {
  closeIndexedDbConnection()

  return new Promise<void>(
    (resolve, reject) => {
      const request =
        indexedDB.deleteDatabase(
          APP_CONFIG.database.name,
        )

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              'Não foi possível excluir o banco de teste.',
            ),
        )
      }

      request.onblocked = () => {
        reject(
          new Error(
            'A exclusão do banco de teste foi bloqueada.',
          ),
        )
      }
    },
  )
}

function createBook({
  id,
  title,
  author = null,
  originalFileName,
  fileSizeBytes,
  totalPages,
  pdfFingerprint,
  importedAt = FIRST_DATE,
  updatedAt = FIRST_DATE,
  lastOpenedAt = null,
}: {
  readonly id: BookId
  readonly title: string
  readonly author?: string | null
  readonly originalFileName: string
  readonly fileSizeBytes: number
  readonly totalPages: number
  readonly pdfFingerprint: string | null
  readonly importedAt?: IsoDateTime
  readonly updatedAt?: IsoDateTime
  readonly lastOpenedAt?: IsoDateTime | null
}): Book {
  return {
    id,
    title,
    author,
    originalFileName,
    fileSizeBytes,
    mimeType: 'application/pdf',
    totalPages,
    pdfFingerprint,
    importedAt,
    updatedAt,
    lastOpenedAt,
  }
}

describe(
  'IndexedDbBookRepository',
  () => {
    beforeEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    afterEach(
      async () => {
        await deleteTestDatabase()
      },
    )

    it(
      'salva e recupera um livro pelo identificador',
      async () => {
        const repository =
          new IndexedDbBookRepository()

        const book =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Primeiro livro',
            author: 'Autor de teste',
            originalFileName: 'primeiro-livro.pdf',
            fileSizeBytes: 1024,
            totalPages: 120,
            pdfFingerprint: FIRST_FINGERPRINT,
          })

        await repository.save(book)

        expect(
          await repository.findById(
            FIRST_BOOK_ID,
          ),
        ).toEqual(book)
      },
    )

    it(
      'retorna null ao buscar um livro inexistente pelo identificador',
      async () => {
        const repository =
          new IndexedDbBookRepository()

        expect(
          await repository.findById(
            FIRST_BOOK_ID,
          ),
        ).toBeNull()
      },
    )

    it(
      'atualiza um livro existente ao salvar o mesmo identificador',
      async () => {
        const repository =
          new IndexedDbBookRepository()

        const originalBook =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Título original',
            originalFileName: 'livro.pdf',
            fileSizeBytes: 2048,
            totalPages: 80,
            pdfFingerprint: FIRST_FINGERPRINT,
          })

        await repository.save(
          originalBook,
        )

        const updatedBook:
          Book = {
            ...originalBook,
            title: 'Título atualizado',
            author: 'Novo autor',
            totalPages: 82,
            updatedAt: UPDATED_DATE,
            lastOpenedAt: UPDATED_DATE,
          }

        await repository.save(
          updatedBook,
        )

        expect(
          await repository.findById(
            FIRST_BOOK_ID,
          ),
        ).toEqual(
          updatedBook,
        )
      },
    )

    it(
      'localiza um livro pelo fingerprint do PDF',
      async () => {
        const repository =
          new IndexedDbBookRepository()

        const book =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Livro com fingerprint',
            originalFileName: 'fingerprint.pdf',
            fileSizeBytes: 4096,
            totalPages: 45,
            pdfFingerprint: FIRST_FINGERPRINT,
          })

        await repository.save(book)

        expect(
          await repository
            .findByPdfFingerprint(
              `  ${FIRST_FINGERPRINT}  `,
            ),
        ).toEqual(book)
      },
    )

    it(
      'retorna null ao buscar fingerprint vazio',
      async () => {
        const repository =
          new IndexedDbBookRepository()

        expect(
          await repository
            .findByPdfFingerprint(
              '   ',
            ),
        ).toBeNull()
      },
    )

    it(
      'retorna null quando nenhum livro possui o fingerprint informado',
      async () => {
        const repository =
          new IndexedDbBookRepository()

        await repository.save(
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Livro existente',
            originalFileName: 'existente.pdf',
            fileSizeBytes: 8192,
            totalPages: 60,
            pdfFingerprint: FIRST_FINGERPRINT,
          }),
        )

        expect(
          await repository
            .findByPdfFingerprint(
              'fingerprint-inexistente',
            ),
        ).toBeNull()
      },
    )

    it(
      'lista todos os livros salvos',
      async () => {
        const repository =
          new IndexedDbBookRepository()

        const firstBook =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Primeiro livro',
            originalFileName: 'primeiro.pdf',
            fileSizeBytes: 1024,
            totalPages: 10,
            pdfFingerprint: FIRST_FINGERPRINT,
          })

        const secondBook =
          createBook({
            id: SECOND_BOOK_ID,
            title: 'Segundo livro',
            author: 'Segundo autor',
            originalFileName: 'segundo.pdf',
            fileSizeBytes: 2048,
            totalPages: 20,
            pdfFingerprint: SECOND_FINGERPRINT,
            updatedAt: UPDATED_DATE,
          })

        await repository.save(firstBook)
        await repository.save(secondBook)

        const books =
          await repository.findAll()

        expect(
          books
            .map(
              (book) =>
                book.id,
            )
            .sort(),
        ).toEqual(
          [
            FIRST_BOOK_ID,
            SECOND_BOOK_ID,
          ].sort(),
        )
      },
    )

    it(
      'exclui somente o livro solicitado',
      async () => {
        const repository =
          new IndexedDbBookRepository()

        const deletedBook =
          createBook({
            id: FIRST_BOOK_ID,
            title: 'Livro que será excluído',
            originalFileName: 'excluir.pdf',
            fileSizeBytes: 3072,
            totalPages: 30,
            pdfFingerprint: FIRST_FINGERPRINT,
          })

        const preservedBook =
          createBook({
            id: SECOND_BOOK_ID,
            title: 'Livro que será preservado',
            originalFileName: 'preservar.pdf',
            fileSizeBytes: 6144,
            totalPages: 40,
            pdfFingerprint: SECOND_FINGERPRINT,
          })

        await repository.save(
          deletedBook,
        )

        await repository.save(
          preservedBook,
        )

        await repository.deleteById(
          FIRST_BOOK_ID,
        )

        expect(
          await repository.findById(
            FIRST_BOOK_ID,
          ),
        ).toBeNull()

        expect(
          await repository.findById(
            SECOND_BOOK_ID,
          ),
        ).toEqual(
          preservedBook,
        )
      },
    )
  },
)