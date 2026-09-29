import { useEffect, useRef } from 'react'
import { matchRoutes, useLocation, type RouteObject } from 'react-router-dom'
import { readAccessToken, readSessionUser } from '@/shared/api/session'
import { setAnalyticsUserProperties, trackPageView } from '@/shared/lib'

interface PageViewRouteHandle {
  skipPageView?: boolean
  requiresSession?: boolean
}

// 다른 주소로 바로 보내기만 하는 라우트. 사용자가 보지 않는 화면이라 집계하지 않는다.
export const redirectOnlyRouteHandle: PageViewRouteHandle = {
  skipPageView: true,
}

// 세션이 없으면 RequireAuth 가 로그인으로 보낸다. 그때 보호 화면은 집계하지 않는다.
export const sessionRequiredRouteHandle: PageViewRouteHandle = {
  requiresSession: true,
}

const notFoundPattern = '/(not-found)'

// 경로는 실제 주소가 아니라 `/species/:speciesId` 같은 라우트 패턴으로 보낸다.
// ID별로 페이지가 쪼개지지 않고 쿼리스트링(검색어·필터)도 GA 에 실리지 않는다.
// 같은 패턴 안에서의 이동(페이지네이션·필터, 단계 화면의 리다이렉트)은
// 같은 화면이라 페이지뷰로 세지 않는다. StrictMode 의 effect 재실행도 여기서 걸러진다.
export function usePageViewTracking(routes: RouteObject[]): void {
  const { pathname } = useLocation()
  const trackedPattern = useRef<string | null>(null)

  useEffect(() => {
    if (shouldSkipPageView(routes, pathname)) return

    const pattern = toRoutePattern(routes, pathname)
    if (trackedPattern.current === pattern) return

    const referrer = trackedPattern.current ?? toInitialReferrer(routes)
    trackedPattern.current = pattern

    // 누가 쓰는지가 아니라 역할별 사용량을 본다. 이름은 보내지 않는다.
    setAnalyticsUserProperties({ role: readSessionUser()?.role ?? null })
    trackPageView(pattern, referrer)
  }, [routes, pathname])
}

function shouldSkipPageView(routes: RouteObject[], pathname: string) {
  const handles = (matchRoutes(routes, pathname) ?? []).map(
    ({ route }) => route.handle as PageViewRouteHandle | undefined,
  )

  if (handles.some((handle) => handle?.skipPageView)) return true

  return handles.some((handle) => handle?.requiresSession) && !readAccessToken()
}

function toRoutePattern(routes: RouteObject[], pathname: string) {
  const matches = matchRoutes(routes, pathname)
  if (!matches) return notFoundPattern

  const pattern = matches.reduce((joined, { route }) => {
    if (!route.path) return joined
    if (route.path.startsWith('/')) return route.path

    return `${joined.replace(/\/$/, '')}/${route.path}`
  }, '')

  // 단계 화면의 splat(`/*`)은 같은 화면이다. 제목에 `*` 가 남지 않게 뗀다.
  return pattern.replace(/\/\*$/, '') || '/'
}

// 첫 페이지뷰의 referrer 는 브라우저 값(document.referrer)이라 쿼리와 ID 가 그대로 담긴다.
// 같은 출처면 패턴으로, 다른 출처면 출처만 남긴다.
function toInitialReferrer(routes: RouteObject[]) {
  if (!document.referrer) return undefined

  const url = new URL(document.referrer)
  if (url.origin !== window.location.origin) return url.origin

  return toRoutePattern(routes, url.pathname)
}
