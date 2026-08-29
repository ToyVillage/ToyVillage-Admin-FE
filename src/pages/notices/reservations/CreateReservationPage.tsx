import { useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ReservationForm,
  emptyReservationFormValue,
  mockAssignableStaff,
  scrollToFirstError,
  toCreateReservationRequest,
  usePermissionAssignment,
  validateReservationForm,
  type ReservationFormErrors,
  type ReservationFormValue,
} from '@/features/reservation-form'
import { createReservation } from '@/entities/reservation'
import { ReservationBackLink } from './ui/ReservationBackLink'

// 서버 오류 응답에서 사용자용 message 를 뽑는다(없으면 기본 문구).
function serverMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  if (
    data &&
    typeof data === 'object' &&
    typeof (data as Record<string, unknown>).message === 'string'
  ) {
    return (data as { message: string }).message
  }
  return '단체예약 생성에 실패했습니다. 다시 시도해 주세요.'
}

export function CreateReservationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [value, setValue] = useState<ReservationFormValue>(
    emptyReservationFormValue,
  )
  const [errors, setErrors] = useState<ReservationFormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const permission = usePermissionAssignment(mockAssignableStaff)

  const createMutation = useMutation({
    mutationFn: () => {
      // 배정 후보가 아직 mock(비숫자 id)이라 숫자로 변환 가능한 id만 전송한다.
      const appAdminIds = permission.assignedIds
        .map((staffId) => Number(staffId))
        .filter((n) => Number.isSafeInteger(n) && n > 0)
      return createReservation(toCreateReservationRequest(value, appAdminIds))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      navigate('/notices/reservations')
    },
    onError: (error) => setSubmitError(serverMessage(error)),
  })

  function handleCreate() {
    setSubmitError('')
    const nextErrors = validateReservationForm(value)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      createMutation.mutate()
    } else {
      scrollToFirstError()
    }
  }

  return (
    <Page>
      <Content>
        <ReservationBackLink />
        {submitError && <ErrorAlert role="alert">{submitError}</ErrorAlert>}
        <ReservationForm
          value={value}
          onChange={setValue}
          errors={errors}
          permission={{
            query: permission.query,
            onQueryChange: permission.setQuery,
            assigned: permission.assigned,
            available: permission.available,
            onAdd: permission.add,
            onCancel: permission.cancel,
          }}
        />
        <Actions>
          <CreateButton
            type="button"
            disabled={createMutation.isPending}
            onClick={handleCreate}
          >
            생성하기
          </CreateButton>
        </Actions>
      </Content>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 480px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  gap: 32px;
  margin: 0 auto;
  padding-top: 76px;
`

const ErrorAlert = styled.div`
  padding: 20px 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`

const CreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 16px 20px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.textGuide};
    cursor: wait;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`
