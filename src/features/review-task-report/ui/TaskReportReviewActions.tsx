import { useState } from 'react'
import styled from '@emotion/styled'
import {
  useReviewTaskReport,
  type TaskReportReviewAction,
} from '../model/useReviewTaskReport'
import { RejectReasonDialog } from './RejectReasonDialog'

interface TaskReportReviewActionsProps {
  reportId: string
  onSuccess: (action: TaskReportReviewAction) => void
  onError: (action: TaskReportReviewAction) => void
}

// Figma yot 1:7503 하단 `반려하기`/`승인하기`. 결과 토스트는 페이지가 그린다(성공은 목록, 실패는 상세).
// 반려는 사유 모달(1:7635)에서 `확인` 을 누른 뒤에야 요청하고, 결과가 나오면 모달을 닫는다.
export function TaskReportReviewActions({
  reportId,
  onSuccess,
  onError,
}: TaskReportReviewActionsProps) {
  const { review, pending } = useReviewTaskReport()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  function handleReview(action: TaskReportReviewAction, rejectReason?: string) {
    review(
      { id: reportId, action, rejectReason },
      {
        onSuccess: () => onSuccess(action),
        onError: () => {
          setRejectDialogOpen(false)
          onError(action)
        },
      },
    )
  }

  return (
    <>
      <Actions>
        <RejectButton
          type="button"
          disabled={pending}
          onClick={() => setRejectDialogOpen(true)}
        >
          반려하기
        </RejectButton>
        <ApproveButton
          type="button"
          disabled={pending}
          onClick={() => handleReview('approve')}
        >
          승인하기
        </ApproveButton>
      </Actions>

      {rejectDialogOpen ? (
        <RejectReasonDialog
          pending={pending}
          onCancel={() => setRejectDialogOpen(false)}
          onConfirm={(reason) => handleReview('reject', reason)}
        />
      ) : null}
    </>
  )
}

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  flex-wrap: wrap;
`

const actionButton = `
  min-height: 61px;
  padding: 16px 20px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;
`

const RejectButton = styled.button`
  ${actionButton}
  border: 2px solid ${({ theme }) => theme.colors.danger};
  background: transparent;
  color: ${({ theme }) => theme.colors.danger};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

const ApproveButton = styled.button`
  ${actionButton}
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`
