import type {
  AnnotationArea,
} from '@/models/value-objects/AnnotationArea'

export interface PdfTextSelection {
  readonly pageNumber: number
  readonly pageOffsetRatio: number
  readonly selectedText: string
  readonly areas: readonly AnnotationArea[]
}