import {
  AppBootstrapProvider,
} from '@/app/providers/AppBootstrapProvider'
import {
  getAppRouteMetadata,
} from '@/app/routes/appRouteMetadata'
import {
  AppRouter,
} from '@/app/routes/AppRouter'
import {
  useAppRoute,
} from '@/app/routes/useAppRoute'
import {
  AppShell,
} from '@/components/layout/AppShell'
import {
  AppTopbar,
} from '@/components/layout/AppTopbar'
import {
  AppSidebar,
} from '@/components/navigation/AppSidebar'

function AppContent() {
  const currentRoute = useAppRoute()

  const routeMetadata =
    getAppRouteMetadata(currentRoute)

  return (
    <AppShell
      readerMode={routeMetadata.readerMode}
      sidebar={<AppSidebar />}
      topbar={
        <AppTopbar title="Leitor Imersivo" />
      }
    >
      <AppRouter />
    </AppShell>
  )
}

export default function App() {
  return (
    <AppBootstrapProvider>
      <AppContent />
    </AppBootstrapProvider>
  )
}