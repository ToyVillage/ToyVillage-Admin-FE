import styled from '@emotion/styled'
import { taskPriorityLabels, type TaskPriority } from '@/entities/task'

interface TaskReportPriorityBadgeProps {
  priority: TaskPriority
}

// 업무보고 화면의 우선순위 배지(36×36 원). 업무관리 목록은 yot 1:3267 에서
// 42×40 pill 로 바뀌었지만 업무보고는 자체 디자인을 쓰므로 여기서 따로 둔다.
// 색만이 아니라 텍스트로도 값을 전달한다.
export function TaskReportPriorityBadge({
  priority,
}: TaskReportPriorityBadgeProps) {
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
