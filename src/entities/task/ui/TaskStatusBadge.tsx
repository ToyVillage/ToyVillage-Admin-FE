import styled from '@emotion/styled'
import { taskStatusLabels } from '../model/labels'
import type { TaskStatus } from '../model/types'

interface TaskStatusBadgeProps {
  status: TaskStatus
}

// Figma 목록 `상태` 셀 pill. 색만이 아니라 텍스트로도 상태를 전달한다.
export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return <Badge $status={status}>{taskStatusLabels[status]}</Badge>
}

const Badge = styled.span<{ $status: TaskStatus }>`
  display: inline-flex;
  min-width: 80px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 80px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  ${({ theme, $status }) => {
    if ($status === 'DONE') {
      return `background: ${theme.colors.accentBg}; color: ${theme.colors.accent};`
    }
    if ($status === 'REJECTED') {
      return `background: ${theme.colors.warningBg}; color: ${theme.colors.warning};`
    }
    return `background: ${theme.colors.tableHeaderStrong}; color: ${theme.colors.textGuide};`
  }}
`
