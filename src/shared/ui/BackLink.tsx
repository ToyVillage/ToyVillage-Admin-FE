import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'

interface BackLinkProps {
  to: string
  children?: ReactNode
  className?: string
}

// Figma 공용 `back` 컴포넌트(1:10470). 상세 화면에서 목록으로 되돌아가는 링크.
export function BackLink({ to, children = '뒤로가기', className }: BackLinkProps) {
  return (
    <Anchor className={className} to={to}>
      <BackIcon viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 4-8 8 8 8" />
      </BackIcon>
      {children}
    </Anchor>
  )
}

const Anchor = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 4px;
  }
`

const BackIcon = styled.svg`
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.5;
`
