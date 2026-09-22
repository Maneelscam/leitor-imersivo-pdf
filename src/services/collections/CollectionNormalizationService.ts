import {
  CollectionError,
  CollectionErrorCode,
} from '@/utils/errors/CollectionError'

const MAXIMUM_COLLECTION_NAME_LENGTH =
  80

const MAXIMUM_COLLECTION_DESCRIPTION_LENGTH =
  240

function normalizeSpaces(
  value: string,
): string {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface NormalizedCollectionInput {
  readonly name: string
  readonly normalizedName: string
  readonly description: string | null
}

export class CollectionNormalizationService {
  normalize(
    name: string,
    description: string | null,
  ): NormalizedCollectionInput {
    const normalizedDisplayName =
      normalizeSpaces(name)

    if (
      normalizedDisplayName.length ===
      0
    ) {
      throw new CollectionError(
        CollectionErrorCode.NAME_REQUIRED,
        'Informe um nome para a coleção.',
      )
    }

    if (
      normalizedDisplayName.length >
      MAXIMUM_COLLECTION_NAME_LENGTH
    ) {
      throw new CollectionError(
        CollectionErrorCode.NAME_TOO_LONG,
        'O nome da coleção pode ter no máximo 80 caracteres.',
      )
    }

    const normalizedDescription =
      description === null
        ? null
        : normalizeSpaces(
            description,
          )

    const finalDescription =
      normalizedDescription === null ||
      normalizedDescription.length === 0
        ? null
        : normalizedDescription

    if (
      finalDescription !== null &&
      finalDescription.length >
        MAXIMUM_COLLECTION_DESCRIPTION_LENGTH
    ) {
      throw new CollectionError(
        CollectionErrorCode.DESCRIPTION_TOO_LONG,
        'A descrição da coleção pode ter no máximo 240 caracteres.',
      )
    }

    return {
      name:
        normalizedDisplayName,

      normalizedName:
        normalizedDisplayName
          .toLocaleLowerCase(
            'pt-BR',
          ),

      description:
        finalDescription,
    }
  }
}
