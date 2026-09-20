import styled from '@emotion/styled'
import { Skeleton } from './Skeleton'

interface PaginationSkeletonProps {
  placement?: 'inside' | 'outside'
}

// Figma 스켈레톤 `Frame 240`(224x32) — `DataTable` 페이지네이션 자리.
export function PaginationSkeleton({
  placement = 'inside',
}: PaginationSkeletonProps) {
  return (
    <Pagination $placement={placement}>
      <Skeleton width={20} height={20} />
      <Pages>
        <PageCell>
          <Skeleton width={12} height={16} />
        </PageCell>
        <PageCell $active>
          <Skeleton width={14} height={19} />
        </PageCell>
        <PageCell>
          <Skeleton width={12} height={16} />
        </PageCell>
      </Pages>
      <Skeleton width={20} height={20} />
    </Pagination>
  )
}

const Pagination = styled.div<{ $placement: 'inside' | 'outside' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  ${({ $placement }) =>
    $placement === 'outside' ? 'margin-top: 48px;' : 'padding: 24px 0;'}
`

const Pages = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`

const PageCell = styled.div<{ $active?: boolean }>`
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accentBg : 'transparent'};
`
