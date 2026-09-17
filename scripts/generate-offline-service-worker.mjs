import {
  createHash,
} from 'node:crypto'
import {
  promises as fs,
} from 'node:fs'
import path from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

const scriptDirectory =
  path.dirname(
    fileURLToPath(
      import.meta.url,
    ),
  )

const projectDirectory =
  path.resolve(
    scriptDirectory,
    '..',
  )

const distDirectory =
  path.join(
    projectDirectory,
    'dist',
  )

const serviceWorkerFileName =
  'sw.js'

async function collectFiles(
  directory,
  relativeDirectory = '',
) {
  const entries =
    await fs.readdir(
      directory,
      {
        withFileTypes: true,
      },
    )

  const collectedFiles = []

  for (const entry of entries) {
    const relativePath =
      path.posix.join(
        relativeDirectory,
        entry.name,
      )

    const absolutePath =
      path.join(
        directory,
        entry.name,
      )

    if (entry.isDirectory()) {
      collectedFiles.push(
        ...await collectFiles(
          absolutePath,
          relativePath,
        ),
      )

      continue
    }

    if (
      !entry.isFile() ||
      relativePath ===
        serviceWorkerFileName
    ) {
      continue
    }

    collectedFiles.push(
      relativePath,
    )
  }

  return collectedFiles
}

async function createBuildVersion(
  relativePaths,
) {
  const hash =
    createHash('sha256')

  for (
    const relativePath
    of relativePaths
  ) {
    hash.update(
      relativePath,
    )

    hash.update(
      await fs.readFile(
        path.join(
          distDirectory,
          relativePath,
        ),
      ),
    )
  }

  return hash
    .digest('hex')
    .slice(0, 16)
}

function createServiceWorkerSource(
  relativePaths,
  buildVersion,
) {
  const precachePaths =
    JSON.stringify(
      relativePaths,
      null,
      2,
    )

  const serializedBuildVersion =
    JSON.stringify(
      buildVersion,
    )

  return [
    "const CACHE_PREFIX = 'leitor-imersivo-pdf'",
    `const CACHE_NAME = CACHE_PREFIX + '-' + ${serializedBuildVersion}`,
    `const PRECACHE_PATHS = ${precachePaths}`,
    '',
    'function createScopedUrl(relativePath) {',
    '  return new URL(',
    '    relativePath,',
    '    self.registration.scope,',
    '  ).href',
    '}',
    '',
    'function isRequestInsideScope(url) {',
    '  const scopeUrl =',
    '    new URL(',
    '      self.registration.scope,',
    '    )',
    '',
    '  return (',
    '    url.origin ===',
    '      scopeUrl.origin &&',
    '    url.pathname.startsWith(',
    '      scopeUrl.pathname,',
    '    )',
    '  )',
    '}',
    '',
    "self.addEventListener(",
    "  'install',",
    '  (event) => {',
    '    event.waitUntil(',
    '      (async () => {',
    '        const cache =',
    '          await caches.open(',
    '            CACHE_NAME,',
    '          )',
    '',
    '        await cache.addAll(',
    '          PRECACHE_PATHS.map(',
    '            createScopedUrl,',
    '          ),',
    '        )',
    '',
    '        await self.skipWaiting()',
    '      })(),',
    '    )',
    '  },',
    ')',
    '',
    "self.addEventListener(",
    "  'activate',",
    '  (event) => {',
    '    event.waitUntil(',
    '      (async () => {',
    '        const cacheNames =',
    '          await caches.keys()',
    '',
    '        await Promise.all(',
    '          cacheNames',
    '            .filter(',
    '              (cacheName) =>',
    '                cacheName.startsWith(',
    "                  CACHE_PREFIX + '-',",
    '                ) &&',
    '                cacheName !==',
    '                  CACHE_NAME,',
    '            )',
    '            .map(',
    '              (cacheName) =>',
    '                caches.delete(',
    '                  cacheName,',
    '                ),',
    '            ),',
    '        )',
    '',
    '        await self.clients.claim()',
    '      })(),',
    '    )',
    '  },',
    ')',
    '',
    'async function handleNavigationRequest(',
    '  request,',
    ') {',
    '  try {',
    '    const response =',
    '      await fetch(request)',
    '',
    '    if (response.ok) {',
    '      const cache =',
    '        await caches.open(',
    '          CACHE_NAME,',
    '        )',
    '',
    '      await cache.put(',
    '        createScopedUrl(',
    "          'index.html',",
    '        ),',
    '        response.clone(),',
    '      )',
    '    }',
    '',
    '    return response',
    '  } catch {',
    '    const cachedResponse =',
    '      await caches.match(',
    '        createScopedUrl(',
    "          'index.html',",
    '        ),',
    '      )',
    '',
    '    return (',
    '      cachedResponse ??',
    '      Response.error()',
    '    )',
    '  }',
    '}',
    '',
    'async function handleAssetRequest(',
    '  request,',
    ') {',
    '  const cachedResponse =',
    '    await caches.match(',
    '      request,',
    '    )',
    '',
    '  if (',
    '    cachedResponse !==',
    '    undefined',
    '  ) {',
    '    return cachedResponse',
    '  }',
    '',
    '  const response =',
    '    await fetch(request)',
    '',
    '  if (',
    '    response.ok &&',
    "    response.type !== 'opaque'",
    '  ) {',
    '    const cache =',
    '      await caches.open(',
    '        CACHE_NAME,',
    '      )',
    '',
    '    await cache.put(',
    '      request,',
    '      response.clone(),',
    '    )',
    '  }',
    '',
    '  return response',
    '}',
    '',
    "self.addEventListener(",
    "  'fetch',",
    '  (event) => {',
    '    const request =',
    '      event.request',
    '',
    '    if (',
    "      request.method !== 'GET' ||",
    "      request.headers.has('range')",
    '    ) {',
    '      return',
    '    }',
    '',
    '    const url =',
    '      new URL(',
    '        request.url,',
    '      )',
    '',
    '    if (',
    '      !isRequestInsideScope(',
    '        url,',
    '      )',
    '    ) {',
    '      return',
    '    }',
    '',
    '    if (',
    '      request.mode ===',
    "        'navigate'",
    '    ) {',
    '      event.respondWith(',
    '        handleNavigationRequest(',
    '          request,',
    '        ),',
    '      )',
    '',
    '      return',
    '    }',
    '',
    '    event.respondWith(',
    '      handleAssetRequest(',
    '        request,',
    '      ),',
    '    )',
    '  },',
    ')',
    '',
  ].join('\n')
}

async function main() {
  const relativePaths =
    (
      await collectFiles(
        distDirectory,
      )
    )
      .sort(
        (left, right) =>
          left.localeCompare(
            right,
          ),
      )

  if (
    !relativePaths.includes(
      'index.html',
    )
  ) {
    throw new Error(
      'dist/index.html não foi encontrado.',
    )
  }

  if (
    !relativePaths.includes(
      'manifest.webmanifest',
    )
  ) {
    throw new Error(
      'dist/manifest.webmanifest não foi encontrado.',
    )
  }

  const buildVersion =
    await createBuildVersion(
      relativePaths,
    )

  const source =
    createServiceWorkerSource(
      relativePaths,
      buildVersion,
    )

  await fs.writeFile(
    path.join(
      distDirectory,
      serviceWorkerFileName,
    ),
    source,
    'utf8',
  )

  console.log(
    `Service Worker offline gerado: ${relativePaths.length} arquivos em cache, versão ${buildVersion}.`,
  )
}

await main()
