import { AxiosError, isAxiosError } from 'axios'
import * as Sentry from '@sentry/react'
import type { SeverityLevel } from '@sentry/react'

// 5xx·400·405 는 error, 404·409 는 warning 으로 보낸다. 401/403 은 토큰 재발급 흐름이고
// 취소된 요청은 실패가 아니다. Sentry 가 꺼져 있으면 아무것도 하지 않는다.
export function reportApiError(error: unknown): void {
  if (!isAxiosError(error)) return

  const level = reportLevel(error)
  if (!level) return

  const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN'
  const path = toPathPattern(error.config?.url)
  const status = error.response?.status ?? error.code ?? 'NETWORK'

  Sentry.captureException(error, {
    level,
    tags: { 'api.method': method, 'api.path': path, 'api.status': status },
    // axios 에러는 스택이 모두 같아 한 이슈로 뭉친다. 응답이 있는 에러는 API·상태별로 나눈다.
    // 응답이 없는 에러는 연결 문제라 여러 API 가 한꺼번에 실패하므로 종류별로 하나로 묶는다.
    fingerprint: error.response
      ? ['api', method, path, String(status)]
      : ['api', String(status)],
  })
}

// 보낼 이유가 없으면 undefined 를 준다.
function reportLevel(error: AxiosError): SeverityLevel | undefined {
  if (error.code === AxiosError.ERR_CANCELED) return undefined

  const status = error.response?.status
  if (status !== undefined) {
    // 서버는 400 을 필수값 누락·길이 초과 같은 형식 오류에만 쓰고, 화면이 같은 규칙을 먼저 막는다.
    // 그래도 400 이 오면 화면과 서버의 규칙이 어긋난 것이다.
    // 405 는 화면이 잘못된 HTTP 메서드로 불렀다는 뜻이라 사용자 입력과 무관한 프론트 버그다.
    if (status >= 500 || status === 400 || status === 405) return 'error'

    // 이미 삭제된 데이터(404)와 중복·업무 규칙 위반(409)은 화면이 처리하는 예상된 실패지만,
    // 사용자는 하려던 일에 실패한 것이라 몇 번 일어나는지 세야 한다.
    if (status === 404 || status === 409) return 'warning'

    return undefined
  }

  // 노트북이 잠들었다 깨어나 재연결될 때처럼 기기 쪽 연결이 끊긴 상태의 실패는 보내지 않는다.
  if (!navigator.onLine || document.visibilityState !== 'visible')
    return undefined

  return 'error'
}

// `/tasks/12` → `/tasks/:id`. 같은 API 가 ID 마다 따로 묶이지 않게 한다.
export function toPathPattern(url = ''): string {
  return url.split('?')[0].replace(/\/\d+(?=\/|$)/g, '/:id')
}
