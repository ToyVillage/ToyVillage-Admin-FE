import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers/AppProviders'
import { App } from '@/app/App'
import { configureApiAuthentication } from '@/app/config/configureApiAuthentication'
import { initAnalytics } from '@/shared/lib'
import '@/app/styles/global.css'

configureApiAuthentication()
initAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
