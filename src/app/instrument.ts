import { initSentry } from '@/app/config/initSentry'

// App 모듈이 라우터를 만들기 전에 Sentry 를 켜야 라우터 연동이 붙는다.
// main.tsx 에서 가장 먼저 import 한다.
initSentry()
