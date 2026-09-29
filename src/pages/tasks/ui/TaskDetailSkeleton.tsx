import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

const REPORT_ROWS = 5

// Figma `업무 상세 (스켈레톤)`(2238:20192) — 뒤로가기·⋮·필드 라벨·카드 제목은 실제 UI 이고
// 서버가 주는 값만 막대다. 상단 줄(뒤로가기·⋮)은 page 가 그린다.
export function TaskDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Cards>
        <SkeletonCard row gap={24}>
          <FieldSkeleton label="담당자" value={110} />
          <FieldSkeleton label="상태" value={70} />
          <FieldSkeleton label="우선순위" value={42} />
          <FieldSkeleton label="완료기한" value={127} />
        </SkeletonCard>
        <SkeletonCard gap={24}>
          <Skeleton width={150} height={32} />
          <Skeleton width="80%" height={20} />
        </SkeletonCard>
        <SkeletonCard>
          <CardTitle>첨부자료</CardTitle>
          <AttachmentChipsSkeleton />
        </SkeletonCard>
        <Bottom>
          <SkeletonCard gap={12}>
            <CardTitle>업무 보고</CardTitle>
            {Array.from({ length: REPORT_ROWS }, (_, index) => (
              <ReportRow key={index}>
                <Skeleton width={54} height={16} />
                <Skeleton width={60} height={32} />
              </ReportRow>
            ))}
          </SkeletonCard>
          <ProgressCard>
            <CardTitle>진행도</CardTitle>
            <Skeleton width={168} height={168} radius={84} />
            <Skeleton width={120} height={14} />
          </ProgressCard>
        </Bottom>
      </Cards>
    </SkeletonStatus>
  )
}

// 실제 카드 제목(`TaskReportSummaryCard`·`TaskProgressCard`·첨부 목록)과 같은 글자.
const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
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

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const ReportRow = styled.div`
  display: flex;
  height: 68px;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
`

const ProgressCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`
