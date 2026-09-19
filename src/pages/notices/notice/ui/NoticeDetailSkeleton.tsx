import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  BackLinkSkeleton,
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `공지사항 상세 (스켈레톤)`(2021:19967).
export function NoticeDetailSkeleton() {
  return (
    <SkeletonStatus>
      <BackLinkSkeleton />
      <Cards>
        <SkeletonCard row gap={160}>
          <FieldSkeleton label={36} value={56} width={240} />
          <FieldSkeleton label={36} value={120} width={240} />
        </SkeletonCard>
        <SkeletonCard gap={24}>
          <Skeleton width={290} height={32} />
          <Skeleton width="80%" height={20} />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton width={70} height={18} />
          <AttachmentChipsSkeleton />
        </SkeletonCard>
      </Cards>
    </SkeletonStatus>
  )
}

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 64px;
`
