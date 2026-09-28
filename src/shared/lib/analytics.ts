// GA4 연동. 측정 ID가 없으면(로컬·e2e) 스크립트를 로드하지 않고
// 아래 함수는 모두 아무것도 하지 않는다.
// 이메일·이름·전화번호 같은 개인정보는 보내지 않는다(GA 약관 위반).

type Gtag = (...args: unknown[]) => void

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[]
}

const measurementIdPattern = /^G-[A-Z0-9]+$/

let gtag: Gtag | null = null

export function initAnalytics(measurementId: string | undefined): void {
  if (!measurementId || gtag) return

  // 분석 설정이 틀렸다고 앱을 멈추지 않는다. 수집만 끈다.
  if (!measurementIdPattern.test(measurementId)) {
    console.warn('VITE_GA_MEASUREMENT_ID 는 G-XXXX 형식이어야 합니다.')
    return
  }

  const dataLayer = ((window as AnalyticsWindow).dataLayer ??= [])

  gtag = function () {
    // gtag.js 는 배열이 아니라 arguments 객체를 넣어야 명령으로 처리한다.
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments)
  }

  gtag('js', new Date())
  // SPA 라 페이지뷰는 라우트가 바뀔 때 trackPageView 로 직접 보낸다.
  gtag('config', measurementId, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.append(script)
}

// path 는 `/species/:speciesId` 같은 라우트 패턴이다. 제목도 같은 값으로 고정해
// 화면 제목에 섞인 값이 GA 에 실리지 않게 한다.
export function trackPageView(path: string): void {
  if (!gtag) return

  const page = {
    page_location: new URL(path, window.location.origin).href,
    page_title: path,
  }

  // 이후 자동 수집 이벤트도 실제 주소 대신 패턴 주소를 쓰게 한다.
  gtag('set', page)
  gtag('event', 'page_view', page)
}

export function setAnalyticsUserProperties(
  properties: Record<string, string | null>,
): void {
  gtag?.('set', 'user_properties', properties)
}
