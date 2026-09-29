// 첫 오류 줄로 스크롤만 하고 포커스는 옮기지 않는다. DOM 순서가 화면 순서라
// 문서상 첫 `FormFieldCard` 오류 줄([data-field-error="true"])이 맨 위 오류다.
export function scrollToFirstFieldError() {
  requestAnimationFrame(() => {
    const errorRow = document.querySelector<HTMLElement>(
      '[data-field-error="true"]',
    )
    errorRow?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}
