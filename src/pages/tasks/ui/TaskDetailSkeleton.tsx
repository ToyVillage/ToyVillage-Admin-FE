import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  BackLinkSkeleton,
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

const CHECKLIST_ROWS = 4

// Figma `업무 상세 (스켈레톤)`(2021:20692).
export function TaskDetailSkeleton() {
  return (
    <SkeletonStatus>
      <TopRow>
        <BackLinkSkeleton />
        <Skeleton width={8} height={32} />
      </TopRow>
      <Cards>
        <SkeletonCard row gap={24}>
          <FieldSkeleton label={40} value={110} />
          <FieldSkeleton label={30} value={70} />
          <FieldSkeleton label={52} value={42} />
          <FieldSkeleton label={52} value={127} />
        </SkeletonCard>
        <SkeletonCard gap={24}>
          <Skeleton width={150} height={32} />
          <Skeleton width="80%" height={20} />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton width={70} height={18} />
          <AttachmentChipsSkeleton />
        </SkeletonCard>
        <Bottom>
          <SkeletonCard>
            <Skeleton width={80} height={20} />
            {Array.from({ length: CHECKLIST_ROWS }, (_, index) => (
              <CheckRow key={index}>
                <Skeleton width={54} height={16} />
                <Skeleton width={60} height={32} />
              </CheckRow>
            ))}
          </SkeletonCard>
          <PhotoCard>
            <Skeleton width={46} height={18} />
            <Skeleton width={160} height={160} radius={12} />
            <Skeleton width={300} height={14} />
          </PhotoCard>
        </Bottom>
      </Cards>
    </SkeletonStatus>
  )
}

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 64px;
`

const Bottom = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 868fr) minmax(0, 420fr);
  gap: 32px;
  align-items: start;
`

const CheckRow = styled.div`
  display: flex;
  height: 68px;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
`

const PhotoCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`
