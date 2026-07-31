export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error) {
    const normalizedMessage = error.message.trim()

    if (normalizedMessage.length > 0) {
      return normalizedMessage
    }
  }

  if (typeof error === 'string') {
    const normalizedMessage = error.trim()

    if (normalizedMessage.length > 0) {
      return normalizedMessage
    }
  }

  return fallbackMessage
}