import {
  FileHashError,
  FileHashErrorCode,
} from '@/utils/errors/FileHashError'

const HASH_ALGORITHM = 'SHA-256'
const HASH_PREFIX = 'sha256:'

function ensureCryptoApiIsAvailable(): SubtleCrypto {
  const subtleCrypto = globalThis.crypto?.subtle

  if (subtleCrypto === undefined) {
    throw new FileHashError(
      FileHashErrorCode.CRYPTO_UNAVAILABLE,
      'O navegador não possui suporte à geração segura de assinaturas digitais.',
    )
  }

  return subtleCrypto
}

async function readFileBuffer(file: Blob): Promise<ArrayBuffer> {
  try {
    return await file.arrayBuffer()
  } catch (error) {
    throw new FileHashError(
      FileHashErrorCode.FILE_READ_FAILED,
      'Não foi possível ler o arquivo para gerar sua assinatura digital.',
      {
        cause: error,
      },
    )
  }
}

function convertBufferToHexadecimal(buffer: ArrayBuffer): string {
  return Array.from(
    new Uint8Array(buffer),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')
}

export class FileHashService {
  async generate(file: Blob): Promise<string> {
    const subtleCrypto = ensureCryptoApiIsAvailable()
    const fileBuffer = await readFileBuffer(file)

    try {
      const hashBuffer = await subtleCrypto.digest(
        HASH_ALGORITHM,
        fileBuffer,
      )

      const hexadecimalHash =
        convertBufferToHexadecimal(hashBuffer)

      return `${HASH_PREFIX}${hexadecimalHash}`
    } catch (error) {
      throw new FileHashError(
        FileHashErrorCode.HASH_GENERATION_FAILED,
        'Não foi possível gerar a assinatura digital do arquivo.',
        {
          cause: error,
        },
      )
    }
  }
}