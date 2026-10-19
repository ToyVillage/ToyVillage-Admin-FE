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
    // 첫 화면에 쓰는 라이브러리를 화면 코드와 다른 청크로 뗀다.
    // 화면 코드만 바뀐 배포에서는 라이브러리 청크 이름(해시)이 그대로라 다시 받지 않는다.
    // 지연 로딩되는 화면에서만 쓰는 라이브러리(pdfjs 등)는 그 화면 청크에 남긴다.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              tags: ['$initial'],
            },
            {
              name: 'sentry',
              test: /[\\/]node_modules[\\/]@sentry[\\/]/,
              tags: ['$initial'],
            },
            {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              tags: ['$initial'],
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
