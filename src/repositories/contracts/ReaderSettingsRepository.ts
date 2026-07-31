import type { ReaderSettings } from '@/models/entities/ReaderSettings'

export interface ReaderSettingsRepository {
  save(settings: ReaderSettings): Promise<void>

  find(): Promise<ReaderSettings | null>

  delete(): Promise<void>
}