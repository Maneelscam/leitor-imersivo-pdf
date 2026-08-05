import type {
  AnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  AnnotationRepository,
} from '@/repositories/contracts/AnnotationRepository'

export class DeleteAnnotationController {
  constructor(
    private readonly annotationRepository:
      AnnotationRepository,
  ) {}

  async execute(
    annotationId: AnnotationId,
  ): Promise<void> {
    const existingAnnotation =
      await this.annotationRepository.findById(
        annotationId,
      )

    if (existingAnnotation === null) {
      return
    }

    await this.annotationRepository.deleteById(
      annotationId,
    )
  }
}