import {
  useId,
  type HTMLAttributes,
} from 'react'

import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@/components/buttons/Button'
import type {
  PdfTextSelection,
} from '@/models/dtos/PdfTextSelection'
import {
  AnnotationColor,
  type AnnotationColor as AnnotationColorValue,
} from '@/models/enums/AnnotationColor'

import '@/styles/components/reader-text-selection-toolbar.css'

export interface ReaderTextSelectionToolbarProps
  extends HTMLAttributes<HTMLDivElement> {
  readonly selection: PdfTextSelection
  readonly selectedColor: AnnotationColorValue
  readonly isSaving?: boolean

  readonly onColorChange: (
    color: AnnotationColorValue,
  ) => void

  readonly onSave: () => void | Promise<void>
  readonly onCancel: () => void
}

interface ColorOption {
  readonly value: AnnotationColorValue
  readonly label: string
}

const COLOR_OPTIONS: readonly ColorOption[] = [
  {
    value: AnnotationColor.YELLOW,
    label: 'Amarelo',
  },
  {
    value: AnnotationColor.GREEN,
    label: 'Verde',
  },
  {
    value: AnnotationColor.BLUE,
    label: 'Azul',
  },
  {
    value: AnnotationColor.PINK,
    label: 'Rosa',
  },
]

function HighlightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m14.5 4.5 5 5-9.5 9.5H5v-5z" />
      <path d="m12.5 6.5 5 5" />
      <path d="M4 21h16" />
    </svg>
  )
}

function createToolbarClassName(
  customClassName: string | undefined,
): string {
  const classNames = [
    'reader-text-selection-toolbar',
  ]

  if (
    customClassName !== undefined &&
    customClassName.trim().length > 0
  ) {
    classNames.push(
      customClassName,
    )
  }

  return classNames.join(' ')
}

function createColorButtonClassName(
  color: AnnotationColorValue,
  isSelected: boolean,
): string {
  const classNames = [
    'reader-text-selection-toolbar__color-button',
    `reader-text-selection-toolbar__color-button--${color}`,
  ]

  if (isSelected) {
    classNames.push(
      'reader-text-selection-toolbar__color-button--selected',
    )
  }

  return classNames.join(' ')
}

export function ReaderTextSelectionToolbar({
  selection,
  selectedColor,
  isSaving = false,
  onColorChange,
  onSave,
  onCancel,
  className,
  ...toolbarProps
}: ReaderTextSelectionToolbarProps) {
  const titleId = useId()

  return (
    <div
      {...toolbarProps}
      className={
        createToolbarClassName(
          className,
        )
      }
      role="dialog"
      aria-labelledby={titleId}
      aria-busy={isSaving}
    >
      <div className="reader-text-selection-toolbar__content">
        <div className="reader-text-selection-toolbar__heading">
          <span
            className="reader-text-selection-toolbar__icon"
            aria-hidden="true"
          >
            <HighlightIcon />
          </span>

          <div className="reader-text-selection-toolbar__information">
            <strong
              id={titleId}
              className="reader-text-selection-toolbar__title"
            >
              Marcar texto
            </strong>

            <span className="reader-text-selection-toolbar__preview">
              “{selection.selectedText}”
            </span>
          </div>
        </div>

        <fieldset
          className="reader-text-selection-toolbar__colors"
          disabled={isSaving}
        >
          <legend className="reader-text-selection-toolbar__legend">
            Cor da marcação
          </legend>

          <div className="reader-text-selection-toolbar__color-options">
            {COLOR_OPTIONS.map(
              (colorOption) => {
                const isSelected =
                  selectedColor ===
                  colorOption.value

                return (
                  <button
                    key={colorOption.value}
                    type="button"
                    className={
                      createColorButtonClassName(
                        colorOption.value,
                        isSelected,
                      )
                    }
                    aria-label={
                      `Usar marcação ${colorOption.label.toLocaleLowerCase('pt-BR')}`
                    }
                    aria-pressed={isSelected}
                    title={colorOption.label}
                    onClick={() => {
                      onColorChange(
                        colorOption.value,
                      )
                    }}
                  >
                    <span aria-hidden="true" />
                  </button>
                )
              },
            )}
          </div>
        </fieldset>

        <div className="reader-text-selection-toolbar__actions">
          <Button
            variant={ButtonVariant.GHOST}
            size={ButtonSize.SMALL}
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button
            variant={ButtonVariant.PRIMARY}
            size={ButtonSize.SMALL}
            leadingIcon={<HighlightIcon />}
            disabled={isSaving}
            onClick={() => {
              void onSave()
            }}
          >
            {isSaving
              ? 'Salvando...'
              : 'Salvar marcação'}
          </Button>
        </div>
      </div>
    </div>
  )
}
