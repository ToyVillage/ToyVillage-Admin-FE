import type { ReactNode } from 'react'
import styled from '@emotion/styled'

interface SkeletonStatusProps {
  children: ReactNode
  className?: string
}

// 스켈레톤 묶음의 루트. 스크린리더에는 막대 대신 "불러오는 중" 하나만 읽힌다.
// 부모가 flex(align-items: flex-start)여도 실제 화면처럼 폭을 채운다.
export function SkeletonStatus({ children, className }: SkeletonStatusProps) {
  return (
    <Root
      className={className}
      role="status"
      aria-busy="true"
      aria-label="불러오는 중"
    >
      {children}
    </Root>
  )
}

const Root = styled.div`
  width: 100%;
  align-self: stretch;
`
