import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './motion'

/**
 * 닫힘 애니메이션이 끝날 때까지 DOM 에 남겨 둔다.
 * `open` 이 true 가 되면 렌더 중에 바로 올려 등장 애니메이션과 초점 이동이 같은 커밋에서 일어나고,
 * false 가 되면 `duration` 만큼 기다렸다가 내린다. 기다리는 동안 다시 열면 타이머를 버린다.
 * 모션 최소화 환경에서는 기다리지 않는다(전환 자체가 즉시 끝난다).
 *
 * 반환값이 true 이면 열려 있거나 닫히는 중이다 — 닫히는 중인지는 `!open` 으로 구분한다.
 */
export function useExitAnimation(open: boolean, duration: number): boolean {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (open || !mounted) return

    const timer = window.setTimeout(
      () => setMounted(false),
      prefersReducedMotion() ? 0 : duration,
    )

    return () => window.clearTimeout(timer)
  }, [duration, mounted, open])

  return mounted
}
