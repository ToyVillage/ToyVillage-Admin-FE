import type { FullConfig } from '@playwright/test'

// 로컬에서는 이미 떠 있는 dev 서버를 재사용한다. 그 서버가 GA 측정 ID·Sentry DSN 을 넣고 떠 있으면
// (.env 든 다른 셸의 환경변수든) webServer.env 의 빈 값이 적용되지 않아 테스트 방문이 GA·Sentry 로 나간다.
// Vite dev 서버는 모듈에 import.meta.env 값을 그대로 실어 보내므로, 실제로 쓰는 서버의 값을 확인한다.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) return

  const response = await fetch(new URL('/src/app/main.tsx', baseURL))
  const source = await response.text()
  const measurementId = source.match(
    /"VITE_GA_MEASUREMENT_ID":\s*"([^"]*)"/,
  )?.[1]

  if (measurementId) {
    throw new Error(
      `e2e 가 쓰는 dev 서버(${baseURL})에 GA 측정 ID(${measurementId})가 설정돼 있습니다. ` +
        '테스트 방문이 GA 로 집계되지 않도록 그 서버를 끄고 다시 실행하세요.',
    )
  }

  if (/"VITE_SENTRY_DSN":\s*"[^"]+"/.test(source)) {
    throw new Error(
      `e2e 가 쓰는 dev 서버(${baseURL})에 Sentry DSN 이 설정돼 있습니다. ` +
        '테스트 에러가 Sentry 로 나가지 않도록 그 서버를 끄고 다시 실행하세요.',
    )
  }
}
