import styled from '@emotion/styled'
import {
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `휴관일 수정 (스켈레톤)`(2021:22592). 뒤로가기는 `CloseScheduleFormPage` 가 그린다.
export function CloseScheduleEditSkeleton() {
  return (
    <SkeletonStatus>
      <Dates>
        <SkeletonCard>
          <FieldSkeleton label={50} value={140} box />
        </SkeletonCard>
        <SkeletonCard>
          <FieldSkeleton label={50} value={140} box />
        </SkeletonCard>
      </Dates>
      <Reason>
        <SkeletonCard>
          <FieldSkeleton label={40} value={200} box />
        </SkeletonCard>
      </Reason>
      <Footer>
        <Skeleton width={120} height={56} radius={12} />
      </Footer>
    </SkeletonStatus>
  )
}

const Dates = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 420px));
  gap: 20px;
`

const Reason = styled.div`
  margin-top: 24px;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`
