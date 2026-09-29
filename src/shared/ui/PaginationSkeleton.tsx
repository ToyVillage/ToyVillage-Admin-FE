import styled from '@emotion/styled'
import chevronIcon from './assets/chevron-left.svg'
import { Skeleton } from './Skeleton'

interface PaginationSkeletonProps {
  placement?: 'inside' | 'outside'
}

// Figma 스켈레톤 `Frame 240`(224x32) — 화살표는 실제 아이콘이고 번호 자리만 막대다.
export function PaginationSkeleton({
  placement = 'inside',
}: PaginationSkeletonProps) {
  return (
    <Pagination $placement={placement}>
      <ChevronIcon src={chevronIcon} alt="" aria-hidden="true" />
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
      <ChevronIcon src={chevronIcon} alt="" aria-hidden="true" $flip />
    </Pagination>
  )
}

const ChevronIcon = styled.img<{ $flip?: boolean }>`
  width: 20px;
  height: 20px;
  opacity: 0.4;
  transform: ${({ $flip }) => ($flip ? 'rotate(180deg)' : 'none')};
`

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
