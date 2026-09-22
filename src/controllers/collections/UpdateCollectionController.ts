import type {
  Collection,
} from '@/models/entities/Collection'
import type {
  CollectionId,
} from '@/models/value-objects/CollectionId'
import {
  createIsoDateTime,
} from '@/models/value-objects/IsoDateTime'
import type {
  CollectionRepository,
} from '@/repositories/contracts/CollectionRepository'
import type {
  CollectionNormalizationService,
} from '@/services/collections/CollectionNormalizationService'
import {
  CollectionError,
  CollectionErrorCode,
} from '@/utils/errors/CollectionError'

export interface UpdateCollectionCommand {
  readonly collectionId:
    CollectionId

  readonly name: string

  readonly description:
    string | null
}

export interface UpdateCollectionControllerDependencies {
  readonly collectionRepository:
    CollectionRepository

  readonly normalizationService:
    CollectionNormalizationService
}

export class UpdateCollectionController {
  constructor(
    private readonly dependencies:
      UpdateCollectionControllerDependencies,
  ) {}

  async execute(
    command: UpdateCollectionCommand,
  ): Promise<Collection> {
    const {
      collectionRepository,
      normalizationService,
    } = this.dependencies

    const normalized =
      normalizationService.normalize(
        command.name,
        command.description,
      )

    let existing: Collection | null
    let duplicate: Collection | null

    try {
      ;[
        existing,
        duplicate,
      ] = await Promise.all([
        collectionRepository.findById(
          command.collectionId,
        ),
        collectionRepository
          .findByNormalizedName(
            normalized.normalizedName,
          ),
      ])
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.LOAD_FAILED,
        'Não foi possível consultar a coleção.',
        {
          cause: error,
        },
      )
    }

    if (existing === null) {
      throw new CollectionError(
        CollectionErrorCode.NOT_FOUND,
        'A coleção selecionada não foi encontrada.',
      )
    }

    if (
      duplicate !== null &&
      duplicate.id !== existing.id
    ) {
      throw new CollectionError(
        CollectionErrorCode.DUPLICATE_NAME,
        'Já existe uma coleção com esse nome.',
      )
    }

    if (
      existing.name ===
        normalized.name &&
      existing.description ===
        normalized.description
    ) {
      return existing
    }

    const updated: Collection = {
      ...existing,

      name:
        normalized.name,

      normalizedName:
        normalized.normalizedName,

      description:
        normalized.description,

      updatedAt:
        createIsoDateTime(),
    }

    try {
      await collectionRepository.save(
        updated,
      )
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.SAVE_FAILED,
        'Não foi possível atualizar a coleção.',
        {
          cause: error,
        },
      )
    }

    return updated
  }
}
