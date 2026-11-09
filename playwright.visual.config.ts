import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// 퍼블리싱 하네스 ⑥ Figma 스크린샷 비교 설정. `yarn verify:e2e <feature>`가 기준 이미지가 있을 때 실행한다.
// 기준 이미지는 ①에서 Figma MCP로 내려받아 ② 승인 때 해시로 묶은 harness/publishing/baselines/<feature>/*.png 이다.
// Mac 과 CI(Linux)는 글자 렌더링이 달라 결과가 흔들리므로 CI 의 e2e 실행(tests/e2e)에는 넣지 않는다.
const webServers = Array.isArray(base.webServer)
  ? base.webServer
  : base.webServer
    ? [base.webServer]
    : []

export default defineConfig({
  ...base,
  testDir: './tests/visual',
  testMatch: '**/*.visual.ts',
  // toHaveScreenshot(['<feature>', '<frame>.png']) → harness/publishing/baselines/<feature>/<frame>.png
  snapshotPathTemplate: './harness/publishing/baselines/{arg}{ext}',
  // 기준 이미지가 없을 때 구현 화면으로 새로 만들지 않는다. 기준은 Figma 에서만 온다.
  updateSnapshots: 'none',
  expect: {
    ...base.expect,
    toHaveScreenshot: {
      // 1920×1080 로그인 화면 시험에서 에러 문구 한 줄이 빠진 차이도 전체의 1% 안에 들었다.
      // 그래서 0.1% 로 둔다. 글자 렌더링 차이로 흔들리면 화면을 영역별로 잘라 비교한다.
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  // 기능 테스트용 dev 서버 하나만 쓴다(GA·Sentry 검증 서버 불필요).
  webServer: webServers.slice(0, 1),
})
