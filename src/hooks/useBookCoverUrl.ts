import {
  useEffect,
  useMemo,
} from 'react'

import type {
  BookCover,
} from '@/models/entities/BookCover'

interface CachedObjectUrl {
  readonly url: string

  consumers: number

  revokeTimer:
    ReturnType<typeof globalThis.setTimeout> | null
}

const objectUrlCache =
  new WeakMap<Blob, CachedObjectUrl>()

function canCreateObjectUrl(): boolean {
  return (
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  )
}

function revokeObjectUrlSafely(
  objectUrl: string,
): void {
  if (
    typeof URL === 'undefined' ||
    typeof URL.revokeObjectURL !== 'function'
  ) {
    return
  }

  URL.revokeObjectURL(objectUrl)
}

function getOrCreateCachedObjectUrl(
  image: Blob,
): CachedObjectUrl {
  const cachedEntry =
    objectUrlCache.get(image)

  if (cachedEntry !== undefined) {
    return cachedEntry
  }

  const newEntry: CachedObjectUrl = {
    url: URL.createObjectURL(image),
    consumers: 0,
    revokeTimer: null,
  }

  objectUrlCache.set(
    image,
    newEntry,
  )

  return newEntry
}

function retainObjectUrl(
  image: Blob,
): string {
  const cachedEntry =
    getOrCreateCachedObjectUrl(image)

  if (cachedEntry.revokeTimer !== null) {
    globalThis.clearTimeout(
      cachedEntry.revokeTimer,
    )

    cachedEntry.revokeTimer = null
  }

  cachedEntry.consumers += 1

  return cachedEntry.url
}

function releaseObjectUrl(
  image: Blob,
  objectUrl: string,
): void {
  const cachedEntry =
    objectUrlCache.get(image)

  if (
    cachedEntry === undefined ||
    cachedEntry.url !== objectUrl
  ) {
    return
  }

  cachedEntry.consumers = Math.max(
    0,
    cachedEntry.consumers - 1,
  )

  if (cachedEntry.consumers > 0) {
    return
  }

  cachedEntry.revokeTimer =
    globalThis.setTimeout(() => {
      const currentEntry =
        objectUrlCache.get(image)

      if (
        currentEntry === undefined ||
        currentEntry.url !== objectUrl ||
        currentEntry.consumers > 0
      ) {
        return
      }

      revokeObjectUrlSafely(
        currentEntry.url,
      )

      objectUrlCache.delete(image)
    }, 0)
}

export function useBookCoverUrl(
  bookCover: BookCover | null,
): string | null {
  const coverImage =
    bookCover?.image ?? null

  const coverUrl = useMemo(() => {
    if (
      coverImage === null ||
      !canCreateObjectUrl()
    ) {
      return null
    }

    return getOrCreateCachedObjectUrl(
      coverImage,
    ).url
  }, [coverImage])

  useEffect(() => {
    if (
      coverImage === null ||
      coverUrl === null
    ) {
      return
    }

    retainObjectUrl(coverImage)

    return () => {
      releaseObjectUrl(
        coverImage,
        coverUrl,
      )
    }
  }, [
    coverImage,
    coverUrl,
  ])

  return coverUrl
}