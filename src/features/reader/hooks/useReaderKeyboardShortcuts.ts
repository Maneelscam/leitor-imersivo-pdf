import {
  useEffect,
} from 'react'

export interface ReaderKeyboardShortcutsOptions {
  readonly disabled?: boolean

  readonly onPreviousPage: () => void
  readonly onNextPage: () => void

  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
  readonly onResetZoom: () => void
  readonly onFitWidth: () => void

  readonly onRotateLeft: () => void
  readonly onRotateRight: () => void

  readonly onTogglePanel: () => void
  readonly onFocusSearch: () => void
}

function isEditableElement(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const elementName =
    target.tagName.toLowerCase()

  return (
    elementName === 'input' ||
    elementName === 'textarea' ||
    elementName === 'select'
  )
}

export function useReaderKeyboardShortcuts({
  disabled = false,
  onPreviousPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onRotateLeft,
  onRotateRight,
  onTogglePanel,
  onFocusSearch,
}: ReaderKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (disabled) {
      return
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const hasPrimaryModifier =
        event.ctrlKey ||
        event.metaKey

      const normalizedKey =
        event.key.toLowerCase()

      if (
        hasPrimaryModifier &&
        !event.altKey &&
        normalizedKey === 'f'
      ) {
        event.preventDefault()
        onFocusSearch()
        return
      }

      if (
        hasPrimaryModifier ||
        event.altKey ||
        isEditableElement(event.target)
      ) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault()
          onPreviousPage()
          return

        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault()
          onNextPage()
          return

        case '+':
        case '=':
          event.preventDefault()
          onZoomIn()
          return

        case '-':
          event.preventDefault()
          onZoomOut()
          return

        case '0':
          event.preventDefault()
          onResetZoom()
          return

        case 'f':
        case 'F':
          event.preventDefault()
          onFitWidth()
          return

        case 'r':
          event.preventDefault()
          onRotateRight()
          return

        case 'R':
          event.preventDefault()
          onRotateLeft()
          return

        case 'p':
        case 'P':
          event.preventDefault()
          onTogglePanel()
          return
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    disabled,
    onPreviousPage,
    onNextPage,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onFitWidth,
    onRotateLeft,
    onRotateRight,
    onTogglePanel,
    onFocusSearch,
  ])
}