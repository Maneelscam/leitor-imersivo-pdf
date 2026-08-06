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
  ImportedBookData,
} from '@/models/dtos/ImportedBookData'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import {
  IndexedDbLibraryBackupRepository,
} from '@/repositories/indexed-db/IndexedDbLibraryBackupRepository'
import {
  IndexedDbLibraryTransactionRepository,
} from '@/repositories/indexed-db/IndexedDbLibraryTransactionRepository'

const FIRST_BOOK_ID =
  'livro-importado-principal' as BookId

const SECOND_BOOK_ID =
  'livro-importado-secundario' as BookId

const TEST_DATE =
  '2026-08-06T19:00:00.000Z' as IsoDateTime

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

function createImportedBookData({
  bookId,
  pdfFingerprint,
  marker,
  withCover,
}: {
  readonly bookId: BookId
  readonly pdfFingerprint: string
  readonly marker: number
  readonly withCover: boolean
}): ImportedBookData {
  const pdfBytes =
    new Uint8Array([
      37,
      80,
      68,
      70,
      45,
      marker,
    ])

  const pdfFile =
    new Blob(
      [
        pdfBytes,
      ],
      {
        type:
          'application/pdf',
      },
    )

  const coverBytes =
    new Uint8Array([
      82,
      73,
      70,
      70,
      marker,
    ])

  return {
    book: {
      id:
        bookId,

      title:
        `Livro importado ${marker}`,

      author:
        `Autor ${marker}`,

      originalFileName:
        `livro-importado-${marker}.pdf`,

      fileSizeBytes:
        pdfFile.size,

      mimeType:
        'application/pdf',

      totalPages:
        10 + marker,

      pdfFingerprint,

      importedAt:
        TEST_DATE,

      updatedAt:
        TEST_DATE,

      lastOpenedAt: null,
    },

    bookFile: {
      bookId,

      file:
        pdfFile,

      storedAt:
        TEST_DATE,
    },

    bookCover:
      withCover
        ? {
            bookId,

            image: new Blob(
              [
                coverBytes,
              ],
              {
                type:
                  'image/webp',
              },
            ),

            mimeType:
              'image/webp',

            width: 320,
            height: 480,

            generatedAt:
              TEST_DATE,
          }
        : null,
  }
}

describe(
  'IndexedDbLibraryTransactionRepository.saveImportedBook',
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
      'salva o livro, o PDF e a capa em uma única importação',
      async () => {
        const importedData =
          createImportedBookData({
            bookId:
              FIRST_BOOK_ID,

            pdfFingerprint:
              'fingerprint-importacao-com-capa',

            marker: 1,

            withCover: true,
          })

        const transactionRepository =
          new IndexedDbLibraryTransactionRepository()

        const backupRepository =
          new IndexedDbLibraryBackupRepository()

        await transactionRepository
          .saveImportedBook(
            importedData,
          )

        const snapshot =
          await backupRepository
            .createSnapshot()

        expect(
          snapshot.books,
        ).toEqual([
          importedData.book,
        ])

        expect(
          snapshot.bookFiles,
        ).toHaveLength(1)

        const storedBookFile =
          snapshot.bookFiles[0]

        expect(
          storedBookFile,
        ).toBeDefined()

        if (
          storedBookFile === undefined
        ) {
          throw new Error(
            'O PDF importado não foi encontrado.',
          )
        }

        expect(
          storedBookFile.bookId,
        ).toBe(
          FIRST_BOOK_ID,
        )

        expect(
          [
            ...new Uint8Array(
              await storedBookFile
                .file
                .arrayBuffer(),
            ),
          ],
        ).toEqual([
          37,
          80,
          68,
          70,
          45,
          1,
        ])

        expect(
          snapshot.bookCovers,
        ).toHaveLength(1)

        const storedBookCover =
          snapshot.bookCovers[0]

        expect(
          storedBookCover,
        ).toBeDefined()

        if (
          storedBookCover === undefined
        ) {
          throw new Error(
            'A capa importada não foi encontrada.',
          )
        }

        expect(
          storedBookCover.bookId,
        ).toBe(
          FIRST_BOOK_ID,
        )

        expect(
          [
            ...new Uint8Array(
              await storedBookCover
                .image
                .arrayBuffer(),
            ),
          ],
        ).toEqual([
          82,
          73,
          70,
          70,
          1,
        ])
      },
    )

    it(
      'salva o livro e o PDF quando a importação não possui capa',
      async () => {
        const importedData =
          createImportedBookData({
            bookId:
              FIRST_BOOK_ID,

            pdfFingerprint:
              'fingerprint-importacao-sem-capa',

            marker: 2,

            withCover: false,
          })

        const transactionRepository =
          new IndexedDbLibraryTransactionRepository()

        const backupRepository =
          new IndexedDbLibraryBackupRepository()

        await transactionRepository
          .saveImportedBook(
            importedData,
          )

        const snapshot =
          await backupRepository
            .createSnapshot()

        expect(
          snapshot.books,
        ).toEqual([
          importedData.book,
        ])

        expect(
          snapshot.bookFiles,
        ).toHaveLength(1)

        expect(
          snapshot.bookCovers,
        ).toEqual([])
      },
    )

    it(
      'desfaz toda a transação quando o fingerprint do PDF já existe',
      async () => {
        const sharedFingerprint =
          'fingerprint-duplicado'

        const firstImport =
          createImportedBookData({
            bookId:
              FIRST_BOOK_ID,

            pdfFingerprint:
              sharedFingerprint,

            marker: 3,

            withCover: true,
          })

        const conflictingImport =
          createImportedBookData({
            bookId:
              SECOND_BOOK_ID,

            pdfFingerprint:
              sharedFingerprint,

            marker: 4,

            withCover: true,
          })

        const transactionRepository =
          new IndexedDbLibraryTransactionRepository()

        const backupRepository =
          new IndexedDbLibraryBackupRepository()

        await transactionRepository
          .saveImportedBook(
            firstImport,
          )

        await expect(
          transactionRepository
            .saveImportedBook(
              conflictingImport,
            ),
        ).rejects.toBeDefined()

        const snapshot =
          await backupRepository
            .createSnapshot()

        expect(
          snapshot.books.map(
            (book) => book.id,
          ),
        ).toEqual([
          FIRST_BOOK_ID,
        ])

        expect(
          snapshot.bookFiles.map(
            (bookFile) =>
              bookFile.bookId,
          ),
        ).toEqual([
          FIRST_BOOK_ID,
        ])

        expect(
          snapshot.bookCovers.map(
            (bookCover) =>
              bookCover.bookId,
          ),
        ).toEqual([
          FIRST_BOOK_ID,
        ])
      },
    )
  },
)
