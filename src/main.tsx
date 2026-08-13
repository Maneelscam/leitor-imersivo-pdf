import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

import { appThemeService } from '@/services/settings/AppThemeService'

appThemeService.initializeFromCache()

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <App />
  </StrictMode>,
)