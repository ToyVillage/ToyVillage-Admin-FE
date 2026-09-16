import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { getSpecies, speciesQueryKeys } from '@/entities/species'
import { IndividualForm } from '@/features/individual-form'
import { LeaveConfirmationDialog } from '@/shared/ui'
import { FormPageLayout } from './ui/FormPageLayout'
import { PageStatus } from './ui/PageStatus'
import { useFormLeaveGuard } from './ui/useFormLeaveGuard'

// `/species/:speciesId/individuals/create` — 개체 등록. 종 상세 개체 섹션 `개체 등록하기` 에서 들어온다.
export function CreateIndividualPage() {
  const { speciesId = '' } = useParams()
  const navigate = useNavigate()
  const { blocker, setIsDirty, allowNavigation } = useFormLeaveGuard()

  const {
    data: species,
    isPending,
    isError,
  } = useQuery({
    queryKey: speciesQueryKeys.detail(speciesId),
    queryFn: () => getSpecies({ animalKindId: Number(speciesId) }),
    enabled: Boolean(speciesId),
  })

  // 종 상세가 `데이터 생성에 성공했습니다` 토스트를 띄운다(species-detail 소유).
  const handleCompleted = useCallback(() => {
    allowNavigation()
    navigate(`/species/${speciesId}`, { state: { toast: 'create-success' } })
  }, [allowNavigation, navigate, speciesId])

  if (isPending) {
    return <PageStatus state="loading" message="종 정보를 불러오는 중입니다." />
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
      title="개체 등록"
      subtitle={`${species.koreanName}에 개체를 한 마리씩 등록합니다`}
    >
      <IndividualForm
        mode="create"
        speciesId={speciesId}
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
