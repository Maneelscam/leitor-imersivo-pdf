declare const collectionIdBrand:
  unique symbol

export type CollectionId =
  string & {
    readonly [collectionIdBrand]:
      'CollectionId'
  }

const COLLECTION_ID_PREFIX =
  'collection_'

export function createCollectionId():
  CollectionId {
  return `${COLLECTION_ID_PREFIX}${crypto.randomUUID()}` as CollectionId
}

export function parseCollectionId(
  value: string,
): CollectionId {
  const normalizedValue =
    value.trim()

  if (
    !normalizedValue.startsWith(
      COLLECTION_ID_PREFIX,
    )
  ) {
    throw new Error(
      'Identificador de coleção inválido.',
    )
  }

  if (
    normalizedValue.length <=
    COLLECTION_ID_PREFIX.length
  ) {
    throw new Error(
      'Identificador de coleção incompleto.',
    )
  }

  return normalizedValue as CollectionId
}

export function isCollectionId(
  value: unknown,
): value is CollectionId {
  return (
    typeof value === 'string' &&
    value.startsWith(
      COLLECTION_ID_PREFIX,
    ) &&
    value.length >
      COLLECTION_ID_PREFIX.length
  )
}
