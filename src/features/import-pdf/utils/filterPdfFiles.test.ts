import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  filterPdfFiles,
  isPdfFileCandidate,
} from '@/features/import-pdf/utils/filterPdfFiles'

describe('filterPdfFiles', () => {
  it('aceita PDF pelo MIME type', () => {
    expect(
      isPdfFileCandidate({
        name: 'documento',
        type: 'application/pdf',
      }),
    ).toBe(true)
  })

  it('aceita PDF pela extensão sem MIME', () => {
    expect(
      isPdfFileCandidate({
        name: 'Livro.PDF',
        type: '',
      }),
    ).toBe(true)
  })

  it('rejeita arquivo não PDF', () => {
    expect(
      isPdfFileCandidate({
        name: 'imagem.png',
        type: 'image/png',
      }),
    ).toBe(false)
  })

  it('mantém apenas PDFs em seleção mista', () => {
    const files = [
      { name: 'a.pdf', type: 'application/pdf' },
      { name: 'b.txt', type: 'text/plain' },
      { name: 'c.PDF', type: '' },
    ]

    expect(
      filterPdfFiles(files),
    ).toEqual([
      files[0],
      files[2],
    ])
  })
})
