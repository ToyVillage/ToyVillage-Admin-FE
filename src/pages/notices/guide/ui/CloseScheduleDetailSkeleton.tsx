import styled from '@emotion/styled'
import {
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `휴관일 상세 (스켈레톤)`(2021:20089). 뒤로가기는 페이지가 그린다.
export function CloseScheduleDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Cards>
        <SkeletonCard row gap={160}>
          <FieldSkeleton label={50} value={110} width={240} />
          <FieldSkeleton label={50} value={110} width={240} />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton width={180} height={32} />
        </SkeletonCard>
      </Cards>
    </SkeletonStatus>
  )
}

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`
