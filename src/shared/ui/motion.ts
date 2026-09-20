import { keyframes } from '@emotion/react'

// 화면 전체가 같은 속도감을 갖도록 전환 길이(ms)와 이징은 여기서만 정한다.
export const motionDuration = {
  // hover·선택 같은 색 전환
  color: 120,
  // 드롭다운·아코디언처럼 작은 영역이 열리고 닫힐 때
  reveal: 180,
  // 사이드바 패널·다이얼로그처럼 화면을 덮는 요소
  overlay: 240,
} as const

export const motionEasing = {
  // 들어올 때: 빠르게 출발해 부드럽게 멈춘다
  enter: 'cubic-bezier(0.2, 0, 0, 1)',
  // 나갈 때: 천천히 출발해 빠르게 사라진다
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`

// 다이얼로그: 가운데에서 살짝 커지며 나타난다.
export const popIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

// 드롭다운·케밥 메뉴: 트리거 쪽에서 내려온다.
export const dropIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

// 사이드바 패널: 화면 왼쪽 밖에서 들어오고 같은 방향으로 나간다.
export const slideInFromLeft = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`

export const slideOutToLeft = keyframes`
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
`

// 토스트: 화면 위에서 내려오고 다시 위로 올라가며 사라진다.
export const toastIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const toastOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-12px);
  }
`

// 모션 최소화를 켠 환경에서는 CSS 전환이 즉시 끝난다(global.css).
// 사라지는 애니메이션이 끝나기를 기다리는 타이머도 같이 0 으로 줄인다.
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
