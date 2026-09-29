import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `업무보고 상세 (스켈레톤)`(2238:20288) — 뒤로가기·요약행 라벨·`첨부자료`·심사 버튼은
// 실제 UI 이고 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
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
      <Actions>
        <RejectButton type="button" disabled>
          반려하기
        </RejectButton>
        <ApproveButton type="button" disabled>
          승인하기
        </ApproveButton>
      </Actions>
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

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  margin-top: 64px;
`

// 실제 심사 버튼(`TaskReportReviewActions`)과 같은 모양. 조회 중에는 누를 수 없다.
const ReviewButton = styled.button`
  height: 60px;
  padding: 0 32px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 600;
`

const RejectButton = styled(ReviewButton)`
  border: 1px solid ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.danger};
`

const ApproveButton = styled(ReviewButton)`
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
`
