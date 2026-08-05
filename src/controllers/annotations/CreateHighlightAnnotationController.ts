import {
  AnnotationType,
} from '@/models/enums/AnnotationType'
import {
  isAnnotationColor,
} from '@/models/enums/AnnotationColor'
import type {
  AnnotationColor,
} from '@/models/enums/AnnotationColor'
import type {
  HighlightAnnotation,
} from '@/models/entities/Annotation'
import {
  isAnnotationArea,
} from '@/models/value-objects/AnnotationArea'
import type {
  AnnotationArea,
} from '@/models/value-objects/AnnotationArea'
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

export interface CreateHighlightAnnotationCommand {
  readonly bookId: BookId

  readonly pageNumber: number
  readonly pageOffsetRatio: number

  readonly color: AnnotationColor
  readonly selectedText: string

  readonly areas:
    readonly AnnotationArea[]
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
      'Não foi possível criar a marcação porque o número da página é inválido.',
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

function normalizeSelectedText(
  selectedText: string,
): string {
  const normalizedText =
    selectedText
      .replace(
        /\s+/gu,
        ' ',
      )
      .trim()

  if (normalizedText.length === 0) {
    throw new Error(
      'Não foi possível criar a marcação porque nenhum texto foi selecionado.',
    )
  }

  return normalizedText
}

function normalizeAreas(
  areas: readonly AnnotationArea[],
): readonly AnnotationArea[] {
  if (areas.length === 0) {
    throw new Error(
      'Não foi possível criar a marcação porque a área selecionada é inválida.',
    )
  }

  if (
    !areas.every(
      isAnnotationArea,
    )
  ) {
    throw new Error(
      'Não foi possível criar a marcação porque uma ou mais áreas são inválidas.',
    )
  }

  return areas.map(
    (area) => ({
      left: area.left,
      bottom: area.bottom,
      right: area.right,
      top: area.top,
    }),
  )
}

export class CreateHighlightAnnotationController {
  constructor(
    private readonly annotationRepository:
      AnnotationRepository,
  ) {}

  async execute({
    bookId,
    pageNumber,
    pageOffsetRatio,
    color,
    selectedText,
    areas,
  }: CreateHighlightAnnotationCommand): Promise<HighlightAnnotation> {
    if (!isAnnotationColor(color)) {
      throw new Error(
        'Não foi possível criar a marcação porque a cor é inválida.',
      )
    }

    const currentDateTime =
      createIsoDateTime()

    const annotation:
      HighlightAnnotation = {
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
          AnnotationType.HIGHLIGHT,

        color,

        selectedText:
          normalizeSelectedText(
            selectedText,
          ),

        areas:
          normalizeAreas(
            areas,
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