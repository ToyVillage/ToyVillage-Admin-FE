import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewMockTaskReport } from '@/entities/task-report'
import type { ToastVariant } from '@/shared/ui'

export type TaskReportReviewAction = 'approve' | 'reject'

export type TaskReportReviewResult =
  | 'approve-success'
  | 'approve-error'
  | 'reject-success'
  | 'reject-error'

// Figma `업무보고 · 토스트`(yot 311:12781). 실패는 목록·상세 모두 토스트로 보인다(개발자 결정 2026-09-13).
export const taskReportReviewToasts: Record<
  TaskReportReviewResult,
  { variant: ToastVariant; message: string }
> = {
  'approve-success': { variant: 'success', message: '승인에 성공했습니다' },
  'approve-error': { variant: 'error', message: '승인에 실패했습니다' },
  'reject-success': { variant: 'success', message: '반려에 성공했습니다' },
  'reject-error': { variant: 'error', message: '반려에 실패했습니다' },
}

interface ReviewInput {
  id: string
  action: TaskReportReviewAction
  rejectReason?: string
}

interface ReviewCallbacks {
  onSuccess?: () => void
  onError?: () => void
}

// 목록 케밥과 상세 버튼이 함께 쓰는 승인·반려 요청. 처리 중 두 번째 요청은 보내지 않는다.
export function useReviewTaskReport() {
  const queryClient = useQueryClient()
  const reviewingRef = useRef(false)

  const mutation = useMutation({
    mutationFn: ({ id, action, rejectReason }: ReviewInput) =>
      reviewMockTaskReport({
        id,
        reviewStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
        rejectReason,
      }),
    // 캐시 갱신은 여기서 한다. 호출한 화면이 먼저 사라져도 실행되고, 끝날 때까지 `pending` 이 유지된다.
    onSuccess: (_report, { id }) =>
      Promise.all([
        // 목록은 화면에 없어도 바로 다시 받아 둔다. 상세에서 돌아왔을 때 옛 건수가 보이지 않게 한다.
        queryClient.invalidateQueries({
          queryKey: ['task-reports'],
          exact: true,
          refetchType: 'all',
        }),
        // 처리한 보고의 상세는 곧 떠날 화면이라 다시 받지 않고, 다음 진입 때 새로 받게 표시만 한다.
        queryClient.invalidateQueries({
          queryKey: ['task-reports', id],
          exact: true,
          refetchType: 'none',
        }),
      ]),
    onSettled: () => {
      reviewingRef.current = false
    },
  })

  // 콜백은 화면 전용 처리(토스트·이동·모달 닫기·초점)만 받는다.
  function review(input: ReviewInput, callbacks: ReviewCallbacks = {}) {
    if (reviewingRef.current || mutation.isPending) return

    reviewingRef.current = true
    mutation.mutate(input, {
      onSuccess: () => callbacks.onSuccess?.(),
      onError: () => callbacks.onError?.(),
    })
  }

  return { review, pending: mutation.isPending }
}
