import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpeciesForm } from '@/features/species-form'
import { LeaveConfirmationDialog } from '@/shared/ui'
import { FormPageLayout } from './ui/FormPageLayout'
import { useFormLeaveGuard } from './ui/useFormLeaveGuard'

// `/species/create` — 종 등록. 종 목록 CTA `개체 등록하기` 에서 들어온다.
export function CreateSpeciesPage() {
  const navigate = useNavigate()
  const { blocker, setIsDirty, allowNavigation } = useFormLeaveGuard()

  // 목록이 `데이터 생성에 성공했습니다` 토스트를 띄운다(species-list 소유).
  const handleCompleted = useCallback(() => {
    allowNavigation()
    navigate('/species', { state: { toast: 'create-success' } })
  }, [allowNavigation, navigate])

  return (
    <FormPageLayout backTo="/species" title="종 등록">
      <SpeciesForm
        mode="create"
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
