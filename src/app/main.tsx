import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders } from '@/app/providers/AppProviders'
import { App } from '@/app/App'
import { configureApiAuthentication } from '@/app/config/configureApiAuthentication'
import '@/app/styles/global.css'

// vite proxy를 제거했으므로 API 주소는 환경 변수로만 정한다.
// 값이 없으면 조용히 404가 나는 대신 즉시 실패시킨다.
if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL 환경 변수가 필요합니다.')
}

configureApiAuthentication()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
