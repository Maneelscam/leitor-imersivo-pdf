import type { PDFDocumentProxy } from 'pdfjs-dist'

import type { PdfDocumentMetadata } from '@/models/dtos/PdfDocumentMetadata'

const TITLE_METADATA_KEYS = [
  'dc:title',
  'pdf:title',
] as const

const AUTHOR_METADATA_KEYS = [
  'dc:creator',
  'pdf:author',
] as const

function normalizeMetadataText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value
    .replace(/\s+/g, ' ')
    .trim()

  return normalizedValue.length > 0
    ? normalizedValue
    : null
}

function readInformationDictionaryValue(
  information: unknown,
  propertyName: string,
): string | null {
  if (
    typeof information !== 'object' ||
    information === null
  ) {
    return null
  }

  return normalizeMetadataText(
    Reflect.get(information, propertyName),
  )
}

function readXmpMetadataValue(
  metadata: unknown,
  keys: readonly string[],
): string | null {
  if (
    typeof metadata !== 'object' ||
    metadata === null
  ) {
    return null
  }

  const getMetadataValue = Reflect.get(metadata, 'get')

  if (typeof getMetadataValue !== 'function') {
    return null
  }

  for (const key of keys) {
    try {
      const value = Reflect.apply(
        getMetadataValue,
        metadata,
        [key],
      )

      const normalizedValue = normalizeMetadataText(value)

      if (normalizedValue !== null) {
        return normalizedValue
      }
    } catch {
      continue
    }
  }

  return null
}

function extractFingerprint(
  document: PDFDocumentProxy,
): string | null {
  return normalizeMetadataText(document.fingerprints[0])
}

export class PdfMetadataService {
  async extract(
    document: PDFDocumentProxy,
  ): Promise<PdfDocumentMetadata> {
    let title: string | null = null
    let author: string | null = null

    try {
      const metadataResult = await document.getMetadata()

      title =
        readInformationDictionaryValue(
          metadataResult.info,
          'Title',
        ) ??
        readXmpMetadataValue(
          metadataResult.metadata,
          TITLE_METADATA_KEYS,
        )

      author =
        readInformationDictionaryValue(
          metadataResult.info,
          'Author',
        ) ??
        readXmpMetadataValue(
          metadataResult.metadata,
          AUTHOR_METADATA_KEYS,
        )
    } catch {
      title = null
      author = null
    }

    return {
      title,
      author,
      totalPages: document.numPages,
      fingerprint: extractFingerprint(document),
    }
  }
}