function validateFileName(
  fileName: string,
): string {
  const normalizedFileName =
    fileName.trim()

  if (
    normalizedFileName.length === 0
  ) {
    throw new Error(
      'O nome do arquivo para download é inválido.',
    )
  }

  return normalizedFileName
}

export function downloadBlob(
  blob: Blob,
  fileName: string,
): void {
  const normalizedFileName =
    validateFileName(fileName)

  const objectUrl =
    URL.createObjectURL(blob)

  const downloadLink =
    document.createElement('a')

  downloadLink.href = objectUrl
  downloadLink.download =
    normalizedFileName
  downloadLink.style.display = 'none'

  document.body.append(
    downloadLink,
  )

  try {
    downloadLink.click()
  } finally {
    downloadLink.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(
        objectUrl,
      )
    }, 0)
  }
}