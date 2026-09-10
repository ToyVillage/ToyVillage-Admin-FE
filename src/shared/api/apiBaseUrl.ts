// 로컬 백엔드를 붙일 때만 평문 HTTP 를 허용한다.
const loopbackHosts = ['localhost', '127.0.0.1', '[::1]']

// proxy 를 걷어낸 뒤로 Bearer 토큰이 이 주소로 그대로 실려 나간다.
// 평문 HTTP 로 새어 나가지 않도록 기동 시 한 번 검사한다.
export function assertSecureApiBaseUrl(
  value: string | undefined,
): asserts value is string {
  if (!value) {
    throw new Error('VITE_API_BASE_URL 환경 변수가 필요합니다.')
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('VITE_API_BASE_URL 은 절대 URL 이어야 합니다.')
  }

  if (url.protocol === 'https:') return
  if (url.protocol === 'http:' && loopbackHosts.includes(url.hostname)) return

  throw new Error(
    'VITE_API_BASE_URL 은 HTTPS 여야 합니다(로컬 loopback 주소만 HTTP 허용).',
  )
}
