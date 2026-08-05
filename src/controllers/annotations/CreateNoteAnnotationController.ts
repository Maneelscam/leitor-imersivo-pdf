import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import type {
  NoteAnnotation,
} from '@/models/entities/Annotation'
import {
  createAnnotationId,
} from '@/models/value-objects/AnnotationId'
import type {
  BookId,
} from '@/models/value-objects/BookId'
import {
  createIsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  AnnotationRepository,
} from '@/repositories/contracts/AnnotationRepository'

export interface CreateNoteAnnotationCommand {
  readonly bookId: BookId

  readonly pageNumber: number
  readonly pageOffsetRatio: number

  readonly content: string
}

function normalizePageNumber(
  pageNumber: number,
): number {
  if (
    !Number.isFinite(pageNumber) ||
    !Number.isInteger(pageNumber) ||
    pageNumber <= 0
  ) {
    throw new Error(
      'Não foi possível criar a nota porque o número da página é inválido.',
    )
  }

  return pageNumber
}

function normalizePageOffsetRatio(
  pageOffsetRatio: number,
): number {
  if (!Number.isFinite(pageOffsetRatio)) {
    return 0
  }

  return Math.min(
    Math.max(
      pageOffsetRatio,
      0,
    ),
    1,
  )
}

function normalizeContent(
  content: string,
): string {
  const normalizedContent =
    content.trim()

  if (normalizedContent.length === 0) {
    throw new Error(
      'Não foi possível criar a nota porque o conteúdo está vazio.',
    )
  }

  return normalizedContent
}

export class CreateNoteAnnotationController {
  constructor(
    private readonly annotationRepository:
      AnnotationRepository,
  ) {}

  async execute({
    bookId,
    pageNumber,
    pageOffsetRatio,
    content,
  }: CreateNoteAnnotationCommand): Promise<NoteAnnotation> {
    const currentDateTime =
      createIsoDateTime()

    const annotation:
      NoteAnnotation = {
        id: createAnnotationId(),
        bookId,

        pageNumber:
          normalizePageNumber(
            pageNumber,
          ),

        pageOffsetRatio:
          normalizePageOffsetRatio(
            pageOffsetRatio,
          ),

        type:
          AnnotationType.NOTE,

        content:
          normalizeContent(
            content,
          ),

        createdAt:
          currentDateTime,

        updatedAt:
          currentDateTime,
      }

    await this.annotationRepository.save(
      annotation,
    )

    return annotation
  }
}