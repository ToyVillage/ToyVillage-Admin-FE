import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getIndividual, individualQueryKeys } from '@/entities/individual'
import {
  getSpecies,
  isNotFoundError,
  speciesQueryKeys,
} from '@/entities/species'
import { IndividualForm } from '@/features/individual-form'
import { LeaveConfirmationDialog } from '@/shared/ui'
import { FormPageLayout } from './ui/FormPageLayout'
import { PageStatus } from './ui/PageStatus'
import { useFormLeaveGuard } from './ui/useFormLeaveGuard'

// `/species/:speciesId/individuals/:individualId/edit` — 개체 수정.
// 개체 상세 케밥·종 상세 개체 표 행 케밥 `수정` 에서 들어온다.
export function EditIndividualPage() {
  const { speciesId = '', individualId = '' } = useParams()
  const navigate = useNavigate()
  const { blocker, setIsDirty, allowNavigation } = useFormLeaveGuard()

  const speciesQuery = useQuery({
    queryKey: speciesQueryKeys.detail(speciesId),
    queryFn: () => getSpecies({ animalKindId: Number(speciesId) }),
    enabled: Boolean(speciesId),
  })
  const individualQuery = useQuery({
    queryKey: individualQueryKeys.detail(individualId),
    queryFn: () => getIndividual({ animalManageId: Number(individualId) }),
    enabled: Boolean(individualId),
  })

  const detailPath = `/species/${speciesId}/individuals/${individualId}`

  // 저장 결과는 개체 상세에서 확인한다(spec 결정 사항 — 수정 성공 토스트 없음).
  const handleCompleted = useCallback(() => {
    allowNavigation()
    navigate(detailPath)
  }, [allowNavigation, detailPath, navigate])

  if (speciesQuery.isPending || individualQuery.isPending) {
    return <PageStatus state="loading" message="개체를 불러오는 중입니다." />
  }

  if (
    [speciesQuery, individualQuery].some(
      (query) => query.isError && !isNotFoundError(query.error),
    )
  ) {
    return (
      <PageStatus
        state="error"
        message="개체를 불러오지 못했습니다. 다시 시도해 주세요."
      />
    )
  }

  const species = speciesQuery.data
  if (speciesQuery.isError || !species) {
    return (
      <PageStatus
        state="not-found"
        message="종을 찾을 수 없습니다."
        linkTo="/species"
        linkLabel="목록으로 돌아가기"
      />
    )
  }

  // 다른 종 소속 개체도 이 종에서는 없는 개체로 본다.
  const individual = individualQuery.data
  if (
    individualQuery.isError ||
    !individual ||
    individual.speciesId !== speciesId
  ) {
    return (
      <PageStatus
        state="not-found"
        message="개체를 찾을 수 없습니다."
        linkTo={`/species/${speciesId}`}
        linkLabel="종 상세로 돌아가기"
      />
    )
  }

  return (
    <FormPageLayout
      backTo={detailPath}
      title="개체 수정"
      subtitle={`${species.koreanName} · ${individual.name}의 정보를 수정합니다`}
    >
      <IndividualForm
        mode="edit"
        speciesId={speciesId}
        initialIndividual={individual}
        onCompleted={handleCompleted}
        onDirtyChange={setIsDirty}
      />
      {blocker.state === 'blocked' && (
        <LeaveConfirmationDialog
          onCancel={blocker.reset}
          onConfirm={blocker.proceed}
        />
      )}
    </FormPageLayout>
  )
}
