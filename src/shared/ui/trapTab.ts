const focusableSelector = 'input:not([disabled]), button:not([disabled])'

// 모달 안에서 Tab / Shift+Tab 이 첫·마지막 요소를 넘어가지 않게 되돌린다.
// `inert` 만으로는 페이지 밖(브라우저 UI)으로 초점이 빠져나가는 것을 막지 못한다.
// 초점 대상이 바뀔 수 있어 매번 다시 찾는다.
export function trapTab(dialog: HTMLElement | null, event: KeyboardEvent) {
  if (!dialog) return

  const focusables = [
    ...dialog.querySelectorAll<HTMLElement>(focusableSelector),
  ]
  if (focusables.length === 0) return

  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const active = document.activeElement

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
    return
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
