import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest'

import { GlobalWorkerOptions } from 'pdfjs-dist'

import { PdfWorkerService } from '@/services/pdf/PdfWorkerService'

describe('PdfWorkerService', () => {
  const originalWorkerSrc = GlobalWorkerOptions.workerSrc

  afterEach(() => {
    GlobalWorkerOptions.workerSrc = originalWorkerSrc
  })

  it('configura o worker uma única vez e marca o serviço como configurado', () => {
    const service = new PdfWorkerService()

    expect(service.isConfigured()).toBe(false)

    service.configure()

    const configuredWorkerSrc = GlobalWorkerOptions.workerSrc

    expect(configuredWorkerSrc).not.toBe('')
    expect(service.isConfigured()).toBe(true)

    GlobalWorkerOptions.workerSrc = 'worker-personalizado.mjs'

    service.configure()

    expect(GlobalWorkerOptions.workerSrc).toBe(
      'worker-personalizado.mjs',
    )
    expect(service.isConfigured()).toBe(true)

    GlobalWorkerOptions.workerSrc = configuredWorkerSrc
  })
})