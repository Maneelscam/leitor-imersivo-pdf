const PDF_FILE_EXTENSION_PATTERN = /\.pdf$/i
const DEFAULT_BOOK_TITLE = 'Documento sem título'

function normalizeTitle(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
}

function removePdfExtension(fileName: string): string {
  return fileName.replace(PDF_FILE_EXTENSION_PATTERN, '')
}

export class PdfTitleResolutionService {
  resolve(
    metadataTitle: string | null,
    originalFileName: string,
  ): string {
    if (metadataTitle !== null) {
      const normalizedMetadataTitle = normalizeTitle(metadataTitle)

      if (normalizedMetadataTitle.length > 0) {
        return normalizedMetadataTitle
      }
    }

    const fileNameTitle = normalizeTitle(
      removePdfExtension(originalFileName),
    )

    if (fileNameTitle.length > 0) {
      return fileNameTitle
    }

    return DEFAULT_BOOK_TITLE
  }
}