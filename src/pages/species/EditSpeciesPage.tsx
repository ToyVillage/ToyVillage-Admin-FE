import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSpecies,
  isNotFoundError,
  speciesQueryKeys,
} from '@/entities/species'
import { SpeciesForm } from '@/features/species-form'
import { LeaveConfirmationDialog } from '@/shared/ui'
import { FormPageLayout } from './ui/FormPageLayout'
import { PageStatus } from './ui/PageStatus'
import { useFormLeaveGuard } from './ui/useFormLeaveGuard'
import { FormPageSkeleton } from './ui/FormPageSkeleton'

// `/species/:speciesId/edit` — 종 수정. 종 목록 행·종 상세 카드 케밥 `수정` 에서 들어온다.
export function EditSpeciesPage() {
  const { speciesId = '' } = useParams()
  const navigate = useNavigate()
  const { blocker, setIsDirty, allowNavigation } = useFormLeaveGuard()

  const {
    data: species,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: speciesQueryKeys.detail(speciesId),
    queryFn: () => getSpecies({ animalKindId: Number(speciesId) }),
    enabled: Boolean(speciesId),
  })

  // 저장 결과는 상세 화면에서 확인한다(spec 결정 사항 — 수정 성공 토스트 없음).
  const handleCompleted = useCallback(() => {
    allowNavigation()
    navigate(`/species/${speciesId}`)
  }, [allowNavigation, navigate, speciesId])

  if (isPending) {
    return <FormPageSkeleton cards={4} photo />
  }

  if (isError && !isNotFoundError(error)) {
    return (
      <PageStatus
        state="error"
        message="종 정보를 불러오지 못했습니다. 다시 시도해 주세요."
      />
    )
  }

  if (isError || !species) {
    return (
      <PageStatus
        state="not-found"
        message="종을 찾을 수 없습니다."
        linkTo="/species"
        linkLabel="목록으로 돌아가기"
      />
    )
  }

  return (
    <FormPageLayout
      backTo={`/species/${speciesId}`}
      title="종 수정"
      subtitle={`${species.koreanName}의 종 정보를 수정합니다`}
    >
      <SpeciesForm
        mode="edit"
        initialSpecies={species}
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
