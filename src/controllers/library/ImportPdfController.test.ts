import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  ImportPdfController,
  type ImportPdfControllerDependencies,
} from '@/controllers/library/ImportPdfController'
import {
  PdfImportWarningCode,
} from '@/models/dtos/PdfImportResult'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  LoadedPdfDocument,
} from '@/services/pdf/PdfDocumentService'
import {
  PdfImportError,
  PdfImportErrorCode,
} from '@/utils/errors/PdfImportError'

const FILE_HASH =
  'sha256:arquivo-de-teste'

function createFile(): File {
  return new File(
    ['%PDF-1.7 conteúdo de teste'],
    'meu-livro.pdf',
    {
      type: 'application/pdf',
    },
  )
}

function createLoadedDocument({
  closeError,
}: {
  readonly closeError?: unknown
} = {}): LoadedPdfDocument {
  const close =
    closeError === undefined
      ? vi.fn().mockResolvedValue(
          undefined,
        )
      : vi.fn().mockRejectedValue(
          closeError,
        )

  return {
    document:
      {} as PDFDocumentProxy,

    isClosed: false,

    close,
  }
}

function createExistingBook(): Book {
  const importedAt =
    '2026-08-11T16:00:00.000Z' as Book['importedAt']

  return {
    id:
      'existing-book' as BookId,

    title:
      'Livro já existente',

    author:
      null,

    originalFileName:
      'existente.pdf',

    fileSizeBytes:
      1024,

    mimeType:
      'application/pdf',

    totalPages:
      10,

    pdfFingerprint:
      FILE_HASH,

    importedAt,
    updatedAt:
      importedAt,

    lastOpenedAt:
      null,
  }
}

function createDependencies({
  loadedDocument =
    createLoadedDocument(),
}: {
  readonly loadedDocument?: LoadedPdfDocument
} = {}): {
  readonly dependencies:
    ImportPdfControllerDependencies
  readonly loadedDocument:
    LoadedPdfDocument
} {
  const dependencies =
    {
      fileValidationService: {
        validate:
          vi.fn().mockResolvedValue(
            undefined,
          ),
      },

      fileHashService: {
        generate:
          vi.fn().mockResolvedValue(
            FILE_HASH,
          ),
      },

      pdfDocumentService: {
        open:
          vi.fn().mockResolvedValue(
            loadedDocument,
          ),
      },

      pdfMetadataService: {
        extract:
          vi.fn().mockResolvedValue({
            title:
              'Título dos metadados',

            author:
              'Autor de teste',

            totalPages:
              123,

            fingerprint:
              'fingerprint-interno-pdf',
          }),
      },

      titleResolutionService: {
        resolve:
          vi.fn().mockReturnValue(
            'Título resolvido',
          ),
      },

      coverGenerationService: {
        generate:
          vi.fn().mockResolvedValue({
            image:
              new Blob(
                ['capa'],
                {
                  type:
                    'image/webp',
                },
              ),

            mimeType:
              'image/webp',

            width:
              480,

            height:
              720,
          }),
      },

      bookRepository: {
        save:
          vi.fn(),

        findById:
          vi.fn(),

        findByPdfFingerprint:
          vi.fn().mockResolvedValue(
            null,
          ),

        findAll:
          vi.fn(),

        deleteById:
          vi.fn(),
      },

      libraryTransactionRepository: {
        saveImportedBook:
          vi.fn().mockResolvedValue(
            undefined,
          ),

        deleteBookCompletely:
          vi.fn(),
      },
    } as unknown as
      ImportPdfControllerDependencies

  return {
    dependencies,
    loadedDocument,
  }
}

describe(
  'ImportPdfController',
  () => {
    it(
      'importa o PDF completo, persiste os dados e fecha o documento',
      async () => {
        const {
          dependencies,
          loadedDocument,
        } =
          createDependencies()

        const controller =
          new ImportPdfController(
            dependencies,
          )

        const file =
          createFile()

        const result =
          await controller.execute({
            file,
          })

        expect(
          dependencies
            .fileValidationService
            .validate,
        ).toHaveBeenCalledWith(
          file,
        )

        expect(
          dependencies
            .fileHashService
            .generate,
        ).toHaveBeenCalledWith(
          file,
        )

        expect(
          dependencies
            .bookRepository
            .findByPdfFingerprint,
        ).toHaveBeenCalledWith(
          FILE_HASH,
        )

        expect(
          dependencies
            .pdfDocumentService
            .open,
        ).toHaveBeenCalledWith(
          file,
          {},
        )

        expect(
          dependencies
            .pdfMetadataService
            .extract,
        ).toHaveBeenCalledWith(
          loadedDocument.document,
        )

        expect(
          dependencies
            .titleResolutionService
            .resolve,
        ).toHaveBeenCalledWith(
          'Título dos metadados',
          file.name,
        )

        expect(
          dependencies
            .coverGenerationService
            .generate,
        ).toHaveBeenCalledWith(
          loadedDocument.document,
        )

        expect(
          dependencies
            .libraryTransactionRepository
            .saveImportedBook,
        ).toHaveBeenCalledTimes(
          1,
        )

        const savedData =
          vi.mocked(
            dependencies
              .libraryTransactionRepository
              .saveImportedBook,
          ).mock.calls[0]?.[0]

        expect(
          savedData,
        ).toBeDefined()

        expect(
          savedData?.book,
        ).toMatchObject({
          title:
            'Título resolvido',

          author:
            'Autor de teste',

          originalFileName:
            file.name,

          fileSizeBytes:
            file.size,

          mimeType:
            'application/pdf',

          totalPages:
            123,

          pdfFingerprint:
            FILE_HASH,

          lastOpenedAt:
            null,
        })

        expect(
          savedData?.bookFile.file,
        ).toBe(
          file,
        )

        expect(
          savedData?.bookFile.bookId,
        ).toBe(
          savedData?.book.id,
        )

        expect(
          savedData?.bookFile.storedAt,
        ).toBe(
          savedData?.book.importedAt,
        )

        expect(
          savedData?.bookCover,
        ).toMatchObject({
          bookId:
            savedData?.book.id,

          mimeType:
            'image/webp',

          width:
            480,

          height:
            720,

          generatedAt:
            savedData?.book.importedAt,
        })

        expect(
          result.book,
        ).toEqual(
          savedData?.book,
        )

        expect(
          result.warnings,
        ).toEqual([])

        expect(
          loadedDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'encaminha a senha informada para a abertura do PDF',
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const controller =
          new ImportPdfController(
            dependencies,
          )

        const file =
          createFile()

        await controller.execute({
          file,
          password:
            'senha-secreta',
        })

        expect(
          dependencies
            .pdfDocumentService
            .open,
        ).toHaveBeenCalledWith(
          file,
          {
            password:
              'senha-secreta',
          },
        )
      },
    )

    it(
      'interrompe o fluxo quando a validação do arquivo falha',
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const validationError =
          new Error(
            'arquivo inválido',
          )

        vi.mocked(
          dependencies
            .fileValidationService
            .validate,
        ).mockRejectedValue(
          validationError,
        )

        const controller =
          new ImportPdfController(
            dependencies,
          )

        await expect(
          controller.execute({
            file:
              createFile(),
          }),
        ).rejects.toBe(
          validationError,
        )

        expect(
          dependencies
            .fileHashService
            .generate,
        ).not.toHaveBeenCalled()

        expect(
          dependencies
            .pdfDocumentService
            .open,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'interrompe o fluxo quando a geração do hash falha',
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const hashError =
          new Error(
            'falha no hash',
          )

        vi.mocked(
          dependencies
            .fileHashService
            .generate,
        ).mockRejectedValue(
          hashError,
        )

        const controller =
          new ImportPdfController(
            dependencies,
          )

        await expect(
          controller.execute({
            file:
              createFile(),
          }),
        ).rejects.toBe(
          hashError,
        )

        expect(
          dependencies
            .bookRepository
            .findByPdfFingerprint,
        ).not.toHaveBeenCalled()

        expect(
          dependencies
            .pdfDocumentService
            .open,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'rejeita um documento já existente antes de abrir o PDF',
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        vi.mocked(
          dependencies
            .bookRepository
            .findByPdfFingerprint,
        ).mockResolvedValue(
          createExistingBook(),
        )

        const controller =
          new ImportPdfController(
            dependencies,
          )

        await expect(
          controller.execute({
            file:
              createFile(),
          }),
        ).rejects.toMatchObject({
          name:
            'PdfImportError',

          code:
            PdfImportErrorCode.DUPLICATE_DOCUMENT,
        })

        expect(
          dependencies
            .pdfDocumentService
            .open,
        ).not.toHaveBeenCalled()

        expect(
          dependencies
            .libraryTransactionRepository
            .saveImportedBook,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      'converte falha ao consultar duplicidade em STORAGE_FAILED',
      async () => {
        const {
          dependencies,
        } =
          createDependencies()

        const lookupError =
          new Error(
            'falha no IndexedDB',
          )

        vi.mocked(
          dependencies
            .bookRepository
            .findByPdfFingerprint,
        ).mockRejectedValue(
          lookupError,
        )

        const controller =
          new ImportPdfController(
            dependencies,
          )

        try {
          await controller.execute({
            file:
              createFile(),
          })

          throw new Error(
            'A execução deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            PdfImportError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              PdfImportErrorCode.STORAGE_FAILED,

            cause:
              lookupError,
          })
        }

        expect(
          dependencies
            .pdfDocumentService
            .open,
        ).not.toHaveBeenCalled()
      },
    )

    it.each([
      0,
      -1,
      1.5,
      Number.NaN,
    ])(
      'rejeita quantidade inválida de páginas: %s',
      async (
        totalPages,
      ) => {
        const {
          dependencies,
          loadedDocument,
        } =
          createDependencies()

        vi.mocked(
          dependencies
            .pdfMetadataService
            .extract,
        ).mockResolvedValue({
          title:
            'Título',

          author:
            null,

          totalPages,

          fingerprint:
            null,
        })

        const controller =
          new ImportPdfController(
            dependencies,
          )

        await expect(
          controller.execute({
            file:
              createFile(),
          }),
        ).rejects.toMatchObject({
          code:
            PdfImportErrorCode.INVALID_PAGE_COUNT,
        })

        expect(
          dependencies
            .libraryTransactionRepository
            .saveImportedBook,
        ).not.toHaveBeenCalled()

        expect(
          loadedDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'continua a importação sem capa e registra warning quando a geração da capa falha',
      async () => {
        const {
          dependencies,
          loadedDocument,
        } =
          createDependencies()

        vi.mocked(
          dependencies
            .coverGenerationService
            .generate,
        ).mockRejectedValue(
          new Error(
            'falha na capa',
          ),
        )

        const controller =
          new ImportPdfController(
            dependencies,
          )

        const result =
          await controller.execute({
            file:
              createFile(),
          })

        const savedData =
          vi.mocked(
            dependencies
              .libraryTransactionRepository
              .saveImportedBook,
          ).mock.calls[0]?.[0]

        expect(
          savedData?.bookCover,
        ).toBeNull()

        expect(
          result.warnings,
        ).toEqual([
          PdfImportWarningCode
            .COVER_GENERATION_FAILED,
        ])

        expect(
          loadedDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'registra warning quando o fechamento falha depois de persistir com sucesso',
      async () => {
        const loadedDocument =
          createLoadedDocument({
            closeError:
              new Error(
                'falha no fechamento',
              ),
          })

        const {
          dependencies,
        } =
          createDependencies({
            loadedDocument,
          })

        const controller =
          new ImportPdfController(
            dependencies,
          )

        const result =
          await controller.execute({
            file:
              createFile(),
          })

        expect(
          result.warnings,
        ).toEqual([
          PdfImportWarningCode
            .DOCUMENT_CLEANUP_FAILED,
        ])
      },
    )

    it(
      'converte ConstraintError da persistência em DUPLICATE_DOCUMENT e fecha o PDF',
      async () => {
        const {
          dependencies,
          loadedDocument,
        } =
          createDependencies()

        const constraintError =
          new DOMException(
            'registro duplicado',
            'ConstraintError',
          )

        vi.mocked(
          dependencies
            .libraryTransactionRepository
            .saveImportedBook,
        ).mockRejectedValue(
          constraintError,
        )

        const controller =
          new ImportPdfController(
            dependencies,
          )

        try {
          await controller.execute({
            file:
              createFile(),
          })

          throw new Error(
            'A execução deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            PdfImportError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              PdfImportErrorCode.DUPLICATE_DOCUMENT,

            cause:
              constraintError,
          })
        }

        expect(
          loadedDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'converte erro genérico da persistência em STORAGE_FAILED e fecha o PDF',
      async () => {
        const {
          dependencies,
          loadedDocument,
        } =
          createDependencies()

        const storageError =
          new Error(
            'falha ao salvar',
          )

        vi.mocked(
          dependencies
            .libraryTransactionRepository
            .saveImportedBook,
        ).mockRejectedValue(
          storageError,
        )

        const controller =
          new ImportPdfController(
            dependencies,
          )

        try {
          await controller.execute({
            file:
              createFile(),
          })

          throw new Error(
            'A execução deveria falhar.',
          )
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            PdfImportError,
          )

          expect(
            error,
          ).toMatchObject({
            code:
              PdfImportErrorCode.STORAGE_FAILED,

            cause:
              storageError,
          })
        }

        expect(
          loadedDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )
      },
    )

    it(
      'preserva o erro principal quando o fechamento também falha antes da persistência',
      async () => {
        const loadedDocument =
          createLoadedDocument({
            closeError:
              new Error(
                'falha no fechamento',
              ),
          })

        const {
          dependencies,
        } =
          createDependencies({
            loadedDocument,
          })

        const metadataError =
          new Error(
            'falha nos metadados',
          )

        vi.mocked(
          dependencies
            .pdfMetadataService
            .extract,
        ).mockRejectedValue(
          metadataError,
        )

        const controller =
          new ImportPdfController(
            dependencies,
          )

        await expect(
          controller.execute({
            file:
              createFile(),
          }),
        ).rejects.toBe(
          metadataError,
        )

        expect(
          loadedDocument.close,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          dependencies
            .libraryTransactionRepository
            .saveImportedBook,
        ).not.toHaveBeenCalled()
      },
    )
  },
)