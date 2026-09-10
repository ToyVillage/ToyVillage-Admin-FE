import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers/AppProviders'
import { App } from '@/app/App'
import { configureApiAuthentication } from '@/app/config/configureApiAuthentication'
import { assertSecureApiBaseUrl } from '@/shared/api/apiBaseUrl'
import '@/app/styles/global.css'

// vite proxy를 제거했으므로 API 주소는 환경 변수로만 정한다.
// 없거나 평문 HTTP 면 조용히 404·토큰 노출로 가는 대신 즉시 실패시킨다.
assertSecureApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

configureApiAuthentication()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
