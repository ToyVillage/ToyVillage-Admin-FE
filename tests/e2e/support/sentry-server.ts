// Sentry 연동 검증 전용 dev 서버. 기본 e2e 서버는 DSN 을 비워 Sentry 를 끄므로
// 가짜 DSN 을 넣은 서버를 따로 띄운다. 이벤트 전송은 spec 에서 가로챈다.
// 포트는 기본 서버 포트 + 2000 이다(GA 검증 서버가 + 1000 을 쓴다).
const baseURL = new URL(
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
)
const sentryPort = Number(baseURL.port || '5173') + 2000

export const sentryDsn = 'https://public@sentry.e2e.invalid/1'
export const sentryBaseURL = `${baseURL.protocol}//${baseURL.hostname}:${sentryPort}`
export const sentryServerPort = sentryPort
