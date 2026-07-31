import {
  AppBootstrapProvider,
} from '@/app/providers/AppBootstrapProvider'
import {
  AppRouter,
} from '@/app/routes/AppRouter'
import {
  AppShell,
} from '@/components/layout/AppShell'
import {
  AppTopbar,
} from '@/components/layout/AppTopbar'
import {
  AppSidebar,
} from '@/components/navigation/AppSidebar'

export default function App() {
  return (
    <AppBootstrapProvider>
      <AppShell
        sidebar={<AppSidebar />}
        topbar={
          <AppTopbar title="Leitor Imersivo" />
        }
      >
        <AppRouter />
      </AppShell>
    </AppBootstrapProvider>
  )
}