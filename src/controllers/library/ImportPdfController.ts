import type { ImportedBookData } from '@/models/dtos/ImportedBookData'
import {
  PdfImportWarningCode,
  type PdfImportResult,
} from '@/models/dtos/PdfImportResult'
import type { Book } from '@/models/entities/Book'
import type { BookCover } from '@/models/entities/BookCover'
import type { BookFile } from '@/models/entities/BookFile'
import { createBookId } from '@/models/value-objects/BookId'
import { createIsoDateTime } from '@/models/value-objects/IsoDateTime'
import type { BookRepository } from '@/repositories/contracts/BookRepository'
import type { LibraryTransactionRepository } from '@/repositories/contracts/LibraryTransactionRepository'
import type { PdfCoverGenerationService } from '@/services/cover/PdfCoverGenerationService'
import type { FileHashService } from '@/services/file/FileHashService'
import type { PdfFileValidationService } from '@/services/file/PdfFileValidationService'
import type { PdfMetadataService } from '@/services/metadata/PdfMetadataService'
import type { PdfTitleResolutionService } from '@/services/metadata/PdfTitleResolutionService'
import type {
  LoadedPdfDocument,
  PdfDocumentService,
} from '@/services/pdf/PdfDocumentService'
import {
  PdfImportError,
  PdfImportErrorCode,
} from '@/utils/errors/PdfImportError'

export interface ImportPdfCommand {
  readonly file: File
  readonly password?: string
}

export interface ImportPdfControllerDependencies {
  readonly fileValidationService: PdfFileValidationService
  readonly fileHashService: FileHashService
  readonly pdfDocumentService: PdfDocumentService
  readonly pdfMetadataService: PdfMetadataService
  readonly titleResolutionService: PdfTitleResolutionService
  readonly coverGenerationService: PdfCoverGenerationService

  readonly bookRepository: BookRepository
  readonly libraryTransactionRepository: LibraryTransactionRepository
}

function isConstraintError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'ConstraintError'
  )
}

function validateTotalPages(totalPages: number): void {
  if (
    !Number.isInteger(totalPages) ||
    totalPages <= 0
  ) {
    throw new PdfImportError(
      PdfImportErrorCode.INVALID_PAGE_COUNT,
      'O documento PDF não possui uma quantidade válida de páginas.',
    )
  }
}

function createBookFile(
  bookId: Book['id'],
  file: File,
  importedAt: Book['importedAt'],
): BookFile {
  return {
    bookId,
    file,
    storedAt: importedAt,
  }
}

async function createBookCover(
  bookId: Book['id'],
  importedAt: Book['importedAt'],
  loadedDocument: LoadedPdfDocument,
  coverGenerationService: PdfCoverGenerationService,
): Promise<BookCover> {
  const generatedCover = await coverGenerationService.generate(
    loadedDocument.document,
  )

  return {
    bookId,
    image: generatedCover.image,
    mimeType: generatedCover.mimeType,
    width: generatedCover.width,
    height: generatedCover.height,
    generatedAt: importedAt,
  }
}

export class ImportPdfController {
  constructor(
    private readonly dependencies: ImportPdfControllerDependencies,
  ) {}

  async execute(
    command: ImportPdfCommand,
  ): Promise<PdfImportResult> {
    const {
      fileValidationService,
      fileHashService,
      pdfDocumentService,
      pdfMetadataService,
      titleResolutionService,
      coverGenerationService,
      bookRepository,
      libraryTransactionRepository,
    } = this.dependencies

    await fileValidationService.validate(command.file)

    const fileHash = await fileHashService.generate(command.file)

    let existingBook: Book | null

    try {
      existingBook =
        await bookRepository.findByPdfFingerprint(fileHash)
    } catch (error) {
      throw new PdfImportError(
        PdfImportErrorCode.STORAGE_FAILED,
        'Não foi possível consultar a biblioteca local.',
        {
          cause: error,
        },
      )
    }

    if (existingBook !== null) {
      throw new PdfImportError(
        PdfImportErrorCode.DUPLICATE_DOCUMENT,
        'Este documento PDF já está presente na biblioteca.',
      )
    }

    const openOptions =
      command.password === undefined
        ? {}
        : {
            password: command.password,
          }

    let loadedDocument: LoadedPdfDocument | null = null
    let importedBook: Book | null = null
    let wasStoredSuccessfully = false

    const warnings: PdfImportWarningCode[] = []

    try {
      loadedDocument = await pdfDocumentService.open(
        command.file,
        openOptions,
      )

      const metadata = await pdfMetadataService.extract(
        loadedDocument.document,
      )

      validateTotalPages(metadata.totalPages)

      const bookId = createBookId()
      const importedAt = createIsoDateTime()

      const book: Book = {
        id: bookId,
        title: titleResolutionService.resolve(
          metadata.title,
          command.file.name,
        ),
        author: metadata.author,
        originalFileName: command.file.name,
        fileSizeBytes: command.file.size,
        mimeType: 'application/pdf',
        totalPages: metadata.totalPages,
        pdfFingerprint: fileHash,
        importedAt,
        updatedAt: importedAt,
        lastOpenedAt: null,
      }

      const bookFile = createBookFile(
        bookId,
        command.file,
        importedAt,
      )

      let bookCover: BookCover | null = null

      try {
        bookCover = await createBookCover(
          bookId,
          importedAt,
          loadedDocument,
          coverGenerationService,
        )
      } catch {
        warnings.push(
          PdfImportWarningCode.COVER_GENERATION_FAILED,
        )
      }

      const importedBookData: ImportedBookData = {
        book,
        bookFile,
        bookCover,
      }

      try {
        await libraryTransactionRepository.saveImportedBook(
          importedBookData,
        )
      } catch (error) {
        if (isConstraintError(error)) {
          throw new PdfImportError(
            PdfImportErrorCode.DUPLICATE_DOCUMENT,
            'Este documento PDF já está presente na biblioteca.',
            {
              cause: error,
            },
          )
        }

        throw new PdfImportError(
          PdfImportErrorCode.STORAGE_FAILED,
          'Não foi possível salvar o documento na biblioteca local.',
          {
            cause: error,
          },
        )
      }

      importedBook = book
      wasStoredSuccessfully = true
    } finally {
      if (loadedDocument !== null) {
        try {
          await loadedDocument.close()
        } catch {
          if (wasStoredSuccessfully) {
            warnings.push(
              PdfImportWarningCode.DOCUMENT_CLEANUP_FAILED,
            )
          }
        }
      }
    }

    if (importedBook === null) {
      throw new PdfImportError(
        PdfImportErrorCode.STORAGE_FAILED,
        'A importação não foi concluída corretamente.',
      )
    }

    return {
      book: importedBook,
      warnings,
    }
  }
}