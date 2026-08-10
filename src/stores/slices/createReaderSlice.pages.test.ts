import type {
  PDFDocumentProxy,
  PDFPageProxy,
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

function createPdfPage(
  pageNumber: number,
): PDFPageProxy {
  return {
    pageNumber,
  } as unknown as PDFPageProxy
}

function createLoadedPdfDocument(
  numPages = 20,
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

function resetReaderPageState(): void {
  useAppStore.setState({
    loadedPdfDocument:
      null,

    loadedPdfPage:
      null,

    loadedSecondaryPdfPage:
      null,

    currentPage:
      1,

    pageOffsetRatio:
      0,

    pageLoadStatus:
      AsyncStatus.IDLE,

    secondaryPageLoadStatus:
      AsyncStatus.IDLE,

    pageLoadErrorMessage:
      null,

    secondaryPageLoadErrorMessage:
      null,
  })
}

describe(
  'createReaderSlice PDF page loading',
  () => {
    beforeEach(
      () => {
        resetReaderPageState()
      },
    )

    afterEach(
      () => {
        vi.restoreAllMocks()

        resetReaderPageState()
      },
    )

    it(
      'retorna erro quando nenhum PDF está aberto',
      async () => {
        const loadPageSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPage,
            'execute',
          )

        await useAppStore
          .getState()
          .loadPdfPage(
            5,
          )

        const state =
          useAppStore.getState()

        expect(
          loadPageSpy,
        ).not.toHaveBeenCalled()

        expect(
          state.loadedPdfPage,
        ).toBeNull()

        expect(
          state.pageLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.pageLoadErrorMessage,
        ).not.toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )

    it(
      'retorna erro quando o PDF já está fechado',
      async () => {
        const document =
          createLoadedPdfDocument()

        document.closeDocument()

        useAppStore.setState({
          loadedPdfDocument:
            document
              .loadedPdfDocument,
        })

        const loadPageSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPage,
            'execute',
          )

        await useAppStore
          .getState()
          .loadPdfPage(
            3,
          )

        expect(
          loadPageSpy,
        ).not.toHaveBeenCalled()

        expect(
          useAppStore
            .getState()
            .pageLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )
      },
    )

    it(
      'carrega a página solicitada e atualiza a página atual',
      async () => {
        const document =
          createLoadedPdfDocument()

        const loadedPage =
          createPdfPage(
            7,
          )

        useAppStore.setState({
          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            3,

          pageOffsetRatio:
            0.65,

          loadedSecondaryPdfPage:
            createPdfPage(
              4,
            ),

          secondaryPageLoadStatus:
            AsyncStatus.SUCCESS,
        })

        const loadPageSpy =
          vi.spyOn(
            applicationContainer
              .controllers
              .loadPdfPage,
            'execute',
          )
            .mockResolvedValue(
              loadedPage,
            )

        await useAppStore
          .getState()
          .loadPdfPage(
            7,
          )

        expect(
          loadPageSpy,
        ).toHaveBeenCalledTimes(
          1,
        )

        expect(
          loadPageSpy,
        ).toHaveBeenCalledWith(
          document
            .loadedPdfDocument
            .document,
          7,
        )

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfPage,
        ).toBe(
          loadedPage,
        )

        expect(
          state.currentPage,
        ).toBe(
          7,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          0,
        )

        expect(
          state.pageLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )

        expect(
          state.loadedSecondaryPdfPage,
        ).toBeNull()

        expect(
          state.secondaryPageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.pageLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'preserva o deslocamento quando a mesma página é recarregada',
      async () => {
        const document =
          createLoadedPdfDocument()

        const loadedPage =
          createPdfPage(
            5,
          )

        useAppStore.setState({
          loadedPdfDocument:
            document
              .loadedPdfDocument,

          currentPage:
            5,

          pageOffsetRatio:
            0.48,
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPage,
          'execute',
        )
          .mockResolvedValue(
            loadedPage,
          )

        await useAppStore
          .getState()
          .loadPdfPage(
            5,
          )

        const state =
          useAppStore.getState()

        expect(
          state.currentPage,
        ).toBe(
          5,
        )

        expect(
          state.pageOffsetRatio,
        ).toBe(
          0.48,
        )

        expect(
          state.pageLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'registra erro quando o carregamento da página falha',
      async () => {
        const document =
          createLoadedPdfDocument()

        useAppStore.setState({
          loadedPdfDocument:
            document
              .loadedPdfDocument,
        })

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPage,
          'execute',
        )
          .mockRejectedValue(
            new Error(
              'Falha simulada ao carregar página.',
            ),
          )

        await useAppStore
          .getState()
          .loadPdfPage(
            9,
          )

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfPage,
        ).toBeNull()

        expect(
          state.pageLoadStatus,
        ).toBe(
          AsyncStatus.ERROR,
        )

        expect(
          state.pageLoadErrorMessage,
        ).not.toBeNull()
      },
    )

    it(
      'ignora resultado antigo quando outra página termina primeiro',
      async () => {
        const document =
          createLoadedPdfDocument()

        const firstPage =
          createPdfPage(
            4,
          )

        const secondPage =
          createPdfPage(
            8,
          )

        useAppStore.setState({
          loadedPdfDocument:
            document
              .loadedPdfDocument,
        })

        let resolveFirstLoad:
          (
            page:
              PDFPageProxy,
          ) => void =
          () => undefined

        const firstPendingLoad =
          new Promise<
            PDFPageProxy
          >(
            (resolve) => {
              resolveFirstLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPage,
          'execute',
        )
          .mockReturnValueOnce(
            firstPendingLoad,
          )
          .mockResolvedValueOnce(
            secondPage,
          )

        const firstLoadPromise =
          useAppStore
            .getState()
            .loadPdfPage(
              4,
            )

        await useAppStore
          .getState()
          .loadPdfPage(
            8,
          )

        resolveFirstLoad(
          firstPage,
        )

        await firstLoadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfPage,
        ).toBe(
          secondPage,
        )

        expect(
          state.currentPage,
        ).toBe(
          8,
        )

        expect(
          state.pageLoadStatus,
        ).toBe(
          AsyncStatus.SUCCESS,
        )
      },
    )

    it(
      'ignora resultado quando o documento aberto foi trocado',
      async () => {
        const firstDocument =
          createLoadedPdfDocument()

        const secondDocument =
          createLoadedPdfDocument()

        const oldPage =
          createPdfPage(
            6,
          )

        let resolveLoad:
          (
            page:
              PDFPageProxy,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            PDFPageProxy
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPage,
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
            .loadPdfPage(
              6,
            )

        useAppStore.setState({
          loadedPdfDocument:
            secondDocument
              .loadedPdfDocument,

          loadedPdfPage:
            null,

          pageLoadStatus:
            AsyncStatus.IDLE,

          pageLoadErrorMessage:
            null,
        })

        resolveLoad(
          oldPage,
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
          state.loadedPdfPage,
        ).toBeNull()

        expect(
          state.pageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )
      },
    )

    it(
      'ignora resultado quando o PDF é fechado durante o carregamento',
      async () => {
        const document =
          createLoadedPdfDocument()

        const loadedPage =
          createPdfPage(
            10,
          )

        let resolveLoad:
          (
            page:
              PDFPageProxy,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            PDFPageProxy
          >(
            (resolve) => {
              resolveLoad =
                resolve
            },
          )

        vi.spyOn(
          applicationContainer
            .controllers
            .loadPdfPage,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        useAppStore.setState({
          loadedPdfDocument:
            document
              .loadedPdfDocument,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadPdfPage(
              10,
            )

        document.closeDocument()

        useAppStore.setState({
          loadedPdfPage:
            null,

          pageLoadStatus:
            AsyncStatus.IDLE,

          pageLoadErrorMessage:
            null,
        })

        resolveLoad(
          loadedPage,
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfPage,
        ).toBeNull()

        expect(
          state.pageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.pageLoadErrorMessage,
        ).toBeNull()
      },
    )

    it(
      'ignora erro quando o PDF é fechado durante o carregamento',
      async () => {
        const document =
          createLoadedPdfDocument()

        let rejectLoad:
          (
            reason:
              unknown,
          ) => void =
          () => undefined

        const pendingLoad =
          new Promise<
            PDFPageProxy
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
            .loadPdfPage,
          'execute',
        )
          .mockReturnValue(
            pendingLoad,
          )

        useAppStore.setState({
          loadedPdfDocument:
            document
              .loadedPdfDocument,
        })

        const loadPromise =
          useAppStore
            .getState()
            .loadPdfPage(
              12,
            )

        document.closeDocument()

        useAppStore.setState({
          loadedPdfPage:
            null,

          pageLoadStatus:
            AsyncStatus.IDLE,

          pageLoadErrorMessage:
            null,
        })

        rejectLoad(
          new Error(
            'Erro depois do fechamento.',
          ),
        )

        await loadPromise

        const state =
          useAppStore.getState()

        expect(
          state.loadedPdfPage,
        ).toBeNull()

        expect(
          state.pageLoadStatus,
        ).toBe(
          AsyncStatus.IDLE,
        )

        expect(
          state.pageLoadErrorMessage,
        ).toBeNull()
      },
    )
  },
)