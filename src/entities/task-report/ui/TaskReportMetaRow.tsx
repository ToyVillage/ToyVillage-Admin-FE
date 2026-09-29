import styled from '@emotion/styled'
import { TaskPriorityBadge, type TaskPriority } from '@/entities/task'
import { TaskReportReviewBadge } from './TaskReportReviewBadge'
import type { TaskReportReviewStatus } from '../model/types'

interface TaskReportMetaRowProps {
  priority: TaskPriority
  reviewStatus: TaskReportReviewStatus
  assigneeName: string
  /** YYYY-MM-DD */
  dueDate: string
}

// Figma `report / 보고 상세 카드`(yot 145:15468) 상단 요약행. 배지는 업무보고 목록과 같은 것을 쓴다.
// Figma 의 `공개 범위` 는 그리지 않는다(개발자 결정 2026-09-13).
export function TaskReportMetaRow({
  priority,
  reviewStatus,
  assigneeName,
  dueDate,
}: TaskReportMetaRowProps) {
  return (
    <Row>
      <Group>
        <Label>우선순위:</Label>
        <TaskPriorityBadge priority={priority} />
      </Group>
      <Group>
        <Label>상태:</Label>
        <TaskReportReviewBadge status={reviewStatus} />
      </Group>
      <Value>담당자: {assigneeName}</Value>
      <Value>완료 기한: {dueDate}</Value>
    </Row>
  )
}

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
`

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 20px;
  font-weight: 500;
`

const Value = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
`
