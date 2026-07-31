declare const isoDateTimeBrand: unique symbol

export type IsoDateTime = string & {
  readonly [isoDateTimeBrand]: 'IsoDateTime'
}

export function createIsoDateTime(date: Date = new Date()): IsoDateTime {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Não foi possível criar uma data válida.')
  }

  return date.toISOString() as IsoDateTime
}

export function parseIsoDateTime(value: string): IsoDateTime {
  const normalizedValue = value.trim()
  const parsedTimestamp = Date.parse(normalizedValue)

  if (normalizedValue.length === 0 || Number.isNaN(parsedTimestamp)) {
    throw new Error('Data e horário inválidos.')
  }

  return new Date(parsedTimestamp).toISOString() as IsoDateTime
}

export function isIsoDateTime(value: unknown): value is IsoDateTime {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value))
  )
}