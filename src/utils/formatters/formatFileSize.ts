const BYTES_PER_UNIT = 1024

const FILE_SIZE_UNITS = [
  'B',
  'KB',
  'MB',
  'GB',
  'TB',
] as const

const decimalFormatter = new Intl.NumberFormat(
  'pt-BR',
  {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
)

function isValidFileSize(
  fileSizeBytes: number,
): boolean {
  return (
    Number.isFinite(fileSizeBytes) &&
    fileSizeBytes >= 0
  )
}

export function formatFileSize(
  fileSizeBytes: number,
): string {
  if (!isValidFileSize(fileSizeBytes)) {
    return 'Tamanho desconhecido'
  }

  if (fileSizeBytes < BYTES_PER_UNIT) {
    return `${Math.trunc(fileSizeBytes)} B`
  }

  const unitIndex = Math.min(
    Math.floor(
      Math.log(fileSizeBytes) /
        Math.log(BYTES_PER_UNIT),
    ),
    FILE_SIZE_UNITS.length - 1,
  )

  const convertedFileSize =
    fileSizeBytes /
    BYTES_PER_UNIT ** unitIndex

  const unit = FILE_SIZE_UNITS[unitIndex]

  if (unit === undefined) {
    return 'Tamanho desconhecido'
  }

  return `${decimalFormatter.format(
    convertedFileSize,
  )} ${unit}`
}