import { AxiosError, isAxiosError } from 'axios'
import * as Sentry from '@sentry/react'

// 5xx·400·네트워크 에러·타임아웃만 보낸다. 401/403 은 토큰 재발급 흐름이고
// 404·409 같은 그 밖의 4xx 는 화면이 처리하는 정상 응답이다. Sentry 가 꺼져 있으면 아무것도 하지 않는다.
export function reportApiError(error: unknown): void {
  if (!isAxiosError(error) || !shouldReport(error)) return

  const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN'
  const path = toPathPattern(error.config?.url)
  const status = error.response?.status ?? error.code ?? 'NETWORK'

  Sentry.captureException(error, {
    tags: { 'api.method': method, 'api.path': path, 'api.status': status },
    // axios 에러는 스택이 모두 같아 한 이슈로 뭉친다. 응답이 있는 에러는 API·상태별로 나눈다.
    // 응답이 없는 에러는 연결 문제라 여러 API 가 한꺼번에 실패하므로 종류별로 하나로 묶는다.
    fingerprint: error.response
      ? ['api', method, path, String(status)]
      : ['api', String(status)],
  })
}

function shouldReport(error: AxiosError): boolean {
  if (error.code === AxiosError.ERR_CANCELED) return false

  // 서버는 400 을 필수값 누락·길이 초과 같은 형식 오류에만 쓰고, 화면이 같은 규칙을 먼저 막는다.
  // 그래도 400 이 오면 화면과 서버의 규칙이 어긋난 것이다.
  const status = error.response?.status
  if (status !== undefined) return status >= 500 || status === 400

  // 노트북이 잠들었다 깨어나 재연결될 때처럼 기기 쪽 연결이 끊긴 상태의 실패는 보내지 않는다.
  return navigator.onLine && document.visibilityState === 'visible'
}

// `/tasks/12` → `/tasks/:id`. 같은 API 가 ID 마다 따로 묶이지 않게 한다.
function toPathPattern(url = ''): string {
  return url.split('?')[0].replace(/\/\d+(?=\/|$)/g, '/:id')
}
