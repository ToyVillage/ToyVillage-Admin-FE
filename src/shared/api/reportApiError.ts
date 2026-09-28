import { AxiosError, isAxiosError } from 'axios'
import * as Sentry from '@sentry/react'

// 5xx·네트워크 에러·타임아웃만 보낸다. 401/403 은 토큰 재발급 흐름이고
// 그 밖의 4xx 는 화면이 처리하는 정상 응답이다. Sentry 가 꺼져 있으면 아무것도 하지 않는다.
export function reportApiError(error: unknown): void {
  if (!isAxiosError(error) || !shouldReport(error)) return

  const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN'
  const path = toPathPattern(error.config?.url)
  const status = error.response?.status ?? error.code ?? 'NETWORK'

  Sentry.captureException(error, {
    tags: { 'api.method': method, 'api.path': path, 'api.status': status },
    // axios 에러는 스택이 모두 같아 한 이슈로 뭉친다. API·상태별로 나눈다.
    fingerprint: ['api', method, path, String(status)],
  })
}

function shouldReport(error: AxiosError): boolean {
  if (error.code === AxiosError.ERR_CANCELED) return false

  const status = error.response?.status
  return status === undefined || status >= 500
}

// `/tasks/12` → `/tasks/:id`. 같은 API 가 ID 마다 따로 묶이지 않게 한다.
function toPathPattern(url = ''): string {
  return url.split('?')[0].replace(/\/\d+(?=\/|$)/g, '/:id')
}
