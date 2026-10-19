import { useMemo } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import type { WorkLogFormDraft } from '@/entities/work-log'
import {
  getWorkLogFormDraft,
  isDuplicateFormNameError,
  isWorkLogNotFoundError,
  updateWorkLogForm,
  workLogFormQueryKeys,
} from '@/entities/work-log'
import {
  createEmptyDraft,
  isDraftDirty,
  WorkLogFormWizard,
} from '@/features/create-work-log-form'
import { ErrorDialog } from '@/shared/ui'

const listPath = '/work-logs?tab=forms'

// Figma 1:4062 "worklog form correction" — 양식 수정 2단계 위저드.
// 목록의 케밥 메뉴 `수정`으로만 들어온다(상세 화면에는 진입 버튼이 없다).
export function EditWorkLogFormPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  // 목록에서 넘어왔다면 그때의 조회 조건(페이지)으로 돌아간다.
  const navState = location.state as { listSearch?: string } | null
  const backPath = navState?.listSearch
    ? `/work-logs${navState.listSearch}`
    : listPath

  // 불러오는 동안에도 같은 레이아웃의 빈 폼을 보여 준다(spec 로딩 — 박스가 튀지 않게).
  const loadingDraft = useMemo(() => createEmptyDraft(), [])

  const workLogTemplateId = Number(id)
  const validId =
    Number.isSafeInteger(workLogTemplateId) && workLogTemplateId > 0

  const {
    data: draft,
    isPending,
    error,
  } = useQuery({
    queryKey: workLogFormQueryKeys.draft(id),
    queryFn: () => getWorkLogFormDraft({ workLogTemplateId }),
    enabled: validId,
    retry: false,
    // 다시 들어올 때마다 서버의 최신 양식으로 편집을 시작한다.
    staleTime: 0,
  })

  const save = useMutation({
    mutationFn: (next: WorkLogFormDraft) =>
      updateWorkLogForm({ workLogTemplateId }, next),
    onSuccess: () => {
      // 목록과 이 양식만 무효화한다. 다른 양식의 상세까지 넓히지 않는다.
      void queryClient.invalidateQueries({
        queryKey: workLogFormQueryKeys.all,
        predicate: (query) => query.queryKey[1] === 'list',
      })
      void queryClient.invalidateQueries({
        queryKey: workLogFormQueryKeys.detail(id),
      })
      void queryClient.invalidateQueries({
        queryKey: workLogFormQueryKeys.draft(id),
      })
      navigate(backPath, { state: { toast: 'form-save-success' } })
    },
  })

  // 삭제된 양식(404)이나 잘못된 id 로 진입하면 양식 관리 탭으로 되돌린다(spec).
  if (!validId || (error && isWorkLogNotFoundError(error))) {
    return <Navigate to={backPath} replace />
  }

  // 404 가 아닌 조회 실패는 '삭제됨'으로 오인하지 않게 화면에 남겨 알린다.
  if (error) {
    return (
      <StatePage>
        <StateCard role="alert">
          양식을 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  const initialDraft = draft ?? loadingDraft

  return (
    <>
      <WorkLogFormWizard
        // 값이 도착하면 편집 상태를 그 값으로 다시 세운다.
        key={draft ? id : 'loading'}
        initialDraft={initialDraft}
        basePath={`/work-logs/forms/${id}/edit`}
        submitLabel="저장하기"
        showStepOneSubmit
        pending={save.isPending}
        loading={isPending}
        listPath={backPath}
        isLeaveConfirmNeeded={(next) => isDraftDirty(next, initialDraft)}
        onSubmit={(next) => save.mutate(next)}
      />

      {save.isError && (
        <ErrorDialog
          title={
            isDuplicateFormNameError(save.error)
              ? '이미 존재하는 양식명입니다'
              : '저장에 실패했습니다'
          }
          onConfirm={save.reset}
        />
      )}
    </>
  )
}

const StatePage = styled.main`
  display: grid;
  min-height: 100vh;
  padding: 32px;
  place-items: center;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const StateCard = styled.section`
  width: min(100%, 560px);
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`
