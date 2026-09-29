import { Navigate, Outlet } from 'react-router-dom'
import { loginPath, readAccessToken } from '@/shared/api/session'

// 토큰 없이 보호 경로에 들어오면 화면을 그리지 않고 로그인으로 보낸다.
export function RequireAuth() {
  if (!readAccessToken()) {
    return <Navigate to={loginPath} replace />
  }

  return <Outlet />
}
