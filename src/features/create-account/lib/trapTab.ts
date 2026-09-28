// 모달 안에서 Tab / Shift+Tab 이 첫·마지막 요소를 넘어가지 않게 되돌린다.
// 팀 관리 모달(`features/team-settings/lib/trapTab`)과 같은 계약이다.
const focusableSelector = 'input:not([disabled]), button:not([disabled])'

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
