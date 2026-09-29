import styled from '@emotion/styled'
import {
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `휴관일 상세 (스켈레톤)`(2238:19977) — 뒤로가기·필드 라벨은 실제 UI 이고
// 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
export function CloseScheduleDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Cards>
        <SkeletonCard row gap={160}>
          <FieldSkeleton label="시작일" value={110} width={240} />
          <FieldSkeleton label="종료일" value={110} width={240} />
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
