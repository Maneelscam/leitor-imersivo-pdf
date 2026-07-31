export interface GeneratedPdfCover {
  readonly image: Blob
  readonly mimeType: 'image/webp'

  readonly width: number
  readonly height: number
}