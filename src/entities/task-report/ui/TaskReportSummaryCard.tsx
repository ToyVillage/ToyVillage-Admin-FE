import styled from '@emotion/styled'
import {
  TaskReportReviewBadge,
  type TaskReportBadgeStatus,
} from './TaskReportReviewBadge'

export interface TaskReportSummaryItem {
  /** 업무보고 id. 아직 제출되지 않았으면 null 이고 열 보고가 없어 누를 수 없다. */
  reportId: string | null
  assigneeName: string
  reviewStatus: TaskReportBadgeStatus
}

interface TaskReportSummaryCardProps {
  items: TaskReportSummaryItem[]
  /** 제출된 줄을 눌렀을 때 호출된다. 없으면 모든 줄이 정적으로 그려진다. */
  onSelect?: (reportId: string) => void
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
            const badge = <Badge status={item.reviewStatus} />

            const chevron = (
              <Chevron viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 4 8 8-8 8" />
              </Chevron>
            )

            // 아직 제출되지 않은 줄은 열 보고가 없어 누를 수 없다. Figma
            // `report item / 미제출 (disabled)`(yot 2073:17292)대로 흐리게 그리고 chevron 을 뺀다.
            const reportId = item.reportId
            if (reportId === null) {
              return (
                <StaticItem
                  key={`no-report-${item.assigneeName}-${index}`}
                  data-testid="task-report-row"
                  $disabled
                >
                  <Name $disabled>{item.assigneeName}</Name>
                  {badge}
                </StaticItem>
              )
            }

            // `onSelect` 가 없으면 제출된 줄도 누를 수 없지만 모양은 그대로 둔다.
            if (!onSelect) {
              return (
                <StaticItem key={reportId} data-testid="task-report-row">
                  <Name>{item.assigneeName}</Name>
                  {badge}
                  {chevron}
                </StaticItem>
              )
            }

            return (
              <Item
                key={reportId}
                type="button"
                data-testid="task-report-row"
                onClick={() => onSelect(reportId)}
              >
                <Name>{item.assigneeName}</Name>
                {badge}
                {chevron}
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

// 누를 수 없는 줄. 항목과 같은 크기·간격을 쓰되 버튼이 아니다.
// 미제출 줄은 배경을 50% 로 흐리게 한다(yot 2073:17292 `rgba(245,245,247,0.5)`).
const StaticItem = styled.div<{ $disabled?: boolean }>`
  display: flex;
  min-height: 68px;
  align-items: center;
  gap: 16px;
  padding: 0 30px 0 24px;
  border-radius: 12px;
  background: ${({ theme, $disabled }) =>
    $disabled ? 'rgba(245, 245, 247, 0.5)' : theme.colors.background};
`

const Name = styled.span<{ $disabled?: boolean }>`
  color: ${({ theme, $disabled }) =>
    $disabled ? theme.colors.textFaint : theme.colors.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

// 이름과 chevron 사이에서 배지를 오른쪽 끝으로 민다.
const Badge = styled(TaskReportReviewBadge)`
  margin-left: auto;
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
