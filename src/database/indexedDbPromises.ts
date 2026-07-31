export function requestToPromise<TResult>(
  request: IDBRequest<TResult>,
): Promise<TResult> {
  return new Promise<TResult>((resolve, reject) => {
    request.addEventListener(
      'success',
      () => {
        resolve(request.result)
      },
      {
        once: true,
      },
    )

    request.addEventListener(
      'error',
      () => {
        reject(
          request.error ??
            new Error(
              'O IndexedDB não conseguiu concluir a solicitação.',
            ),
        )
      },
      {
        once: true,
      },
    )
  })
}

export function transactionToPromise(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.addEventListener(
      'complete',
      () => {
        resolve()
      },
      {
        once: true,
      },
    )

    transaction.addEventListener(
      'error',
      () => {
        reject(
          transaction.error ??
            new Error(
              'Ocorreu um erro durante a transação do banco de dados.',
            ),
        )
      },
      {
        once: true,
      },
    )

    transaction.addEventListener(
      'abort',
      () => {
        reject(
          transaction.error ??
            new Error(
              'A transação do banco de dados foi cancelada.',
            ),
        )
      },
      {
        once: true,
      },
    )
  })
}