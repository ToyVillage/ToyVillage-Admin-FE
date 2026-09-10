import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers/AppProviders'
import { App } from '@/app/App'
import { configureApiAuthentication } from '@/shared/api/auth'
import '@/app/styles/global.css'

configureApiAuthentication()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
