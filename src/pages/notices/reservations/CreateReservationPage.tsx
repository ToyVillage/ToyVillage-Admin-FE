import { useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ReservationForm,
  createReservationMock,
  emptyReservationFormValue,
  mockAssignableStaff,
  scrollToFirstError,
  usePermissionAssignment,
  validateReservationForm,
  type ReservationFormErrors,
  type ReservationFormValue,
} from '@/features/reservation-form'
import { ReservationBackLink } from './ui/ReservationBackLink'

export function CreateReservationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [value, setValue] = useState<ReservationFormValue>(
    emptyReservationFormValue,
  )
  const [errors, setErrors] = useState<ReservationFormErrors>({})
  const permission = usePermissionAssignment(mockAssignableStaff)

  const createMutation = useMutation({
    mutationFn: () => createReservationMock(value, permission.assignedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      navigate('/notices/reservations')
    },
  })

  function handleCreate() {
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
