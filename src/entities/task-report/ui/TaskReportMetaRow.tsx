import styled from '@emotion/styled'
import {
  TaskPriorityBadge,
  TaskStatusBadge,
  type TaskPriority,
  type TaskStatus,
} from '@/entities/task'

interface TaskReportMetaRowProps {
  priority: TaskPriority
  taskStatus: TaskStatus
  assigneeName: string
  /** YYYY-MM-DD */
  dueDate: string
  visibility: string
}

// Figma 3350:3974 상세 상단 요약행. 배지는 목록과 같은 것을 쓴다.
export function TaskReportMetaRow({
  priority,
  taskStatus,
  assigneeName,
  dueDate,
  visibility,
}: TaskReportMetaRowProps) {
  return (
    <Row>
      <Group>
        <Label>우선순위:</Label>
        <TaskPriorityBadge priority={priority} />
      </Group>
      <Group>
        <Label>상태:</Label>
        <TaskStatusBadge status={taskStatus} />
      </Group>
      <Value>담당자: {assigneeName}</Value>
      <Value>완료 기한: {dueDate}</Value>
      <Value>공개 범위: {visibility}</Value>
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
