import { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { WorkLogFormDraft } from '@/entities/work-log'
import {
  createWorkLogForm,
  workLogFormQueryKeys,
} from '@/entities/work-log'
import {
  createEmptyDraft,
  isDraftTouched,
  WorkLogFormWizard,
} from '@/features/create-work-log-form'

const listPath = '/work-logs?tab=forms'
const basePath = '/work-logs/forms/create'

// Figma 1:3710 "worklog form make (항목 입력)" — 양식 생성 2단계 위저드.
export function CreateWorkLogFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const initialDraft = useMemo(() => createEmptyDraft(), [])

  const { mutate, isPending } = useMutation({
    mutationFn: (draft: WorkLogFormDraft) => createWorkLogForm(draft),
    onSuccess: () => {
      // 목록만 무효화한다. 상세까지 넓히면 지워진 id 를 다시 불러 404 가 난다.
      void queryClient.invalidateQueries({
        queryKey: workLogFormQueryKeys.all,
        predicate: (query) => query.queryKey[1] === 'list',
      })
      navigate(listPath)
    },
  })

  return (
    <WorkLogFormWizard
      initialDraft={initialDraft}
      basePath={basePath}
      submitLabel="생성하기"
      showStepOneSubmit={false}
      pending={isPending}
      listPath={listPath}
      isLeaveConfirmNeeded={isDraftTouched}
      onSubmit={(draft) => mutate(draft)}
    />
  )
}
