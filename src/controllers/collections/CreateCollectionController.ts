import type {
  Collection,
} from '@/models/entities/Collection'
import {
  createCollectionId,
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

export interface CreateCollectionCommand {
  readonly name: string
  readonly description: string | null
}

export interface CreateCollectionControllerDependencies {
  readonly collectionRepository:
    CollectionRepository

  readonly normalizationService:
    CollectionNormalizationService
}

export class CreateCollectionController {
  constructor(
    private readonly dependencies:
      CreateCollectionControllerDependencies,
  ) {}

  async execute(
    command: CreateCollectionCommand,
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

    let duplicate: Collection | null

    try {
      duplicate =
        await collectionRepository
          .findByNormalizedName(
            normalized.normalizedName,
          )
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.LOAD_FAILED,
        'Não foi possível verificar o nome da coleção.',
        {
          cause: error,
        },
      )
    }

    if (duplicate !== null) {
      throw new CollectionError(
        CollectionErrorCode.DUPLICATE_NAME,
        'Já existe uma coleção com esse nome.',
      )
    }

    const now =
      createIsoDateTime()

    const collection: Collection = {
      id:
        createCollectionId(),

      name:
        normalized.name,

      normalizedName:
        normalized.normalizedName,

      description:
        normalized.description,

      createdAt: now,
      updatedAt: now,
    }

    try {
      await collectionRepository.save(
        collection,
      )
    } catch (error) {
      throw new CollectionError(
        CollectionErrorCode.SAVE_FAILED,
        'Não foi possível criar a coleção.',
        {
          cause: error,
        },
      )
    }

    return collection
  }
}
