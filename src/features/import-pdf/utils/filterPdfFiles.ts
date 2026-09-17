import {
  APP_CONFIG,
} from '@/app/config/app.config'

export interface PdfFileCandidate {
  readonly name: string
  readonly type: string
}

export function isPdfFileCandidate(
  file: PdfFileCandidate,
): boolean {
  const normalizedName =
    file.name.trim().toLocaleLowerCase()

  const normalizedType =
    file.type.trim().toLocaleLowerCase()

  const hasAcceptedExtension =
    APP_CONFIG.pdf.acceptedExtensions.some(
      (extension) =>
        normalizedName.endsWith(
          extension.toLocaleLowerCase(),
        ),
    )

  const hasAcceptedMimeType =
    normalizedType.length > 0 &&
    APP_CONFIG.pdf.acceptedMimeTypes.some(
      (mimeType) =>
        normalizedType ===
        mimeType.toLocaleLowerCase(),
    )

  return (
    hasAcceptedExtension ||
    hasAcceptedMimeType
  )
}

export function filterPdfFiles<
  TFile extends PdfFileCandidate,
>(
  files: readonly TFile[],
): TFile[] {
  return files.filter(
    isPdfFileCandidate,
  )
}
