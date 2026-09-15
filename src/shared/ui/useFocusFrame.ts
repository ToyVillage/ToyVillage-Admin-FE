import { useCallback, useEffect, useRef } from 'react'

/**
 * 다음 프레임에 초점을 되돌린다 — 모달·메뉴 cleanup 이 `inert` 를 푼 뒤에 옮겨야 한다.
 * 예약은 다음 호출과 언마운트 때 취소한다(사라진 화면의 노드를 건드리지 않는다).
 * `getTarget` 은 예약이 실행될 때 평가하므로, 삭제된 행처럼 사라진 버튼이면 아무 일도 하지 않는다.
 */
export function useFocusFrame() {
  const frameRef = useRef(0)

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  return useCallback((getTarget: () => HTMLElement | null | undefined) => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => getTarget()?.focus())
  }, [])
}
