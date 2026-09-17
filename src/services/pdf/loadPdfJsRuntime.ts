function importPdfJsRuntime() {
  return import('pdfjs-dist')
}

let runtimePromise:
  ReturnType<
    typeof importPdfJsRuntime
  > | null = null

export function loadPdfJsRuntime():
  ReturnType<
    typeof importPdfJsRuntime
  > {
  runtimePromise ??=
    importPdfJsRuntime()

  return runtimePromise
}
