declare const annotationIdBrand: unique symbol

export type AnnotationId = string & {
  readonly [annotationIdBrand]: 'AnnotationId'
}

const ANNOTATION_ID_PREFIX = 'annotation_'

export function createAnnotationId(): AnnotationId {
  return `${ANNOTATION_ID_PREFIX}${crypto.randomUUID()}` as AnnotationId
}

export function parseAnnotationId(value: string): AnnotationId {
  const normalizedValue = value.trim()

  if (!normalizedValue.startsWith(ANNOTATION_ID_PREFIX)) {
    throw new Error('Identificador de anotação inválido.')
  }

  if (normalizedValue.length <= ANNOTATION_ID_PREFIX.length) {
    throw new Error('Identificador de anotação incompleto.')
  }

  return normalizedValue as AnnotationId
}

export function isAnnotationId(
  value: unknown,
): value is AnnotationId {
  return (
    typeof value === 'string' &&
    value.startsWith(ANNOTATION_ID_PREFIX) &&
    value.length > ANNOTATION_ID_PREFIX.length
  )
}