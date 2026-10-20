import { replayIntegration } from '@sentry/react'
import { describeNode, hasLabel } from '@/app/config/sentryLabel'

// 녹화 코드는 크기가 커서 첫 화면 뒤에 initSentry 가 import() 로 불러온다.
export function createReplayIntegration() {
  return replayIntegration({
    maskAllText: true,
    maskAllInputs: true,
    blockAllMedia: true,
    // 기본값(title·placeholder·aria-label)에 이미지 설명 alt 를 더한다.
    maskAttributes: ['title', 'placeholder', 'aria-label', 'alt'],
    // 녹화 안의 클릭 기록도 initSentry 의 beforeBreadcrumb 와 같이 라벨 값 없이 다시 만든다.
    // 녹화에는 DOM 요소 대신 녹화가 저장한 요소 정보(태그·속성)가 있다.
    beforeAddRecordingEvent(event) {
      if (event.data.tag === 'breadcrumb') {
        const breadcrumb = event.data.payload
        if (
          breadcrumb.category.startsWith('ui.') &&
          breadcrumb.message &&
          hasLabel(breadcrumb.message)
        ) {
          breadcrumb.message = describeRecordedNode(breadcrumb.data)
        }
      }

      return event
    },
  })
}

function describeRecordedNode(data: unknown): string {
  const node = isRecord(data) ? data.node : null
  if (!isRecord(node) || typeof node.tagName !== 'string') return '<unknown>'
  const attributes = isRecord(node.attributes) ? node.attributes : {}

  return describeNode(node.tagName, (name) => {
    const value = attributes[name]
    return typeof value === 'string' ? value : null
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
