import type {
  AnnotationColor,
} from '@/models/enums/AnnotationColor'
import type {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  AnnotationArea,
} from '@/models/value-objects/AnnotationArea'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  IsoDateTime,
} from '@/models/value-objects/IsoDateTime'

interface AnnotationBase {
  readonly id: AnnotationId
  readonly bookId: BookId

  readonly pageNumber: number
  readonly pageOffsetRatio: number

  readonly createdAt: IsoDateTime
  readonly updatedAt: IsoDateTime
}

export interface HighlightAnnotation
  extends AnnotationBase {
  readonly type:
    typeof AnnotationType.HIGHLIGHT

  readonly color: AnnotationColor
  readonly selectedText: string

  readonly areas:
    readonly AnnotationArea[]
}

export interface NoteAnnotation
  extends AnnotationBase {
  readonly type:
    typeof AnnotationType.NOTE

  readonly content: string
}

export type Annotation =
  | HighlightAnnotation
  | NoteAnnotation