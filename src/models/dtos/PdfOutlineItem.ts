export interface PdfOutlineItem {
  readonly id: string

  readonly title: string

  readonly pageNumber: number | null

  readonly children:
    readonly PdfOutlineItem[]
}