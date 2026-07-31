export interface PdfDocumentMetadata {
  readonly title: string | null
  readonly author: string | null

  readonly totalPages: number
  readonly fingerprint: string | null
}