import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
} from 'pdfjs-dist'
import {
  PasswordResponses,
  getDocument,
} from 'pdfjs-dist'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { PdfDocumentService } from '@/services/pdf/PdfDocumentService'
import type { PdfWorkerService } from '@/services/pdf/PdfWorkerService'
import {
  PdfDocumentError,
  PdfDocumentErrorCode,
} from '@/utils/errors/PdfDocumentError'

vi.mock('pdfjs-dist', () => ({
  PasswordResponses: {
    NEED_PASSWORD: 1,
    INCORRECT_PASSWORD: 2,
  },
  getDocument: vi.fn(),
}))

vi.mock('@/services/pdf/PdfWorkerService', () => ({
  PdfWorkerService: class {
    configure(): void {}
  },
}))

const mockedGetDocument = vi.mocked(getDocument)

function createWorkerService(): PdfWorkerService {
  return {
    configure: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  } as unknown as PdfWorkerService
}

function createLoadingTask({
  document = {} as PDFDocumentProxy,
  promiseError,
  destroyError,
  destroyed = false,
}: {
  readonly document?: PDFDocumentProxy
  readonly promiseError?: unknown
  readonly destroyError?: unknown
  readonly destroyed?: boolean
} = {}): PDFDocumentLoadingTask {
  const destroy =
    destroyError === undefined
      ? vi.fn().mockResolvedValue(undefined)
      : vi.fn().mockRejectedValue(destroyError)

  return {
    promise:
      promiseError === undefined
        ? Promise.resolve(document)
        : Promise.reject(promiseError),
    destroy,
    destroyed,
  } as unknown as PDFDocumentLoadingTask
}

function createPdfBlob(): Blob {
  return new Blob(
    ['%PDF-1.7 documento de teste'],
    {
      type: 'application/pdf',
    },
  )
}

describe('PdfDocumentService', () => {
  beforeEach(() => {
    mockedGetDocument.mockReset()
  })

  it('abre o documento, configura o worker e fecha o handle apenas uma vez', async () => {
    const workerService = createWorkerService()
    const document = {} as PDFDocumentProxy
    const loadingTask = createLoadingTask({
      document,
    })

    mockedGetDocument.mockReturnValue(
      loadingTask,
    )

    const service = new PdfDocumentService(
      workerService,
    )

    const file = createPdfBlob()

    const loaded = await service.open(file)

    expect(workerService.configure).toHaveBeenCalledTimes(1)
    expect(mockedGetDocument).toHaveBeenCalledTimes(1)

    const parameters =
      mockedGetDocument.mock.calls[0]?.[0] as {
        readonly data: Uint8Array
        readonly isEvalSupported: boolean
        readonly password?: string
      }

    expect(parameters.data).toBeInstanceOf(Uint8Array)
    expect(parameters.isEvalSupported).toBe(false)
    expect('password' in parameters).toBe(false)

    expect(loaded.document).toBe(document)
    expect(loaded.isClosed).toBe(false)

    await loaded.close()

    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
    expect(loaded.isClosed).toBe(true)

    await loaded.close()

    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })

  it('encaminha a senha informada ao PDF.js', async () => {
    const loadingTask = createLoadingTask()

    mockedGetDocument.mockReturnValue(
      loadingTask,
    )

    const service = new PdfDocumentService(
      createWorkerService(),
    )

    await service.open(
      createPdfBlob(),
      {
        password: 'senha-do-pdf',
      },
    )

    expect(mockedGetDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'senha-do-pdf',
        isEvalSupported: false,
      }),
    )
  })

  it('converte senha incorreta em INVALID_PASSWORD e destrói a tarefa', async () => {
    const pdfJsError = {
      name: 'PasswordException',
      code: PasswordResponses.INCORRECT_PASSWORD,
    }

    const loadingTask = createLoadingTask({
      promiseError: pdfJsError,
    })

    mockedGetDocument.mockReturnValue(
      loadingTask,
    )

    const service = new PdfDocumentService(
      createWorkerService(),
    )

    try {
      await service.open(
        createPdfBlob(),
      )

      throw new Error(
        'A abertura deveria falhar.',
      )
    } catch (error) {
      expect(error).toBeInstanceOf(
        PdfDocumentError,
      )
      expect(error).toMatchObject({
        code:
          PdfDocumentErrorCode.INVALID_PASSWORD,
        cause: pdfJsError,
      })
    }

    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })

  it('converte solicitação de senha em PASSWORD_REQUIRED', async () => {
    const pdfJsError = {
      name: 'PasswordException',
      code: PasswordResponses.NEED_PASSWORD,
    }

    const loadingTask = createLoadingTask({
      promiseError: pdfJsError,
    })

    mockedGetDocument.mockReturnValue(
      loadingTask,
    )

    const service = new PdfDocumentService(
      createWorkerService(),
    )

    await expect(
      service.open(
        createPdfBlob(),
      ),
    ).rejects.toMatchObject({
      name: 'PdfDocumentError',
      code:
        PdfDocumentErrorCode.PASSWORD_REQUIRED,
      cause: pdfJsError,
    })
  })

  it.each([
    'InvalidPDFException',
    'FormatError',
  ])(
    'converte %s em INVALID_DOCUMENT',
    async (errorName) => {
      const pdfJsError = {
        name: errorName,
      }

      mockedGetDocument.mockReturnValue(
        createLoadingTask({
          promiseError: pdfJsError,
        }),
      )

      const service =
        new PdfDocumentService(
          createWorkerService(),
        )

      await expect(
        service.open(
          createPdfBlob(),
        ),
      ).rejects.toMatchObject({
        code:
          PdfDocumentErrorCode.INVALID_DOCUMENT,
        cause: pdfJsError,
      })
    },
  )

  it('converte falha genérica de abertura em LOAD_FAILED', async () => {
    const loadError =
      new Error(
        'falha desconhecida',
      )

    mockedGetDocument.mockReturnValue(
      createLoadingTask({
        promiseError: loadError,
      }),
    )

    const service =
      new PdfDocumentService(
        createWorkerService(),
      )

    await expect(
      service.open(
        createPdfBlob(),
      ),
    ).rejects.toMatchObject({
      code:
        PdfDocumentErrorCode.LOAD_FAILED,
      cause: loadError,
    })
  })

  it('preserva PdfDocumentError já normalizado', async () => {
    const originalError =
      new PdfDocumentError(
        PdfDocumentErrorCode.LOAD_FAILED,
        'erro já normalizado',
      )

    mockedGetDocument.mockReturnValue(
      createLoadingTask({
        promiseError: originalError,
      }),
    )

    const service =
      new PdfDocumentService(
        createWorkerService(),
      )

    await expect(
      service.open(
        createPdfBlob(),
      ),
    ).rejects.toBe(
      originalError,
    )
  })

  it('ignora falha ao destruir a tarefa durante erro de abertura', async () => {
    const loadError =
      new Error(
        'falha principal',
      )

    const destroyError =
      new Error(
        'falha secundária ao destruir',
      )

    mockedGetDocument.mockReturnValue(
      createLoadingTask({
        promiseError: loadError,
        destroyError,
      }),
    )

    const service =
      new PdfDocumentService(
        createWorkerService(),
      )

    await expect(
      service.open(
        createPdfBlob(),
      ),
    ).rejects.toMatchObject({
      code:
        PdfDocumentErrorCode.LOAD_FAILED,
      cause: loadError,
    })
  })

  it('converte falha ao fechar um documento carregado em DESTROY_FAILED', async () => {
    const destroyError =
      new Error(
        'não foi possível destruir',
      )

    const loadingTask =
      createLoadingTask({
        destroyError,
      })

    mockedGetDocument.mockReturnValue(
      loadingTask,
    )

    const service =
      new PdfDocumentService(
        createWorkerService(),
      )

    const loaded =
      await service.open(
        createPdfBlob(),
      )

    await expect(
      loaded.close(),
    ).rejects.toMatchObject({
      name:
        'PdfDocumentError',
      code:
        PdfDocumentErrorCode.DESTROY_FAILED,
      cause:
        destroyError,
    })

    expect(loaded.isClosed).toBe(true)

    await expect(
      loaded.close(),
    ).resolves.toBeUndefined()

    expect(loadingTask.destroy).toHaveBeenCalledTimes(1)
  })

  it('converte falha de leitura do Blob em LOAD_FAILED sem criar loading task', async () => {
    const readError =
      new Error(
        'falha ao ler blob',
      )

    const file = {
      arrayBuffer:
        vi.fn().mockRejectedValue(
          readError,
        ),
    } as unknown as Blob

    const service =
      new PdfDocumentService(
        createWorkerService(),
      )

    await expect(
      service.open(file),
    ).rejects.toMatchObject({
      code:
        PdfDocumentErrorCode.LOAD_FAILED,
      cause:
        readError,
    })

    expect(mockedGetDocument).not.toHaveBeenCalled()
  })
})