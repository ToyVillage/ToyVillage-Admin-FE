import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import type { WorkLogFormDraft } from '@/entities/work-log'
import {
  getMockWorkLogFormDraft,
  updateMockWorkLogForm,
} from '@/entities/work-log'
import {
  createEmptyDraft,
  isDraftDirty,
  WorkLogFormWizard,
} from '@/features/create-work-log-form'

const listPath = '/work-logs?tab=forms'

// Figma 1:4062 "worklog form correction" — 양식 수정 2단계 위저드.
export function EditWorkLogFormPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // 불러오는 동안에도 같은 레이아웃의 빈 폼을 보여 준다(spec 로딩 — 박스가 튀지 않게).
  const loadingDraft = useMemo(() => createEmptyDraft(), [])

  const { data: draft, isPending } = useQuery({
    queryKey: ['work-log-forms', 'draft', id],
    queryFn: () => getMockWorkLogFormDraft(id),
  })

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: (next: WorkLogFormDraft) => updateMockWorkLogForm(id, next),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['work-log-forms', 'list'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['work-log-forms', 'detail', id],
      })
      navigate(listPath)
    },
  })

  const initialDraft = draft ?? loadingDraft

  // 목록에서 삭제된 양식으로 진입하면 양식 관리 탭으로 되돌린다(spec).
  if (!isPending && !draft) return <Navigate to={listPath} replace />

  return (
    <WorkLogFormWizard
      // 값이 도착하면 편집 상태를 그 값으로 다시 세운다.
      key={draft ? id : 'loading'}
      initialDraft={initialDraft}
      basePath={`/work-logs/forms/${id}/edit`}
      submitLabel="저장하기"
      showStepOneSubmit
      pending={isSaving}
      loading={isPending}
      listPath={listPath}
      isLeaveConfirmNeeded={(next) => isDraftDirty(next, initialDraft)}
      onSubmit={(next) => mutate(next)}
    />
  )
}
