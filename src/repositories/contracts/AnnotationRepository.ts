import type {
  Annotation,
} from '@/models/entities/Annotation'
import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookId,
} from '@/models/value-objects/BookId'

export interface AnnotationRepository {
  save(
    annotation: Annotation,
  ): Promise<void>

  findById(
    annotationId: AnnotationId,
  ): Promise<Annotation | null>

  findByBookId(
    bookId: BookId,
  ): Promise<readonly Annotation[]>

  findByBookAndPage(
    bookId: BookId,
    pageNumber: number,
  ): Promise<readonly Annotation[]>

  deleteById(
    annotationId: AnnotationId,
  ): Promise<void>

  deleteByBookId(
    bookId: BookId,
  ): Promise<void>
}