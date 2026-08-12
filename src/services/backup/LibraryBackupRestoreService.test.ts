import {
  strToU8,
  zipSync,
} from 'fflate'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LIBRARY_BACKUP_FORMAT,
  LIBRARY_BACKUP_FORMAT_VERSION,
  LIBRARY_BACKUP_MANIFEST_FILE_NAME,
  type LibraryBackupManifest,
} from '@/models/dtos/LibraryBackup'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  LibraryBackupManifestValidationService,
} from '@/services/backup/LibraryBackupManifestValidationService'
import {
  LibraryBackupRestoreService,
} from '@/services/backup/LibraryBackupRestoreService'
import {
  copyUint8ArrayToArrayBuffer,
} from '@/utils/binary/copyUint8ArrayToArrayBuffer'

const TEST_BOOK_ID =
  'livro-restauracao' as BookId

const TEST_DATE =
  '2026-08-12T12:00:00.000Z' as IsoDateTime

const PDF_PATH =
  'files/livro-restauracao.pdf'

const COVER_PATH =
  'covers/livro-restauracao.webp'

const PDF_BYTES =
  new Uint8Array([
    37,
    80,
    68,
    70,
    45,
    49,
    46,
    55,
  ])

const COVER_BYTES =
  new Uint8Array([
    82,
    73,
    70,
    70,
    87,
    69,
    66,
    80,
  ])

function createBook(): Book {
  return {
    id:
      TEST_BOOK_ID,

    title:
      'Livro restaurado',

    author: null,

    originalFileName:
      'livro-restaurado.pdf',

    fileSizeBytes:
      PDF_BYTES.byteLength,

    mimeType:
      'application/pdf',

    totalPages: 5,

    pdfFingerprint:
      'fingerprint-restore',

    importedAt:
      TEST_DATE,

    updatedAt:
      TEST_DATE,

    lastOpenedAt:
      TEST_DATE,
  }
}

function createManifest(
  overrides:
    Partial<LibraryBackupManifest['data']> = {},
): LibraryBackupManifest {
  return {
    format:
      LIBRARY_BACKUP_FORMAT,

    formatVersion:
      LIBRARY_BACKUP_FORMAT_VERSION,

    createdAt:
      TEST_DATE,

    application: {
      name:
        'Leitor Imersivo de PDF',

      version:
        '0.1.0',
    },

    database: {
      name:
        'leitor-imersivo-pdf',

      version: 3,
    },

    data: {
      books: [
        createBook(),
      ],

      bookFiles: [
        {
          bookId:
            TEST_BOOK_ID,

          archivePath:
            PDF_PATH,

          mimeType:
            'application/pdf',

          sizeBytes:
            PDF_BYTES.byteLength,

          storedAt:
            TEST_DATE,
        },
      ],

      bookCovers: [
        {
          bookId:
            TEST_BOOK_ID,

          archivePath:
            COVER_PATH,

          mimeType:
            'image/webp',

          sizeBytes:
            COVER_BYTES.byteLength,

          width: 320,
          height: 480,

          generatedAt:
            TEST_DATE,
        },
      ],

      readingProgress: [],

      bookmarks: [],

      annotations: [],

      readerSettings: null,

      ...overrides,
    },
  }
}

function createValidationService(
  manifest:
    LibraryBackupManifest = createManifest(),
): {
  readonly service:
    LibraryBackupManifestValidationService

  readonly validate:
    ReturnType<typeof vi.fn>
} {
  const validate =
    vi.fn().mockReturnValue(
      manifest,
    )

  return {
    service: {
      validate,
    } as unknown as LibraryBackupManifestValidationService,

    validate,
  }
}

function createZipFile(
  entries:
    Record<string, Uint8Array>,
  fileName =
    'backup.zip',
): File {
  const archiveData =
    zipSync(
      entries,
    )

  return new File(
    [
      copyUint8ArrayToArrayBuffer(
        archiveData,
      ),
    ],
    fileName,
    {
      type:
        'application/zip',
    },
  )
}

function createValidArchiveFile(
  rawManifest: unknown = {},
  fileName =
    'backup.zip',
): File {
  return createZipFile(
    {
      [LIBRARY_BACKUP_MANIFEST_FILE_NAME]:
        strToU8(
          JSON.stringify(
            rawManifest,
          ),
        ),

      [PDF_PATH]:
        PDF_BYTES,

      [COVER_PATH]:
        COVER_BYTES,
    },
    fileName,
  )
}

describe(
  'LibraryBackupRestoreService',
  () => {
    it(
      'rejeita arquivo de backup vazio',
      async () => {
        const {
          service:
            validationService,
        } =
          createValidationService()

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const archiveFile =
          new File(
            [],
            'backup.zip',
          )

        await expect(
          service.prepareRestore(
            archiveFile,
          ),
        ).rejects.toThrow(
          'O arquivo de backup selecionado está vazio.',
        )
      },
    )

    it(
      'rejeita arquivo sem extensão ZIP',
      async () => {
        const {
          service:
            validationService,
        } =
          createValidationService()

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const archiveFile =
          new File(
            [
              new ArrayBuffer(
                1,
              ),
            ],
            'backup.pdf',
          )

        await expect(
          service.prepareRestore(
            archiveFile,
          ),
        ).rejects.toThrow(
          'Selecione um arquivo de backup no formato ZIP.',
        )
      },
    )

    it(
      'converte falha de leitura do arquivo em erro de backup com causa',
      async () => {
        const readError =
          new Error(
            'falha de leitura',
          )

        const archiveFile = {
          name:
            'backup.zip',

          size: 10,

          arrayBuffer:
            vi.fn().mockRejectedValue(
              readError,
            ),
        } as unknown as File

        const {
          service:
            validationService,
        } =
          createValidationService()

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        try {
          await service.prepareRestore(
            archiveFile,
          )

          throw new Error(
            'A restauração deveria falhar.',
          )
        } catch (error) {
          expect(error).toBeInstanceOf(
            Error,
          )

          expect(error).toMatchObject({
            message:
              'Não foi possível ler o arquivo de backup selecionado.',

            cause:
              readError,
          })
        }
      },
    )

    it(
      'rejeita conteúdo que não seja um ZIP válido',
      async () => {
        const {
          service:
            validationService,
        } =
          createValidationService()

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const archiveFile =
          new File(
            [
              new Uint8Array([
                1,
                2,
                3,
                4,
              ]).buffer,
            ],
            'backup.zip',
          )

        await expect(
          service.prepareRestore(
            archiveFile,
          ),
        ).rejects.toThrow(
          'O arquivo selecionado não é um backup ZIP válido.',
        )
      },
    )

    it(
      'rejeita ZIP sem backup.json',
      async () => {
        const {
          service:
            validationService,
        } =
          createValidationService()

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const archiveFile =
          createZipFile({
            'arquivo.txt':
              strToU8(
                'conteúdo',
              ),
          })

        await expect(
          service.prepareRestore(
            archiveFile,
          ),
        ).rejects.toThrow(
          'O backup não contém o arquivo backup.json.',
        )
      },
    )

    it(
      'rejeita backup.json com JSON inválido',
      async () => {
        const {
          service:
            validationService,

          validate,
        } =
          createValidationService()

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const archiveFile =
          createZipFile({
            [LIBRARY_BACKUP_MANIFEST_FILE_NAME]:
              strToU8(
                '{',
              ),
          })

        await expect(
          service.prepareRestore(
            archiveFile,
          ),
        ).rejects.toThrow(
          'O arquivo backup.json está corrompido ou não contém um JSON válido.',
        )

        expect(
          validate,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'envia o JSON do manifesto ao serviço de validação',
      async () => {
        const rawManifest = {
          origem:
            'teste',
        }

        const manifest =
          createManifest()

        const {
          service:
            validationService,

          validate,
        } =
          createValidationService(
            manifest,
          )

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        await service.prepareRestore(
          createValidArchiveFile(
            rawManifest,
          ),
        )

        expect(
          validate,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          validate,
        ).toHaveBeenCalledWith(
          rawManifest,
        )
      },
    )

    it(
      'propaga erro do serviço de validação do manifesto',
      async () => {
        const validationError =
          new Error(
            'manifesto incompatível',
          )

        const validate =
          vi.fn().mockImplementation(
            () => {
              throw validationError
            },
          )

        const validationService = {
          validate,
        } as unknown as LibraryBackupManifestValidationService

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        await expect(
          service.prepareRestore(
            createValidArchiveFile(),
          ),
        ).rejects.toBe(
          validationError,
        )
      },
    )

    it(
      'rejeita backup quando faltam PDFs ou capas descritos no manifesto',
      async () => {
        const manifest =
          createManifest()

        const {
          service:
            validationService,
        } =
          createValidationService(
            manifest,
          )

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const archiveFile =
          createZipFile({
            [LIBRARY_BACKUP_MANIFEST_FILE_NAME]:
              strToU8(
                '{}',
              ),

            [PDF_PATH]:
              PDF_BYTES,
          })

        await expect(
          service.prepareRestore(
            archiveFile,
          ),
        ).rejects.toThrow(
          'O backup não contém todos os PDFs e capas descritos no manifesto.',
        )
      },
    )

    it(
      'rejeita binário cujo tamanho não corresponde ao manifesto',
      async () => {
        const manifest =
          createManifest()

        const {
          service:
            validationService,
        } =
          createValidationService(
            manifest,
          )

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const archiveFile =
          createZipFile({
            [LIBRARY_BACKUP_MANIFEST_FILE_NAME]:
              strToU8(
                '{}',
              ),

            [PDF_PATH]:
              new Uint8Array([
                1,
              ]),

            [COVER_PATH]:
              COVER_BYTES,
          })

        await expect(
          service.prepareRestore(
            archiveFile,
          ),
        ).rejects.toThrow(
          'O backup não contém todos os PDFs e capas descritos no manifesto.',
        )
      },
    )

    it(
      'restaura snapshot completo preservando bytes e metadados dos binários',
      async () => {
        const manifest =
          createManifest()

        const {
          service:
            validationService,
        } =
          createValidationService(
            manifest,
          )

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const result =
          await service.prepareRestore(
            createValidArchiveFile(
              {},
              'BACKUP.ZIP',
            ),
          )

        expect(
          result.manifest,
        ).toBe(
          manifest,
        )

        expect(
          result.snapshot.books,
        ).toBe(
          manifest.data.books,
        )

        expect(
          result.snapshot.readingProgress,
        ).toBe(
          manifest.data.readingProgress,
        )

        expect(
          result.snapshot.bookmarks,
        ).toBe(
          manifest.data.bookmarks,
        )

        expect(
          result.snapshot.annotations,
        ).toBe(
          manifest.data.annotations,
        )

        expect(
          result.snapshot.readerSettings,
        ).toBe(
          manifest.data.readerSettings,
        )

        expect(
          result.snapshot.bookFiles,
        ).toHaveLength(
          1,
        )

        expect(
          result.snapshot.bookCovers,
        ).toHaveLength(
          1,
        )

        const restoredFile =
          result.snapshot.bookFiles[0]

        const restoredCover =
          result.snapshot.bookCovers[0]

        expect(
          restoredFile,
        ).toBeDefined()

        expect(
          restoredCover,
        ).toBeDefined()

        if (
          restoredFile === undefined ||
          restoredCover === undefined
        ) {
          throw new Error(
            'Os binários restaurados não foram encontrados.',
          )
        }

        expect(
          restoredFile.bookId,
        ).toBe(
          TEST_BOOK_ID,
        )

        expect(
          restoredFile.storedAt,
        ).toBe(
          TEST_DATE,
        )

        expect(
          restoredFile.file.type,
        ).toBe(
          'application/pdf',
        )

        expect(
          Array.from(
            new Uint8Array(
              await restoredFile.file.arrayBuffer(),
            ),
          ),
        ).toEqual(
          Array.from(
            PDF_BYTES,
          ),
        )

        expect(
          restoredCover,
        ).toMatchObject({
          bookId:
            TEST_BOOK_ID,

          mimeType:
            'image/webp',

          width: 320,
          height: 480,

          generatedAt:
            TEST_DATE,
        })

        expect(
          restoredCover.image.type,
        ).toBe(
          'image/webp',
        )

        expect(
          Array.from(
            new Uint8Array(
              await restoredCover.image.arrayBuffer(),
            ),
          ),
        ).toEqual(
          Array.from(
            COVER_BYTES,
          ),
        )
      },
    )

    it(
      'restaura biblioteca vazia quando o manifesto não descreve binários',
      async () => {
        const manifest =
          createManifest({
            books: [],
            bookFiles: [],
            bookCovers: [],
          })

        const {
          service:
            validationService,
        } =
          createValidationService(
            manifest,
          )

        const service =
          new LibraryBackupRestoreService(
            validationService,
          )

        const archiveFile =
          createZipFile({
            [LIBRARY_BACKUP_MANIFEST_FILE_NAME]:
              strToU8(
                '{}',
              ),
          })

        const result =
          await service.prepareRestore(
            archiveFile,
          )

        expect(
          result.snapshot.books,
        ).toEqual(
          [],
        )

        expect(
          result.snapshot.bookFiles,
        ).toEqual(
          [],
        )

        expect(
          result.snapshot.bookCovers,
        ).toEqual(
          [],
        )
      },
    )
  },
)