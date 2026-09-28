import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { fileURLToPath, URL } from 'node:url'

// 소스맵은 Sentry 업로드 토큰이 있는 빌드(스테이징·운영)에서만 만들고,
// 업로드 뒤 dist 에서 지워 원본 소스가 배포되지 않게 한다.
// 토큰은 빌드 환경변수로만 넣는다(VITE_ 접두사 금지 — 번들에 들어간다).
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryAuthToken
      ? sentryVitePlugin({
          authToken: sentryAuthToken,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          sourcemaps: {
            filesToDeleteAfterUpload: ['./dist/**/*.map'],
          },
          telemetry: false,
        })
      : null,
  ],
  build: {
    sourcemap: sentryAuthToken ? 'hidden' : false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
