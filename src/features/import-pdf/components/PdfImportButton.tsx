import {
  useRef,
  type ChangeEvent,
} from 'react'

import { APP_CONFIG } from '@/app/config/app.config'
import {
  Button,
  ButtonVariant,
  type ButtonProps,
  type ButtonSize,
} from '@/components/buttons/Button'
import { AsyncStatus } from '@/models/enums/AsyncStatus'
import {
  selectImportPdf,
  selectPdfImportStatus,
} from '@/stores/selectors/librarySelectors'
import { useAppStore } from '@/stores/useAppStore'

const PDF_FILE_ACCEPT = [
  ...APP_CONFIG.pdf.acceptedExtensions,
  ...APP_CONFIG.pdf.acceptedMimeTypes,
].join(',')

export interface PdfImportButtonProps {
  readonly size?: ButtonSize
  readonly fullWidth?: boolean
  readonly label?: string
}

function ImportPdfIcon() {
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
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  )
}

function createButtonSizeProps(
  size: ButtonSize | undefined,
): Pick<ButtonProps, 'size'> | Record<string, never> {
  if (size === undefined) {
    return {}
  }

  return {
    size,
  }
}

export function PdfImportButton({
  size,
  fullWidth = false,
  label = 'Importar PDF',
}: PdfImportButtonProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const importPdf = useAppStore(selectImportPdf)

  const pdfImportStatus = useAppStore(
    selectPdfImportStatus,
  )

  const isImporting =
    pdfImportStatus === AsyncStatus.LOADING

  const buttonSizeProps =
    createButtonSizeProps(size)

  const openFileSelector = () => {
    if (isImporting) {
      return
    }

    fileInputRef.current?.click()
  }

  const handleFileSelection = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile =
      event.currentTarget.files?.[0]

    event.currentTarget.value = ''

    if (selectedFile === undefined) {
      return
    }

    await importPdf(selectedFile)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={PDF_FILE_ACCEPT}
        hidden
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          void handleFileSelection(event)
        }}
      />

      <Button
        {...buttonSizeProps}
        variant={ButtonVariant.PRIMARY}
        fullWidth={fullWidth}
        leadingIcon={<ImportPdfIcon />}
        disabled={isImporting}
        aria-busy={isImporting}
        onClick={openFileSelector}
      >
        {isImporting
          ? 'Importando...'
          : label}
      </Button>
    </>
  )
}