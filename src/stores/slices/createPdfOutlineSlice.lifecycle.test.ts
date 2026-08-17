import type {
  PDFDocumentProxy,
} from 'pdfjs-dist'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  applicationContainer,
} from '@/app/providers/applicationContainer'
import type {
  PdfOutlineItem,
} from '@/models/dtos/PdfOutlineItem'
import {
  AsyncStatus,
} from '@/models/enums/AsyncStatus'
import type {
  LoadedPdfDocument,
} from '@/services/pdf/PdfDocumentService'
import {
  useAppStore,
} from '@/stores/useAppStore'

interface TestLoadedPdfDocument {
  readonly loadedPdfDocument:
    LoadedPdfDocument

  closeDocument(): void
}

function createLoadedPdfDocument(
  numPages = 10,
): TestLoadedPdfDocument {
  let isClosed = false

  const document = {
    numPages,
  } as unknown as PDFDocumentProxy

  const loadedPdfDocument:
    LoadedPdfDocument = {
      document,

      get isClosed() {
        return isClosed
      },

      close:
        vi.fn(
          async () => {
            isClosed = true
          },
        ),
    }

  return {
    loadedPdfDocument,

    closeDocument: () => {
      isClosed = true
    },
  }
}

function createOutline(
  title: string,
  pageNumber = 1,
): readonly PdfOutlineItem[] {
  return [
    {
      id:
        'outline-0',

      title,

      pageNumber,

      children: [],
    },
  ]
}

function resetOutlineState(): void {
  useAppStore.setState({
    loadedPdfDocument:
      null,

    pdfOutlineItems:
      [],

    pdfOutlineStatus:
      AsyncStatus.IDLE,

    pdfOutlineErrorMessage:
      null,
  })
}

describe(
  'createPdfOutlineSlice lifecycle',
  () => {
    beforeEach(
      () => {
        resetOutlineState()
      },
    )

    afterEach(
      () => {
        vi.restoreAllMocks()

        resetOutlineState()
      },
    )

    it(
      'clearPdfOutline invalida um carregamento pendente',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument()

        let resolveOutline:
          (
            outline:
              readonly PdfOutlineItem[],
          ) => void =
          () => undefined

        const pendingOutline =
          new Promise<
            readonly PdfOutlineItem[]
          >(
            (resolve) => {
              resolveOutline =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfOutline,
          'execute',
        )
          .mockReturnValue(
            pendingOutline,
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadPdfOutline()

        useAppStore
          .getState()
          .clearPdfOutline()

        let state =
          useAppStore.getState()

        expect(
          state.pdfOutlineItems,
        ).toEqual([])

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.pdfOutlineErrorMessage,
        ).toBeNull()

        resolveOutline(
          createOutline(
            'Resultado antigo',
          ),
        )

        await loadPromise

        state =
          useAppStore.getState()

        expect(
          state.pdfOutlineItems,
        ).toEqual([])

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.pdfOutlineErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora resultado quando outro documento é aberto durante o carregamento',
      async () => {
        const firstDocument =
          createLoadedPdfDocument(
            10,
          )

        const secondDocument =
          createLoadedPdfDocument(
            5,
          )

        let resolveOutline:
          (
            outline:
              readonly PdfOutlineItem[],
          ) => void =
          () => undefined

        const pendingOutline =
          new Promise<
            readonly PdfOutlineItem[]
          >(
            (resolve) => {
              resolveOutline =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfOutline,
          'execute',
        )
          .mockReturnValue(
            pendingOutline,
          )

        useAppStore.setState({
          loadedPdfDocument:
            firstDocument
              .loadedPdfDocument,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadPdfOutline()

        const currentOutline =
          createOutline(
            'Documento atual',
            3,
          )

        useAppStore.setState({
          loadedPdfDocument:
            secondDocument
              .loadedPdfDocument,

          pdfOutlineItems:
            currentOutline,

          pdfOutlineStatus:
            AsyncStatus.SUCCESS,

          pdfOutlineErrorMessage:
            null,
        })

        resolveOutline(
          createOutline(
            'Documento antigo',
            8,
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfDocument,
        ).toBe(
          secondDocument
            .loadedPdfDocument,
        )

        expect(
          state.pdfOutlineItems,
        ).toBe(
          currentOutline,
        )

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'ignora resultado quando o documento é fechado durante o carregamento',
      async () => {
        const {
          loadedPdfDocument,
          closeDocument,
        } =
          createLoadedPdfDocument()

        let resolveOutline:
          (
            outline:
              readonly PdfOutlineItem[],
          ) => void =
          () => undefined

        const pendingOutline =
          new Promise<
            readonly PdfOutlineItem[]
          >(
            (resolve) => {
              resolveOutline =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfOutline,
          'execute',
        )
          .mockReturnValue(
            pendingOutline,
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadPdfOutline()

        closeDocument()

        useAppStore.setState({
          pdfOutlineItems:
            [],

          pdfOutlineStatus:
            AsyncStatus.IDLE,

          pdfOutlineErrorMessage:
            null,
        })

        resolveOutline(
          createOutline(
            'Resultado depois do fechamento',
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.pdfOutlineItems,
        ).toEqual([])

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.pdfOutlineErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora erro pertencente a um carregamento anterior',
      async () => {
        const {
          loadedPdfDocument,
        } =
          createLoadedPdfDocument()

        let rejectFirstLoad:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const firstPendingLoad =
          new Promise<
            readonly PdfOutlineItem[]
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectFirstLoad =
                reject
            },
          )

        const currentOutline =
          createOutline(
            'Sumário atual',
            2,
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfOutline,
          'execute',
        )
          .mockReturnValueOnce(
            firstPendingLoad,
          )
          .mockResolvedValueOnce(
            currentOutline,
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        const firstLoadPromise =
          useAppStore
            .getState()
            .loadPdfOutline()

        await useAppStore
          .getState()
          .loadPdfOutline()

        rejectFirstLoad(
          new Error(
            'Erro do carregamento antigo.',
          ),
        )

        await firstLoadPromise

        const state =
          useAppStore.getState()

        expect(
          state.pdfOutlineItems,
        ).toBe(
          currentOutline,
        )

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.pdfOutlineErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora erro quando outro documento foi aberto',
      async () => {
        const firstDocument =
          createLoadedPdfDocument()

        const secondDocument =
          createLoadedPdfDocument(
            4,
          )

        let rejectLoad:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            readonly PdfOutlineItem[]
          >(
            (
              _resolve,
              reject,
            ) => {
              rejectLoad =
                reject
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfOutline,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        useAppStore.setState({
          loadedPdfDocument:
            firstDocument
              .loadedPdfDocument,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadPdfOutline()

        const currentOutline =
          createOutline(
            'Documento atual',
            2,
          )

        useAppStore.setState({
          loadedPdfDocument:
            secondDocument
              .loadedPdfDocument,

          pdfOutlineItems:
            currentOutline,

          pdfOutlineStatus:
            AsyncStatus.SUCCESS,

          pdfOutlineErrorMessage:
            null,
        })

        rejectLoad(
          new Error(
            'Erro do documento antigo.',
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfDocument,
        ).toBe(
          secondDocument
            .loadedPdfDocument,
        )

        expect(
          state.pdfOutlineItems,
        ).toBe(
          currentOutline,
        )

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.pdfOutlineErrorMessage,
        ).toBeNull()
      },
    )
  },
)