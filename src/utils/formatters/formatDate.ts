import type { IsoDateTime } from '@/models/value-objects/IsoDateTime'

const dateFormatter = new Intl.DateTimeFormat(
  'pt-BR',
  {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  },
)

const dateTimeFormatter = new Intl.DateTimeFormat(
  'pt-BR',
  {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
)

function parseDate(
  value: IsoDateTime | string,
): Date | null {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

export function formatDate(
  value: IsoDateTime | string,
): string {
  const date = parseDate(value)

  if (date === null) {
    return 'Data desconhecida'
  }

  return dateFormatter.format(date)
}

export function formatDateTime(
  value: IsoDateTime | string,
): string {
  const date = parseDate(value)

  if (date === null) {
    return 'Data desconhecida'
  }

  return dateTimeFormatter.format(date)
}