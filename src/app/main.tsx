import '@/app/instrument'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { AppProviders } from '@/app/providers/AppProviders'
import { App } from '@/app/App'
import { configureApiAuthentication } from '@/app/config/configureApiAuthentication'
import { initAnalytics } from '@/shared/lib'
import '@/app/styles/global.css'

configureApiAuthentication()
initAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID)

// 라우터 밖(Provider 등)에서 난 렌더 에러를 컴포넌트 스택과 함께 보낸다.
// 라우터 안의 에러는 RouteErrorPage 가 보낸다.
createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
