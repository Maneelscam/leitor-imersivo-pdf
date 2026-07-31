import { APP_CONFIG } from '@/app/config/app.config'
import {
  PdfFileValidationError,
  PdfFileValidationErrorCode,
} from '@/utils/errors/PdfFileValidationError'

const PDF_HEADER_SEARCH_SIZE_BYTES = 1024
const PDF_SIGNATURE = '%PDF-'

function hasAcceptedExtension(fileName: string): boolean {
  const normalizedFileName = fileName.trim().toLowerCase()

  return APP_CONFIG.pdf.acceptedExtensions.some((extension) =>
    normalizedFileName.endsWith(extension),
  )
}

function hasAcceptedMimeType(mimeType: string): boolean {
  const normalizedMimeType = mimeType.trim().toLowerCase()

  if (normalizedMimeType.length === 0) {
    return true
  }

  return APP_CONFIG.pdf.acceptedMimeTypes.some(
    (acceptedMimeType) =>
      normalizedMimeType === acceptedMimeType,
  )
}

async function readPdfHeader(file: File): Promise<string> {
  try {
    const headerBlob = file.slice(
      0,
      PDF_HEADER_SEARCH_SIZE_BYTES,
    )

    const headerBuffer = await headerBlob.arrayBuffer()

    return new TextDecoder().decode(headerBuffer)
  } catch (error) {
    throw new PdfFileValidationError(
      PdfFileValidationErrorCode.FILE_READ_FAILED,
      'Não foi possível ler o arquivo selecionado.',
      {
        cause: error,
      },
    )
  }
}

export class PdfFileValidationService {
  async validate(file: File): Promise<void> {
    if (file.size === 0) {
      throw new PdfFileValidationError(
        PdfFileValidationErrorCode.EMPTY_FILE,
        'O arquivo selecionado está vazio.',
      )
    }

    if (!hasAcceptedExtension(file.name)) {
      throw new PdfFileValidationError(
        PdfFileValidationErrorCode.INVALID_EXTENSION,
        'O arquivo selecionado não possui a extensão .pdf.',
      )
    }

    if (!hasAcceptedMimeType(file.type)) {
      throw new PdfFileValidationError(
        PdfFileValidationErrorCode.INVALID_MIME_TYPE,
        'O tipo do arquivo selecionado não é compatível com PDF.',
      )
    }

    const header = await readPdfHeader(file)

    if (!header.includes(PDF_SIGNATURE)) {
      throw new PdfFileValidationError(
        PdfFileValidationErrorCode.INVALID_SIGNATURE,
        'O conteúdo do arquivo selecionado não corresponde a um PDF válido.',
      )
    }
  }
}