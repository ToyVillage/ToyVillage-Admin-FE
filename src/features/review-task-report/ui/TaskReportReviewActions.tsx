import { useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  reviewMockTaskReport,
  type TaskReportReviewStatus,
} from '@/entities/task-report'
import { RejectReasonDialog } from './RejectReasonDialog'

interface TaskReportReviewActionsProps {
  reportId: string
  onCompleted: () => void
}

interface TaskReportReviewInput {
  reviewStatus: TaskReportReviewStatus
  rejectReason?: string
}

// Figma 3350:3965 / 3350:3967. 결과 표시(토스트·모달)는 다음 슬라이스라 여기서는 이동만 한다.
// 반려는 사유 모달(3350:4018)에서 `확인` 을 누른 뒤에야 요청한다.
export function TaskReportReviewActions({
  reportId,
  onCompleted,
}: TaskReportReviewActionsProps) {
  const queryClient = useQueryClient()
  const reviewingRef = useRef(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: ({ reviewStatus, rejectReason }: TaskReportReviewInput) =>
      reviewMockTaskReport({ id: reportId, reviewStatus, rejectReason }),
  })

  function handleReview(input: TaskReportReviewInput) {
    if (reviewingRef.current || mutation.isPending) return

    reviewingRef.current = true
    mutation.mutate(input, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['task-reports'] })
        queryClient.removeQueries({ queryKey: ['task-reports', reportId] })
        onCompleted()
      },
      onError: () => {
        reviewingRef.current = false
      },
    })
  }

  const pending = mutation.isPending

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
          onClick={() => handleReview({ reviewStatus: 'APPROVED' })}
        >
          승인하기
        </ApproveButton>
      </Actions>

      {rejectDialogOpen ? (
        <RejectReasonDialog
          pending={pending}
          onCancel={() => setRejectDialogOpen(false)}
          onConfirm={(reason) =>
            handleReview({ reviewStatus: 'REJECTED', rejectReason: reason })
          }
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
