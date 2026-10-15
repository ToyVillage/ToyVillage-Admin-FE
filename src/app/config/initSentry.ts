import { useEffect } from 'react'
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { readSessionUser } from '@/shared/api/session'

// DSN 이 없으면(로컬·e2e) 켜지 않는다. 스테이징·운영 빌드 환경에만 넣는다.
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    // 직원 개인정보를 다루므로 v11 기본값(전부 수집)을 끄고 필요한 것만 연다.
    // 쿼리스트링은 검색어에 이름이 섞일 수 있어 뺀다.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: ['User-Agent'] }, response: false },
      httpBodies: [],
      urlQueryParams: false,
    },
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
        // 기본값(title·placeholder·aria-label)에 이미지 설명 alt 를 더한다.
        maskAttributes: ['title', 'placeholder', 'aria-label', 'alt'],
        // 녹화 안의 클릭 기록도 아래 beforeBreadcrumb 와 같이 라벨 값 없이 다시 만든다.
        // 녹화에는 DOM 요소 대신 녹화가 저장한 요소 정보(태그·속성)가 있다.
        beforeAddRecordingEvent(event) {
          if (event.data.tag === 'breadcrumb') {
            const breadcrumb = event.data.payload
            if (
              breadcrumb.category.startsWith('ui.') &&
              breadcrumb.message &&
              hasLabel(breadcrumb.message)
            ) {
              breadcrumb.message = describeRecordedNode(breadcrumb.data)
            }
          }

          return event
        },
      }),
    ],
    // 직원 수가 적어 샘플링하면 데이터가 거의 안 쌓인다. 전부 기록한다.
    tracesSampleRate: 1,
    // 평소에는 녹화하지 않고 에러가 난 세션만 남긴다.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    ignoreErrors: ['ResizeObserver loop'],
    beforeBreadcrumb(breadcrumb, hint) {
      if (
        breadcrumb.category?.startsWith('ui.') &&
        breadcrumb.message &&
        hasLabel(breadcrumb.message)
      ) {
        const domEvent: unknown = hint?.event
        breadcrumb.message = describeElement(
          domEvent instanceof Event ? domEvent.target : domEvent,
        )
      }

      // 이동·요청 기록의 주소에도 검색어가 남지 않게 한다.
      const data = breadcrumb.data
      if (data) {
        for (const key of ['url', 'from', 'to']) {
          if (typeof data[key] === 'string') data[key] = stripQuery(data[key])
        }
      }

      return breadcrumb
    },
    beforeSend(event) {
      // dataCollection 이 못 막는 경로 대비. 요청 헤더·본문에는 Authorization 과
      // 재발급 요청의 refresh_token 이 들어갈 수 있어 User-Agent 만 남긴다.
      if (event.request) {
        const userAgent = event.request.headers?.['User-Agent']
        event.request.headers = userAgent ? { 'User-Agent': userAgent } : {}
        delete event.request.data
        delete event.request.cookies
        delete event.request.query_string
        if (event.request.url) event.request.url = stripQuery(event.request.url)
      }

      // 로그인 응답에 사용자 ID 가 없어 이름 대신 역할만 붙인다.
      const user = readSessionUser()
      if (user) event.tags = { ...event.tags, role: user.role }

      return event
    },
  })
}

// 클릭 기록은 누른 요소를 `button[aria-label="홍길동 삭제"]`처럼 속성 값을 그대로 이어 붙여 만든다.
// 라벨에 직원·파일 이름이 들어가고, 값에 `"]` 가 섞이면 문자열에서 값만 잘라낼 수 없다.
// 그래서 라벨 속성이 보이면 문자열을 버리고 라벨 값 없이 다시 만든다.
const labelAttributes = ['aria-label', 'title', 'alt']

function hasLabel(message: string): boolean {
  return labelAttributes.some((name) => message.includes(`[${name}=`))
}

// Sentry 처럼 누른 요소에서 위로 5단계까지 `부모 > 자식` 으로 잇는다.
function describeElement(target: unknown): string {
  const parts: string[] = []
  let element = target instanceof Element ? target : null
  while (element && element.tagName !== 'HTML' && parts.length < 5) {
    const current = element
    parts.unshift(
      describeNode(current.tagName, (name) => current.getAttribute(name)),
    )
    element = current.parentElement
  }

  return parts.join(' > ') || '<unknown>'
}

function describeRecordedNode(data: unknown): string {
  const node = isRecord(data) ? data.node : null
  if (!isRecord(node) || typeof node.tagName !== 'string') return '<unknown>'
  const attributes = isRecord(node.attributes) ? node.attributes : {}

  return describeNode(node.tagName, (name) => {
    const value = attributes[name]
    return typeof value === 'string' ? value : null
  })
}

// 태그·id·class·type·name 은 값을 남기고, 라벨 속성은 이름만 남긴다.
function describeNode(
  tagName: string,
  getAttribute: (name: string) => string | null,
): string {
  let text = tagName.toLowerCase()
  const id = getAttribute('id')
  if (id) text += `#${id}`
  const className = getAttribute('class')?.trim()
  if (className) text += `.${className.split(/\s+/).join('.')}`
  for (const name of ['type', 'name']) {
    const value = getAttribute(name)
    if (value) text += `[${name}="${value}"]`
  }
  for (const name of labelAttributes) {
    if (getAttribute(name) !== null) text += `[${name}]`
  }

  return text
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// 목록 화면의 검색어·필터에 직원 이름이 섞일 수 있어 쿼리스트링을 뗀다.
function stripQuery(url: string): string {
  return url.split('?')[0]
}
