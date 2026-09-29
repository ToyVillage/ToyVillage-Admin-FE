import type { ReactNode } from 'react'
import styled from '@emotion/styled'

interface SkeletonCardProps {
  children: ReactNode
  /** 가로 배치. 기본은 세로. */
  row?: boolean
  gap?: number
  className?: string
}

// 스켈레톤 흰 카드. `FormFieldCard`·상세 카드와 같은 여백(28/32)·모서리(20).
export function SkeletonCard({
  children,
  row = false,
  gap = 16,
  className,
}: SkeletonCardProps) {
  return (
    <Card className={className} $row={row} $gap={gap}>
      {children}
    </Card>
  )
}

const Card = styled.div<{ $row: boolean; $gap: number }>`
  display: flex;
  flex-direction: ${({ $row }) => ($row ? 'row' : 'column')};
  flex-wrap: ${({ $row }) => ($row ? 'wrap' : 'nowrap')};
  gap: ${({ $gap }) => $gap}px;
  padding: 28px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`
