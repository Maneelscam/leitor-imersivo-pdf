import type {
  Annotation,
} from '@/models/entities/Annotation'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import type {
  AnnotationRepository,
} from '@/repositories/contracts/AnnotationRepository'

function sortAnnotationsByPosition(
  annotations:
    readonly Annotation[],
): readonly Annotation[] {
  return [...annotations].sort(
    (
      firstAnnotation,
      secondAnnotation,
    ) => {
      const pageDifference =
        firstAnnotation.pageNumber -
        secondAnnotation.pageNumber

      if (pageDifference !== 0) {
        return pageDifference
      }

      const offsetDifference =
        firstAnnotation.pageOffsetRatio -
        secondAnnotation.pageOffsetRatio

      if (offsetDifference !== 0) {
        return offsetDifference
      }

      return firstAnnotation.createdAt.localeCompare(
        secondAnnotation.createdAt,
      )
    },
  )
}

export class LoadAnnotationsController {
  constructor(
    private readonly annotationRepository:
      AnnotationRepository,
  ) {}

  async execute(
    bookId: BookId,
  ): Promise<readonly Annotation[]> {
    const annotations =
      await this.annotationRepository
        .findByBookId(
          bookId,
        )

    return sortAnnotationsByPosition(
      annotations,
    )
  }
}