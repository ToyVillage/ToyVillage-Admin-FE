import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `업무보고 상세 (스켈레톤)`(2238:20288) — 뒤로가기·요약행 라벨·`첨부자료`는
// 실제 UI 이고 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
// 심사 버튼은 심사 가능 상태에서만 그리므로 상태를 알기 전인 스켈레톤에는 두지 않는다.
export function TaskReportDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Meta>
        <MetaLabel>우선순위:</MetaLabel>
        <Skeleton width={40} height={40} />
        <MetaLabel>상태:</MetaLabel>
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
          <CardTitle>첨부자료</CardTitle>
          <AttachmentChipsSkeleton />
        </SkeletonCard>
      </Cards>
    </SkeletonStatus>
  )
}

// 실제 요약행(`TaskReportMetaRow`)과 같은 라벨.
const MetaLabel = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

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
