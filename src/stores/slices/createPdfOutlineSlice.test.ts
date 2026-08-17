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

function createLoadedPdfDocument():
  LoadedPdfDocument {
  const document = {
    numPages: 10,
  } as unknown as PDFDocumentProxy

  return {
    document,

    isClosed:
      false,

    close:
      vi.fn(
        async () => undefined,
      ),
  } as LoadedPdfDocument
}

function createOutline():
  readonly PdfOutlineItem[] {
  return [
    {
      id:
        'outline-0',

      title:
        'Introdução',

      pageNumber:
        1,

      children: [],
    },

    {
      id:
        'outline-1',

      title:
        'Capítulo 1',

      pageNumber:
        4,

      children: [
        {
          id:
            'outline-1-0',

          title:
            'Seção 1.1',

          pageNumber:
            5,

          children: [],
        },
      ],
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
  'createPdfOutlineSlice',
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
      'possui estado inicial vazio',
      () => {
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
      'carrega o sumário do documento aberto',
      async () => {
        const loadedPdfDocument =
          createLoadedPdfDocument()

        const outline =
          createOutline()

        const execute =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfOutline,
            'execute',
          )
            .mockResolvedValue(
              outline,
            )

        useAppStore.setState({
          loadedPdfDocument,
        })

        await useAppStore
          .getState()
          .loadPdfOutline()

        const state =
          useAppStore.getState()

        expect(
          execute,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          execute,
        ).toHaveBeenCalledWith(
          loadedPdfDocument.document,
        )

        expect(
          state.pdfOutlineItems,
        ).toBe(
          outline,
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
      'trata PDF sem sumário como carregamento bem-sucedido',
      async () => {
        const loadedPdfDocument =
          createLoadedPdfDocument()

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfOutline,
          'execute',
        )
          .mockResolvedValue(
            [],
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        await useAppStore
          .getState()
          .loadPdfOutline()

        const state =
          useAppStore.getState()

        expect(
          state.pdfOutlineItems,
        ).toEqual([])

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
      'retorna erro quando nenhum documento está aberto',
      async () => {
        const execute =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfOutline,
            'execute',
          )

        await useAppStore
          .getState()
          .loadPdfOutline()

        const state =
          useAppStore.getState()

        expect(
          execute,
        ).not.toHaveBeenCalled()

        expect(
          state.pdfOutlineItems,
        ).toEqual([])

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.pdfOutlineErrorMessage,
        ).toBe(
          'Nenhum documento PDF está aberto para carregar o sumário.',
        )
      },
    )

    it(
      'registra erro retornado pelo controller',
      async () => {
        const loadedPdfDocument =
          createLoadedPdfDocument()

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfOutline,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha ao ler o sumário.',
            ),
          )

        useAppStore.setState({
          loadedPdfDocument,
        })

        await useAppStore
          .getState()
          .loadPdfOutline()

        const state =
          useAppStore.getState()

        expect(
          state.pdfOutlineItems,
        ).toEqual([])

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.pdfOutlineErrorMessage,
        ).toBe(
          'Falha ao ler o sumário.',
        )
      },
    )

    it(
      'clearPdfOutline restaura o estado inicial',
      () => {
        useAppStore.setState({
          pdfOutlineItems:
            createOutline(),

          pdfOutlineStatus:
            AsyncStatus.SUCCESS,

          pdfOutlineErrorMessage:
            'Erro antigo',
        })

        useAppStore
          .getState()
          .clearPdfOutline()

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
      'clearPdfOutlineError limpa somente a mensagem de erro',
      () => {
        const outline =
          createOutline()

        useAppStore.setState({
          pdfOutlineItems:
            outline,

          pdfOutlineStatus:
            AsyncStatus.SUCCESS,

          pdfOutlineErrorMessage:
            'Erro antigo',
        })

        useAppStore
          .getState()
          .clearPdfOutlineError()

        const state =
          useAppStore.getState()

        expect(
          state.pdfOutlineErrorMessage,
        ).toBeNull()

        expect(
          state.pdfOutlineItems,
        ).toBe(
          outline,
        )

        expect(
          state.pdfOutlineStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )
  },
)