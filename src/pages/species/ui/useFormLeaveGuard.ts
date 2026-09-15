import { useCallback, useRef, useState } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'

// 등록·수정 화면 이탈 보호(CreateTaskPage·EditTaskPage 승계). 폼이 알려준 변경 여부로
// 뒤로가기·사이드바·브라우저 뒤로가기를 막고, 새로고침·탭 닫기는 브라우저 기본 확인을 띄운다.
// 생성·저장 성공 이동 직전에 `allowNavigation` 을 불러 확인 없이 나간다.
export function useFormLeaveGuard() {
  const allowNavigationRef = useRef(false)
  const [isDirty, setIsDirty] = useState(false)
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        !allowNavigationRef.current &&
        isDirty &&
        currentLocation.pathname !== nextLocation.pathname,
      [isDirty],
    ),
  )

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!isDirty || allowNavigationRef.current) return
        event.preventDefault()
        event.returnValue = ''
      },
      [isDirty],
    ),
  )

  const allowNavigation = useCallback(() => {
    allowNavigationRef.current = true
  }, [])

  return { blocker, setIsDirty, allowNavigation }
}
