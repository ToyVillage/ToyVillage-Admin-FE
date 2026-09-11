import styled from '@emotion/styled'
import type { TaskReportReviewStatus } from '../model/types'

export interface TaskReportSummaryItem {
  /** 업무보고 id. 아직 제출되지 않았으면 null 이고 열 보고가 없어 누를 수 없다. */
  reportId: string | null
  assigneeName: string
  reviewStatus: TaskReportReviewStatus
}

interface TaskReportSummaryCardProps {
  items: TaskReportSummaryItem[]
  onSelect: (reportId: string) => void
}

// 업무 상세의 심사 상태 배지는 `승인` 을 그대로 쓴다.
// 업무보고 목록·상세의 탭 라벨(`완료`)과 문구가 달라 여기서만 쓰는 표를 둔다(spec 근거: Figma 152:11510).
const reviewStatusLabels: Record<TaskReportReviewStatus, string> = {
  APPROVED: '승인',
  REJECTED: '반려',
  PENDING: '심사대기',
  RESUBMITTED: '재제출',
}

// Figma `report summary`(yot 152:11510). 담당자별 업무보고 목록.
export function TaskReportSummaryCard({
  items,
  onSelect,
}: TaskReportSummaryCardProps) {
  return (
    <Card>
      <Title>업무 보고</Title>
      {items.length > 0 ? (
        <List>
          {items.map((item, index) => {
            const badge = (
              <Badge $status={item.reviewStatus}>
                {reviewStatusLabels[item.reviewStatus]}
              </Badge>
            )

            // 아직 제출되지 않은 줄은 열 보고가 없다. 누를 수 없는 줄로 그려
            // chevron 도 빼둔다(배지는 그대로 `심사대기`).
            if (item.reportId === null) {
              return (
                <StaticItem
                  key={`no-report-${item.assigneeName}-${index}`}
                  data-testid="task-report-row"
                >
                  <Name>{item.assigneeName}</Name>
                  {badge}
                </StaticItem>
              )
            }

            const reportId = item.reportId

            return (
              <Item
                key={reportId}
                type="button"
                data-testid="task-report-row"
                onClick={() => onSelect(reportId)}
              >
                <Name>{item.assigneeName}</Name>
                {badge}
                <Chevron viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m9 4 8 8-8 8" />
                </Chevron>
              </Item>
            )
          })}
        </List>
      ) : (
        <EmptyText>제출된 업무 보고가 없습니다.</EmptyText>
      )}
    </Card>
  )
}

const Card = styled.section`
  display: flex;
  min-width: 0;
  flex: 1 1 868px;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    flex-basis: auto;
    padding: 24px;
  }
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

// 항목 788×68, pitch 88px(높이 68 + gap 20).
const Item = styled.button`
  display: flex;
  min-height: 68px;
  align-items: center;
  gap: 16px;
  padding: 0 30px 0 24px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

// 제출 전 줄. 항목과 같은 크기·간격을 쓰되 버튼이 아니다.
const StaticItem = styled.div`
  display: flex;
  min-height: 68px;
  align-items: center;
  gap: 16px;
  padding: 0 30px 0 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
`

const Name = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Badge = styled.span<{ $status: TaskReportReviewStatus }>`
  display: inline-flex;
  min-width: 76px;
  height: 40px;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  padding: 8px 12px;
  border-radius: 80px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  ${({ theme, $status }) => {
    if ($status === 'APPROVED') {
      return `background: ${theme.colors.accentBg}; color: ${theme.colors.accent};`
    }
    if ($status === 'REJECTED') {
      return `background: ${theme.colors.warningBg}; color: ${theme.colors.warning};`
    }
    return `background: ${theme.colors.tableHeaderStrong}; color: ${theme.colors.textGuide};`
  }}
`

const Chevron = styled.svg`
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  fill: none;
  stroke: ${({ theme }) => theme.colors.textGuide};
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
`

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
