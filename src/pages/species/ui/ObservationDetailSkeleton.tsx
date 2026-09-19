import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  BackLinkSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `관찰 상세 (스켈레톤)`(2021:22154).
export function ObservationDetailSkeleton() {
  return (
    <SkeletonStatus>
      <BackLinkSkeleton />
      <Header>
        <Title>
          <Skeleton width={760} height={40} />
          <Skeleton width={200} height={20} />
        </Title>
        <Skeleton width={8} height={32} />
      </Header>
      <Cards>
        <SkeletonCard>
          <Skeleton width={100} height={24} />
          <Skeleton width={420} height={20} />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton width={60} height={20} />
          <AttachmentChipsSkeleton count={1} />
        </SkeletonCard>
      </Cards>
    </SkeletonStatus>
  )
}

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 40px;
`

const Title = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 40px;
`
