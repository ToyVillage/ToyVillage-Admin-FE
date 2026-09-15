// 모달 안에서 Tab / Shift+Tab 이 첫·마지막 요소를 넘어가지 않게 되돌린다.
// `inert` 만으로는 페이지 밖(브라우저 UI)으로 포커스가 빠져나가는 것을 막지 못해
// 저장소의 다른 모달(DeleteConfirmationDialog 등)과 같은 계약을 맞춘다.
// 팀 관리 모달은 포커스 대상이 가변(직원 행 버튼)이라 매번 다시 찾는다.
const focusableSelector = 'input:not([disabled]), button:not([disabled])'

export function trapTab(dialog: HTMLElement | null, event: KeyboardEvent) {
  if (!dialog) return

  const focusables = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)]
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
