import {
  APP_CONFIG,
} from '@/app/config/app.config'
import {
  LIBRARY_BACKUP_FORMAT,
  LIBRARY_BACKUP_FORMAT_VERSION_V1,
  LIBRARY_BACKUP_FORMAT_VERSION_V2,
  type LibraryBackupApplicationInfo,
  type LibraryBackupBookCoverEntry,
  type LibraryBackupBookFileEntry,
  type LibraryBackupDatabaseInfo,
  type LibraryBackupFormatVersion,
  type LibraryBackupManifest,
  type LibraryBackupManifestData,
} from '@/models/dtos/LibraryBackup'
import type {
  Annotation,
} from '@/models/entities/Annotation'
import type {
  Book,
} from '@/models/entities/Book'
import type {
  Bookmark,
} from '@/models/entities/Bookmark'
import type {
  ReaderSettings,
} from '@/models/entities/ReaderSettings'
import type {
  ReadingProgress,
} from '@/models/entities/ReadingProgress'
import {
  isAnnotationColor,
} from '@/models/enums/AnnotationColor'
import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import {
  PageDisplayMode,
} from '@/models/enums/PageDisplayMode'
import {
  ReadingFlowMode,
} from '@/models/enums/ReadingFlowMode'
import {
  ZoomMode,
} from '@/models/enums/ZoomMode'
import {
  isAnnotationArea,
} from '@/models/value-objects/AnnotationArea'
import {
  isIsoDateTime,
} from '@/models/value-objects/IsoDateTime'

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  )
}

function isNullableString(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    typeof value === 'string'
  )
}

function isNonNegativeInteger(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  )
}

function isPositiveInteger(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value > 0
  )
}

function isPositiveNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  )
}

function isPageOffsetRatio(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  )
}

function isValueFromCollection(
  value: unknown,
  allowedValues: readonly string[],
): boolean {
  return (
    typeof value === 'string' &&
    allowedValues.includes(value)
  )
}

function isBook(
  value: unknown,
): value is Book {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNullableString(value.author) &&
    isNonEmptyString(
      value.originalFileName,
    ) &&
    isNonNegativeInteger(
      value.fileSizeBytes,
    ) &&
    value.mimeType ===
      'application/pdf' &&
    isPositiveInteger(
      value.totalPages,
    ) &&
    isNullableString(
      value.pdfFingerprint,
    ) &&
    isIsoDateTime(
      value.importedAt,
    ) &&
    isIsoDateTime(
      value.updatedAt,
    ) &&
    (
      value.lastOpenedAt === null ||
      isIsoDateTime(
        value.lastOpenedAt,
      )
    )
  )
}

function isBookFileEntry(
  value: unknown,
): value is LibraryBackupBookFileEntry {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.bookId) &&
    isNonEmptyString(
      value.archivePath,
    ) &&
    value.mimeType ===
      'application/pdf' &&
    isNonNegativeInteger(
      value.sizeBytes,
    ) &&
    isIsoDateTime(
      value.storedAt,
    )
  )
}

function isBookCoverEntry(
  value: unknown,
): value is LibraryBackupBookCoverEntry {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.bookId) &&
    isNonEmptyString(
      value.archivePath,
    ) &&
    value.mimeType ===
      'image/webp' &&
    isNonNegativeInteger(
      value.sizeBytes,
    ) &&
    isPositiveInteger(
      value.width,
    ) &&
    isPositiveInteger(
      value.height,
    ) &&
    isIsoDateTime(
      value.generatedAt,
    )
  )
}

function isReadingProgress(
  value: unknown,
): value is ReadingProgress {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.bookId) &&
    isPositiveInteger(
      value.currentPage,
    ) &&
    isPageOffsetRatio(
      value.pageOffsetRatio,
    ) &&
    isIsoDateTime(
      value.updatedAt,
    )
  )
}

function isBookmark(
  value: unknown,
): value is Bookmark {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.bookId) &&
    isPositiveInteger(
      value.pageNumber,
    ) &&
    isPageOffsetRatio(
      value.pageOffsetRatio,
    ) &&
    isIsoDateTime(
      value.createdAt,
    )
  )
}

function hasValidAnnotationBase(
  value: Record<string, unknown>,
): boolean {
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.bookId) &&
    isPositiveInteger(
      value.pageNumber,
    ) &&
    isPageOffsetRatio(
      value.pageOffsetRatio,
    ) &&
    isIsoDateTime(
      value.createdAt,
    ) &&
    isIsoDateTime(
      value.updatedAt,
    )
  )
}

function isAnnotation(
  value: unknown,
): value is Annotation {
  if (
    !isRecord(value) ||
    !hasValidAnnotationBase(value)
  ) {
    return false
  }

  if (
    value.type ===
    AnnotationType.NOTE
  ) {
    return isNonEmptyString(
      value.content,
    )
  }

  if (
    value.type ===
    AnnotationType.HIGHLIGHT
  ) {
    return (
      isAnnotationColor(
        value.color,
      ) &&
      isNonEmptyString(
        value.selectedText,
      ) &&
      Array.isArray(
        value.areas,
      ) &&
      value.areas.length > 0 &&
      value.areas.every(
        isAnnotationArea,
      )
    )
  }

  return false
}

function isReaderSettings(
  value: unknown,
): value is ReaderSettings {
  if (!isRecord(value)) {
    return false
  }

  return (
    isValueFromCollection(
      value.pageDisplayMode,
      Object.values(
        PageDisplayMode,
      ),
    ) &&
    isValueFromCollection(
      value.readingFlowMode,
      Object.values(
        ReadingFlowMode,
      ),
    ) &&
    isValueFromCollection(
      value.zoomMode,
      Object.values(
        ZoomMode,
      ),
    ) &&
    isPositiveNumber(
      value.customZoomScale,
    ) &&
    typeof value.enableKeyboardShortcuts ===
      'boolean' &&
    typeof value.autoHideReaderControls ===
      'boolean' &&
    isIsoDateTime(
      value.updatedAt,
    )
  )
}

function isApplicationInfo(
  value: unknown,
): value is LibraryBackupApplicationInfo {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.version)
  )
}

function isDatabaseInfo(
  value: unknown,
): value is LibraryBackupDatabaseInfo {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.name) &&
    isPositiveInteger(value.version)
  )
}

function isSupportedFormatVersion(
  value: unknown,
): value is LibraryBackupFormatVersion {
  return (
    value ===
      LIBRARY_BACKUP_FORMAT_VERSION_V1 ||
    value ===
      LIBRARY_BACKUP_FORMAT_VERSION_V2
  )
}

function normalizeAnnotations(
  value: Record<string, unknown>,
  formatVersion: LibraryBackupFormatVersion,
): readonly Annotation[] | null {
  const annotations =
    value.annotations

  if (
    formatVersion ===
      LIBRARY_BACKUP_FORMAT_VERSION_V1 &&
    annotations === undefined
  ) {
    return []
  }

  if (
    !Array.isArray(annotations) ||
    !annotations.every(
      isAnnotation,
    )
  ) {
    return null
  }

  return annotations
}

function normalizeManifestData(
  value: unknown,
  formatVersion: LibraryBackupFormatVersion,
): LibraryBackupManifestData | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    !Array.isArray(value.books) ||
    !value.books.every(isBook) ||
    !Array.isArray(value.bookFiles) ||
    !value.bookFiles.every(
      isBookFileEntry,
    ) ||
    !Array.isArray(value.bookCovers) ||
    !value.bookCovers.every(
      isBookCoverEntry,
    ) ||
    !Array.isArray(
      value.readingProgress,
    ) ||
    !value.readingProgress.every(
      isReadingProgress,
    ) ||
    !Array.isArray(value.bookmarks) ||
    !value.bookmarks.every(
      isBookmark,
    ) ||
    !(
      value.readerSettings === null ||
      isReaderSettings(
        value.readerSettings,
      )
    )
  ) {
    return null
  }

  const annotations =
    normalizeAnnotations(
      value,
      formatVersion,
    )

  if (annotations === null) {
    return null
  }

  return {
    books: value.books,
    bookFiles: value.bookFiles,
    bookCovers: value.bookCovers,

    readingProgress:
      value.readingProgress,

    bookmarks:
      value.bookmarks,

    annotations,

    readerSettings:
      value.readerSettings,
  }
}

function normalizeLibraryBackupManifest(
  value: unknown,
): LibraryBackupManifest | null {
  if (
    !isRecord(value) ||
    value.format !==
      LIBRARY_BACKUP_FORMAT ||
    !isSupportedFormatVersion(
      value.formatVersion,
    ) ||
    !isIsoDateTime(
      value.createdAt,
    ) ||
    !isApplicationInfo(
      value.application,
    ) ||
    !isDatabaseInfo(
      value.database,
    )
  ) {
    return null
  }

  const data =
    normalizeManifestData(
      value.data,
      value.formatVersion,
    )

  if (data === null) {
    return null
  }

  return {
    format:
      LIBRARY_BACKUP_FORMAT,

    formatVersion:
      value.formatVersion,

    createdAt:
      value.createdAt,

    application:
      value.application,

    database:
      value.database,

    data,
  }
}

function createExpectedPdfPath(
  bookId: string,
): string {
  return [
    'files/',
    encodeURIComponent(
      bookId.trim(),
    ),
    '.pdf',
  ].join('')
}

function createExpectedCoverPath(
  bookId: string,
): string {
  return [
    'covers/',
    encodeURIComponent(
      bookId.trim(),
    ),
    '.webp',
  ].join('')
}

function assertUniqueValues(
  values: readonly string[],
  description: string,
): void {
  const uniqueValues =
    new Set(values)

  if (
    uniqueValues.size !==
    values.length
  ) {
    throw new Error(
      `O backup contém ${description} duplicados.`,
    )
  }
}

function validateApplicationCompatibility(
  manifest: LibraryBackupManifest,
): void {
  if (
    manifest.application.name !==
    APP_CONFIG.name
  ) {
    throw new Error(
      'O arquivo selecionado não pertence ao Leitor Imersivo de PDF.',
    )
  }

  if (
    manifest.database.name !==
    APP_CONFIG.database.name
  ) {
    throw new Error(
      'O backup utiliza um banco de dados incompatível.',
    )
  }

  if (
    manifest.database.version >
    APP_CONFIG.database.version
  ) {
    throw new Error(
      'O backup foi criado por uma versão mais recente e incompatível do aplicativo.',
    )
  }
}

function validateBookRelationships(
  manifest: LibraryBackupManifest,
): void {
  const books =
    manifest.data.books

  const bookFiles =
    manifest.data.bookFiles

  const bookCovers =
    manifest.data.bookCovers

  const readingProgress =
    manifest.data.readingProgress

  const bookmarks =
    manifest.data.bookmarks

  const annotations =
    manifest.data.annotations

  assertUniqueValues(
    books.map(
      (book) => book.id,
    ),
    'identificadores de livros',
  )

  assertUniqueValues(
    bookFiles.map(
      (entry) => entry.bookId,
    ),
    'arquivos PDF',
  )

  assertUniqueValues(
    bookCovers.map(
      (entry) => entry.bookId,
    ),
    'capas',
  )

  assertUniqueValues(
    readingProgress.map(
      (progress) => progress.bookId,
    ),
    'registros de progresso',
  )

  assertUniqueValues(
    bookmarks.map(
      (bookmark) => bookmark.id,
    ),
    'identificadores de favoritos',
  )

  assertUniqueValues(
    bookmarks.map(
      (bookmark) =>
        `${bookmark.bookId}:${bookmark.pageNumber}`,
    ),
    'favoritos para a mesma página',
  )

  assertUniqueValues(
    annotations.map(
      (annotation) => annotation.id,
    ),
    'identificadores de anotações',
  )

  assertUniqueValues(
    [
      ...bookFiles.map(
        (entry) => entry.archivePath,
      ),
      ...bookCovers.map(
        (entry) => entry.archivePath,
      ),
    ],
    'caminhos internos',
  )

  const bookById =
    new Map(
      books.map(
        (book) => [
          book.id,
          book,
        ],
      ),
    )

  if (
    bookFiles.length !==
    books.length
  ) {
    throw new Error(
      'O backup não possui um arquivo PDF para cada livro.',
    )
  }

  for (
    const bookFile of
    bookFiles
  ) {
    const book =
      bookById.get(
        bookFile.bookId,
      )

    if (book === undefined) {
      throw new Error(
        'O backup contém um arquivo PDF sem livro correspondente.',
      )
    }

    if (
      bookFile.archivePath !==
      createExpectedPdfPath(
        bookFile.bookId,
      )
    ) {
      throw new Error(
        'O backup contém um caminho de PDF inválido.',
      )
    }

    if (
      bookFile.sizeBytes !==
      book.fileSizeBytes
    ) {
      throw new Error(
        `O tamanho registrado para o PDF “${book.title}” é inconsistente.`,
      )
    }
  }

  for (
    const bookCover of
    bookCovers
  ) {
    if (
      !bookById.has(
        bookCover.bookId,
      )
    ) {
      throw new Error(
        'O backup contém uma capa sem livro correspondente.',
      )
    }

    if (
      bookCover.archivePath !==
      createExpectedCoverPath(
        bookCover.bookId,
      )
    ) {
      throw new Error(
        'O backup contém um caminho de capa inválido.',
      )
    }
  }

  for (
    const progress of
    readingProgress
  ) {
    const book =
      bookById.get(
        progress.bookId,
      )

    if (book === undefined) {
      throw new Error(
        'O backup contém progresso sem livro correspondente.',
      )
    }

    if (
      progress.currentPage >
      book.totalPages
    ) {
      throw new Error(
        `O progresso de “${book.title}” aponta para uma página inexistente.`,
      )
    }
  }

  for (
    const bookmark of
    bookmarks
  ) {
    const book =
      bookById.get(
        bookmark.bookId,
      )

    if (book === undefined) {
      throw new Error(
        'O backup contém um favorito sem livro correspondente.',
      )
    }

    if (
      bookmark.pageNumber >
      book.totalPages
    ) {
      throw new Error(
        `Um favorito de “${book.title}” aponta para uma página inexistente.`,
      )
    }
  }

  for (
    const annotation of
    annotations
  ) {
    const book =
      bookById.get(
        annotation.bookId,
      )

    if (book === undefined) {
      throw new Error(
        'O backup contém uma anotação sem livro correspondente.',
      )
    }

    if (
      annotation.pageNumber >
      book.totalPages
    ) {
      throw new Error(
        `Uma anotação de “${book.title}” aponta para uma página inexistente.`,
      )
    }
  }

  const fingerprints =
    books
      .map(
        (book) =>
          book.pdfFingerprint,
      )
      .filter(
        (
          fingerprint,
        ): fingerprint is string =>
          fingerprint !== null,
      )

  assertUniqueValues(
    fingerprints,
    'identificadores de PDF',
  )
}

export class LibraryBackupManifestValidationService {
  validate(
    value: unknown,
  ): LibraryBackupManifest {
    const manifest =
      normalizeLibraryBackupManifest(
        value,
      )

    if (manifest === null) {
      throw new Error(
        'O arquivo backup.json está ausente, corrompido ou possui uma estrutura inválida.',
      )
    }

    validateApplicationCompatibility(
      manifest,
    )

    validateBookRelationships(
      manifest,
    )

    return manifest
  }
}
