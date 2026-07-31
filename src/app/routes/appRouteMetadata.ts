import {
  AppRoute,
  type AppRoute as AppRouteValue,
} from '@/app/routes/AppRoute'

export interface AppRouteMetadata {
  readonly eyebrow: string
  readonly title: string
  readonly description: string

  readonly readerMode: boolean
  readonly showLocalStatus: boolean
}

export const APP_ROUTE_METADATA: Readonly<
  Record<AppRouteValue, AppRouteMetadata>
> = {
  [AppRoute.LIBRARY]: {
    eyebrow: 'Biblioteca',
    title: 'Seus documentos',
    description:
      'Importe, organize e continue a leitura dos seus PDFs.',
    readerMode: false,
    showLocalStatus: true,
  },

  [AppRoute.READER]: {
    eyebrow: 'Leitura',
    title: 'Leitor imersivo',
    description:
      'Leia com foco, conforto e progresso salvo localmente.',
    readerMode: true,
    showLocalStatus: false,
  },

  [AppRoute.SETTINGS]: {
    eyebrow: 'Preferências',
    title: 'Configurações',
    description:
      'Personalize a exibição, a navegação e os controles do leitor.',
    readerMode: false,
    showLocalStatus: true,
  },
}

export function getAppRouteMetadata(
  route: AppRouteValue,
): AppRouteMetadata {
  return APP_ROUTE_METADATA[route]
}