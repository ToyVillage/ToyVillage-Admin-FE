// GA 연동 검증 전용 dev 서버. 기본 e2e 서버는 측정 ID 를 비워 GA 를 끄므로
// 가짜 측정 ID 를 넣은 서버를 따로 띄운다. gtag.js 요청은 spec 에서 가로챈다.
// 포트는 기본 서버 포트 + 1000 이다(vite 가 자동으로 고르는 옆 포트와 겹치지 않게).
const baseURL = new URL(
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
)
const analyticsPort = Number(baseURL.port || '5173') + 1000

export const analyticsMeasurementId = 'G-E2ETEST'
export const analyticsBaseURL = `${baseURL.protocol}//${baseURL.hostname}:${analyticsPort}`
export const analyticsServerPort = analyticsPort
