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
            // 세션 녹화 라이브러리는 첫 화면 뒤에 불러오므로 $initial 을 붙이지 않는다.
            // 녹화 설정 코드(sentryReplay.ts)가 앱 코드를 import 해 그 청크 이름이 배포마다 바뀌어서,
            // 라이브러리만 따로 떼어 화면 코드만 바뀐 배포에서는 다시 받지 않게 한다.
            // 그룹은 앞에서부터 모듈을 가져가므로 맨 뒤에 둔다. 앞에 두면 녹화 라이브러리가 쓰는
            // @sentry/core 같은 첫 화면 모듈까지 끌어와 첫 로딩에 녹화 청크가 붙는다.
            {
              name: 'replay',
              test: /[\\/]node_modules[\\/]@sentry[\\/]replay[\\/]/,
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
