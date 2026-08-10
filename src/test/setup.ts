import 'fake-indexeddb/auto'

function defineTestBrowserApi(
  name: string,
  value: unknown,
): void {
  if (name in globalThis) {
    return
  }

  Object.defineProperty(
    globalThis,
    name,
    {
      configurable: true,
      writable: true,
      value,
    },
  )
}

defineTestBrowserApi(
  'DOMMatrix',
  class DOMMatrixMock {},
)

defineTestBrowserApi(
  'ImageData',
  class ImageDataMock {},
)

defineTestBrowserApi(
  'Path2D',
  class Path2DMock {},
)