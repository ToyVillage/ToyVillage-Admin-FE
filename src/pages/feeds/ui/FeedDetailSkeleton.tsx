import styled from '@emotion/styled'
import { Skeleton, SkeletonStatus, TableSkeleton } from '@/shared/ui'

// Figma `먹이 급여 상세 (스켈레톤)`(2021:22217). 뒤로가기는 페이지가 그린다.
export function FeedDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Record>
        <Skeleton width={180} height={180} radius={12} />
        <Info>
          <Row>
            <Skeleton width={90} height={28} />
            <Skeleton width={90} height={28} />
          </Row>
          <Row>
            <Skeleton width={60} height={18} />
            <Skeleton width={180} height={18} />
          </Row>
          <Row>
            <Skeleton width={60} height={18} />
            <Skeleton width={40} height={18} />
          </Row>
          <Row>
            <Skeleton width={60} height={18} />
            <Skeleton width={320} height={18} />
          </Row>
        </Info>
        <Skeleton width={260} height={56} radius={12} />
      </Record>
      <SectionHeader>
        <Skeleton width={120} height={24} />
        <Skeleton width={30} height={20} />
      </SectionHeader>
      <TableScroll>
        <TableSkeleton
          appearance={{ offsetTop: 20, dividerColor: 'textGuide' }}
          columns={[
            { width: 280, bar: 170, barHeight: 18 },
            { width: 200, bar: 40, barHeight: 18 },
            { width: 260, bar: 110, barHeight: 18 },
            { bar: 360, barHeight: 18 },
          ]}
          rows={3}
        />
      </TableScroll>
    </SkeletonStatus>
  )
}

const Record = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 40px;
  margin-top: 40px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const Info = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`

// 실제 급여 이력 표처럼 좁은 화면에서는 표만 가로로 스크롤한다.
const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 60px;
`
