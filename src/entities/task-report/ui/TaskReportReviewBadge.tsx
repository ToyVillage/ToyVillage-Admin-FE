import styled from '@emotion/styled'
import type { TaskReportReviewStatus } from '../model/types'

/** 심사 상태에 업무 상세 보고 줄에서만 쓰는 `MISSING`(미제출)을 더한다. */
export type TaskReportBadgeStatus = TaskReportReviewStatus | 'MISSING'

interface TaskReportReviewBadgeProps {
  status: TaskReportBadgeStatus
  className?: string
}

// Figma `status / 업무 보고`. 승인 변형의 Figma 문구는 `승인` 이지만 목록 탭 라벨과 맞춰 `완료` 로 쓴다
// (개발자 결정 2026-09-13).
const labels: Record<TaskReportBadgeStatus, string> = {
  APPROVED: '완료',
  REJECTED: '반려',
  PENDING: '심사대기',
  MISSING: '미제출',
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

const Badge = styled.span<{ $status: TaskReportBadgeStatus }>`
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
    // 미제출(yot 2073:17289)은 흰 바탕에 테두리만 두른다. 테두리 1px 만큼 높이·여백을 줄여 다른 배지와 겉 크기를 맞춘다.
    if ($status === 'MISSING') {
      return `height: 38px; padding: 7px 11px; border: 1px solid ${theme.colors.tableHeaderStrong}; background: ${theme.colors.surface}; color: ${theme.colors.optionMuted};`
    }
    return `background: ${theme.colors.tableHeaderStrong}; color: ${theme.colors.textGuide};`
  }}
`
