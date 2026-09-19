import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'

interface ShortcutButtonProps {
  children: ReactNode
  /** 이동할 경로. 없으면 버튼으로 그리고 `onClick` 으로 동작한다. */
  to?: string
  onClick?: () => void
  /** 갈 곳을 아직 모를 때(연관 id 로딩·조회 실패). 같은 모양이되 눌리지 않는다. */
  disabled?: boolean
  ariaLabel?: string
}

// 개체 상세의 `먹이 급여 기록 확인하기`(Figma basic info 액션)와 같은 규격의
// 파란 바로가기 버튼. 카드에서 연관 화면으로 넘어갈 때 쓴다.
export function ShortcutButton({
  children,
  to,
  onClick,
  disabled = false,
  ariaLabel,
}: ShortcutButtonProps) {
  const content = (
    <>
      {children}
      <ChevronRightIcon viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 4 8 8-8 8" />
      </ChevronRightIcon>
    </>
  )

  if (disabled) {
    return (
      <ShortcutText aria-disabled="true" aria-label={ariaLabel}>
        {content}
      </ShortcutText>
    )
  }

  if (to) {
    return (
      <ShortcutLink to={to} aria-label={ariaLabel}>
        {content}
      </ShortcutLink>
    )
  }

  return (
    <Shortcut type="button" onClick={onClick} aria-label={ariaLabel}>
      {content}
    </Shortcut>
  )
}

const Shortcut = styled.button`
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;

  &[aria-disabled='true'] {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`

// 같은 모양으로 링크·비활성 표시를 그린다(모양은 위 버튼 하나가 소유한다).
const ShortcutLink = Shortcut.withComponent(Link)
const ShortcutText = Shortcut.withComponent('span')

const ChevronRightIcon = styled.svg`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
`
