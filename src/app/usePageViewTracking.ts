import { useEffect, useRef } from 'react'
import { matchRoutes, useLocation, type RouteObject } from 'react-router-dom'
import { readSessionUser } from '@/shared/api/session'
import { setAnalyticsUserProperties, trackPageView } from '@/shared/lib'

// 경로는 실제 주소가 아니라 `/species/:speciesId` 같은 라우트 패턴으로 보낸다.
// ID별로 페이지가 쪼개지지 않고 쿼리스트링(검색어·필터)도 GA 에 실리지 않는다.
// 같은 패턴 안에서의 이동(페이지네이션·필터, 단계 화면의 리다이렉트)은
// 같은 화면이라 페이지뷰로 세지 않는다. StrictMode 의 effect 재실행도 여기서 걸러진다.
export function usePageViewTracking(routes: RouteObject[]): void {
  const { pathname } = useLocation()
  const trackedPattern = useRef<string | null>(null)

  useEffect(() => {
    const pattern = toRoutePattern(routes, pathname)
    if (!pattern || trackedPattern.current === pattern) return
    trackedPattern.current = pattern

    // 누가 쓰는지가 아니라 역할별 사용량을 본다. 이름은 보내지 않는다.
    setAnalyticsUserProperties({ role: readSessionUser()?.role ?? null })
    trackPageView(pattern)
  }, [routes, pathname])
}

function toRoutePattern(routes: RouteObject[], pathname: string) {
  const matches = matchRoutes(routes, pathname)
  if (!matches) return null

  return matches.reduce((pattern, { route }) => {
    if (!route.path) return pattern
    if (route.path.startsWith('/')) return route.path

    return `${pattern.replace(/\/$/, '')}/${route.path}`
  }, '')
}
