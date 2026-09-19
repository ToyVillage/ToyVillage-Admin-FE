import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  BackLinkSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `업무보고 상세 (스켈레톤)`(2021:20919).
export function TaskReportDetailSkeleton() {
  return (
    <SkeletonStatus>
      <BackLinkSkeleton />
      <Meta>
        <Skeleton width={70} height={20} />
        <Skeleton width={40} height={40} />
        <Skeleton width={30} height={20} />
        <Skeleton width={80} height={40} />
        <Skeleton width={130} height={20} />
        <Skeleton width={220} height={20} />
      </Meta>
      <Cards>
        <SkeletonCard gap={24}>
          <Skeleton width={150} height={32} />
          <Skeleton width="80%" height={20} />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton width={70} height={18} />
          <AttachmentChipsSkeleton />
        </SkeletonCard>
      </Cards>
      <Actions>
        <Outline>
          <Skeleton width={76} height={18} />
        </Outline>
        <Skeleton width={120} height={60} radius={12} />
      </Actions>
    </SkeletonStatus>
  )
}

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 48px;
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 32px;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  margin-top: 64px;
`

const Outline = styled.div`
  display: flex;
  height: 60px;
  align-items: center;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 12px;
`
