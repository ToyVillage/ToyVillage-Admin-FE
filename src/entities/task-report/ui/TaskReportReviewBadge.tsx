import styled from '@emotion/styled'
import type { TaskReportReviewStatus } from '../model/types'

interface TaskReportReviewBadgeProps {
  status: TaskReportReviewStatus
  className?: string
}

// Figma `status / 업무 보고`. 승인 변형은 `승인` 이라 목록 탭 라벨(`완료`)과 문구가 다르다.
const labels: Record<TaskReportReviewStatus, string> = {
  APPROVED: '승인',
  REJECTED: '반려',
  PENDING: '심사대기',
}

// 업무 상세 보고 줄(yot 152:11510) · 업무보고 목록 `상태` 칸(141:9720) · 상세 요약행(145:15468)이 함께 쓴다.
export function TaskReportReviewBadge({
  status,
  className,
}: TaskReportReviewBadgeProps) {
  return (
    <Badge className={className} $status={status}>
      {labels[status]}
    </Badge>
  )
}

const Badge = styled.span<{ $status: TaskReportReviewStatus }>`
  display: inline-flex;
  min-width: 76px;
  height: 40px;
  align-items: center;
  justify-content: center;
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
