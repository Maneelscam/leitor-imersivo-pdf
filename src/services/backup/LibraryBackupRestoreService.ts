import {
  strFromU8,
  unzip,
} from 'fflate'

import {
  LIBRARY_BACKUP_MANIFEST_FILE_NAME,
  type LibraryBackupBookCoverEntry,
  type LibraryBackupBookFileEntry,
  type LibraryBackupManifest,
  type LibraryBackupSnapshot,
} from '@/models/dtos/LibraryBackup'
import type {
  BookCover,
} from '@/models/entities/BookCover'
import type {
  BookFile,
} from '@/models/entities/BookFile'
import type {
  LibraryBackupManifestValidationService,
} from '@/services/backup/LibraryBackupManifestValidationService'
import {
  copyUint8ArrayToArrayBuffer,
} from '@/utils/binary/copyUint8ArrayToArrayBuffer'

const MAXIMUM_MANIFEST_SIZE_BYTES =
  5 * 1024 * 1024

type ArchiveEntries =
  Record<string, Uint8Array>

type ArchiveEntryFilter = (
  entryName: string,
  originalSize: number,
) => boolean

export interface LibraryBackupRestorePreparation {
  readonly manifest:
    LibraryBackupManifest

  readonly snapshot:
    LibraryBackupSnapshot
}

function validateArchiveFile(
  archiveFile: File,
): void {
  if (
    archiveFile.size <= 0
  ) {
    throw new Error(
      'O arquivo de backup selecionado está vazio.',
    )
  }

  if (
    !archiveFile.name
      .trim()
      .toLocaleLowerCase()
      .endsWith('.zip')
  ) {
    throw new Error(
      'Selecione um arquivo de backup no formato ZIP.',
    )
  }
}

async function fileToUint8Array(
  file: File,
): Promise<Uint8Array> {
  try {
    const arrayBuffer =
      await file.arrayBuffer()

    return new Uint8Array(
      arrayBuffer,
    )
  } catch (error) {
    throw new Error(
      'Não foi possível ler o arquivo de backup selecionado.',
      {
        cause: error,
      },
    )
  }
}

function extractArchiveEntries(
  archiveData: Uint8Array,
  filter: ArchiveEntryFilter,
): Promise<ArchiveEntries> {
  return new Promise<ArchiveEntries>(
    (resolve, reject) => {
      unzip(
        archiveData,
        {
          filter: (entry) =>
            filter(
              entry.name,
              entry.originalSize,
            ),
        },
        (
          error,
          extractedEntries,
        ) => {
          if (error !== null) {
            reject(
              new Error(
                'O arquivo selecionado não é um backup ZIP válido.',
                {
                  cause: error,
                },
              ),
            )

            return
          }

          resolve(
            extractedEntries,
          )
        },
      )
    },
  )
}

function getRequiredArchiveEntry(
  entries: ArchiveEntries,
  archivePath: string,
  description: string,
): Uint8Array {
  const entry =
    entries[archivePath]

  if (entry === undefined) {
    throw new Error(
      `O backup não contém ${description}.`,
    )
  }

  return entry
}

function parseManifestJson(
  manifestData: Uint8Array,
): unknown {
  try {
    const manifestText =
      strFromU8(
        manifestData,
      )

    return JSON.parse(
      manifestText,
    ) as unknown
  } catch (error) {
    throw new Error(
      'O arquivo backup.json está corrompido ou não contém um JSON válido.',
      {
        cause: error,
      },
    )
  }
}

async function extractAndValidateManifest(
  archiveData: Uint8Array,
  validationService:
    LibraryBackupManifestValidationService,
): Promise<LibraryBackupManifest> {
  const manifestEntries =
    await extractArchiveEntries(
      archiveData,
      (
        entryName,
        originalSize,
      ) =>
        entryName ===
          LIBRARY_BACKUP_MANIFEST_FILE_NAME &&
        originalSize > 0 &&
        originalSize <=
          MAXIMUM_MANIFEST_SIZE_BYTES,
    )

  const manifestData =
    getRequiredArchiveEntry(
      manifestEntries,
      LIBRARY_BACKUP_MANIFEST_FILE_NAME,
      'o arquivo backup.json',
    )

  if (
    manifestData.byteLength >
    MAXIMUM_MANIFEST_SIZE_BYTES
  ) {
    throw new Error(
      'O arquivo backup.json ultrapassa o tamanho permitido.',
    )
  }

  const parsedManifest =
    parseManifestJson(
      manifestData,
    )

  return validationService.validate(
    parsedManifest,
  )
}

function createExpectedBinarySizeMap(
  manifest: LibraryBackupManifest,
): ReadonlyMap<string, number> {
  const expectedSizes =
    new Map<string, number>()

  for (
    const bookFile of
    manifest.data.bookFiles
  ) {
    expectedSizes.set(
      bookFile.archivePath,
      bookFile.sizeBytes,
    )
  }

  for (
    const bookCover of
    manifest.data.bookCovers
  ) {
    expectedSizes.set(
      bookCover.archivePath,
      bookCover.sizeBytes,
    )
  }

  return expectedSizes
}

async function extractBinaryEntries(
  archiveData: Uint8Array,
  manifest: LibraryBackupManifest,
): Promise<ArchiveEntries> {
  const expectedSizes =
    createExpectedBinarySizeMap(
      manifest,
    )

  const extractedEntries =
    await extractArchiveEntries(
      archiveData,
      (
        entryName,
        originalSize,
      ) => {
        const expectedSize =
          expectedSizes.get(
            entryName,
          )

        return (
          expectedSize !== undefined &&
          originalSize ===
            expectedSize
        )
      },
    )

  if (
    Object.keys(
      extractedEntries,
    ).length !==
    expectedSizes.size
  ) {
    throw new Error(
      'O backup não contém todos os PDFs e capas descritos no manifesto.',
    )
  }

  return extractedEntries
}

function validateBinaryEntrySize(
  binaryData: Uint8Array,
  expectedSize: number,
  description: string,
): void {
  if (
    binaryData.byteLength !==
    expectedSize
  ) {
    throw new Error(
      `O tamanho de ${description} não corresponde ao manifesto do backup.`,
    )
  }
}

function createRestoredBookFile(
  entry:
    LibraryBackupBookFileEntry,
  archiveEntries:
    ArchiveEntries,
): BookFile {
  const fileData =
    getRequiredArchiveEntry(
      archiveEntries,
      entry.archivePath,
      `o PDF identificado por ${entry.bookId}`,
    )

  validateBinaryEntrySize(
    fileData,
    entry.sizeBytes,
    'um PDF',
  )

  const fileBuffer =
    copyUint8ArrayToArrayBuffer(
      fileData,
    )

  return {
    bookId: entry.bookId,

    file: new Blob(
      [fileBuffer],
      {
        type: entry.mimeType,
      },
    ),

    storedAt: entry.storedAt,
  }
}

function createRestoredBookCover(
  entry:
    LibraryBackupBookCoverEntry,
  archiveEntries:
    ArchiveEntries,
): BookCover {
  const coverData =
    getRequiredArchiveEntry(
      archiveEntries,
      entry.archivePath,
      `a capa identificada por ${entry.bookId}`,
    )

  validateBinaryEntrySize(
    coverData,
    entry.sizeBytes,
    'uma capa',
  )

  const coverBuffer =
    copyUint8ArrayToArrayBuffer(
      coverData,
    )

  return {
    bookId: entry.bookId,

    image: new Blob(
      [coverBuffer],
      {
        type: entry.mimeType,
      },
    ),

    mimeType:
      entry.mimeType,

    width: entry.width,
    height: entry.height,

    generatedAt:
      entry.generatedAt,
  }
}

function createRestoredSnapshot(
  manifest: LibraryBackupManifest,
  archiveEntries: ArchiveEntries,
): LibraryBackupSnapshot {
  const bookFiles =
    manifest.data.bookFiles.map(
      (entry) =>
        createRestoredBookFile(
          entry,
          archiveEntries,
        ),
    )

  const bookCovers =
    manifest.data.bookCovers.map(
      (entry) =>
        createRestoredBookCover(
          entry,
          archiveEntries,
        ),
    )

  return {
    books:
      manifest.data.books,

    bookFiles,

    bookCovers,

    readingProgress:
      manifest.data.readingProgress,

    bookmarks:
      manifest.data.bookmarks,

    annotations:
      manifest.data.annotations,

    readerSettings:
      manifest.data.readerSettings,
  }
}

export class LibraryBackupRestoreService {
  constructor(
    private readonly manifestValidationService:
      LibraryBackupManifestValidationService,
  ) {}

  async prepareRestore(
    archiveFile: File,
  ): Promise<LibraryBackupRestorePreparation> {
    validateArchiveFile(
      archiveFile,
    )

    const archiveData =
      await fileToUint8Array(
        archiveFile,
      )

    const manifest =
      await extractAndValidateManifest(
        archiveData,
        this.manifestValidationService,
      )

    const archiveEntries =
      await extractBinaryEntries(
        archiveData,
        manifest,
      )

    const snapshot =
      createRestoredSnapshot(
        manifest,
        archiveEntries,
      )

    return {
      manifest,
      snapshot,
    }
  }
}
