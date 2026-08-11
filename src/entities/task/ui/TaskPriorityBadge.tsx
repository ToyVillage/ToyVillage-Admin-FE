import styled from '@emotion/styled'
import { taskPriorityLabels } from '../model/labels'
import type { TaskPriority } from '../model/types'

interface TaskPriorityBadgeProps {
  priority: TaskPriority
}

// Figma 목록 `우선순위` 셀 원형 배지. 색만이 아니라 텍스트로도 값을 전달한다.
export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  return <Badge $priority={priority}>{taskPriorityLabels[priority]}</Badge>
}

const Badge = styled.span<{ $priority: TaskPriority }>`
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  ${({ theme, $priority }) => {
    if ($priority === 'MEDIUM') {
      return `background: ${theme.colors.warningBg}; color: ${theme.colors.warning};`
    }
    if ($priority === 'LOW') {
      return `background: ${theme.colors.dangerBg}; color: ${theme.colors.danger};`
    }
    return `background: ${theme.colors.accentBg}; color: ${theme.colors.accent};`
  }}
`
