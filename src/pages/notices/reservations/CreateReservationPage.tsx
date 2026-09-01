import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ReservationForm,
  emptyReservationFormValue,
  scrollToFirstError,
  toCreateReservationRequest,
  validateReservationForm,
  type ReservationFormErrors,
  type ReservationFormValue,
} from '@/features/reservation-form'
import {
  createReservation,
  getReservationEmployees,
  type Staff,
} from '@/entities/reservation'
import { ReservationBackLink } from './ui/ReservationBackLink'

// 저장 전 단체예약의 직원 목록은 reservationId=-1 로 조회한다(전원 assignable).
const NEW_RESERVATION_ID = -1

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

  // 페이지 권한 섹션: 저장 전이므로 -1 로 전원 조회. 이름 검색은 프론트 필터.
  const [permissionQuery, setPermissionQuery] = useState('')
  const { data: employees } = useQuery({
    queryKey: ['reservations', 'employees', 'new'],
    queryFn: () => getReservationEmployees({ reservationId: NEW_RESERVATION_ID }),
    retry: false,
  })

  // 로컬 배정 상태(생성 화면은 처음엔 배정 없음).
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const staffPool = useMemo<Staff[]>(() => {
    if (!employees) return []
    const byId = new Map<string, Staff>()
    for (const staff of [...employees.assigned, ...employees.assignable]) {
      byId.set(staff.id, staff)
    }
    return [...byId.values()]
  }, [employees])

  const keyword = permissionQuery.trim().toLowerCase()
  const matchesKeyword = (staff: Staff) =>
    !keyword || staff.name.toLowerCase().includes(keyword)
  const assignedStaff = useMemo(
    () =>
      staffPool.filter(
        (staff) => assignedIds.includes(staff.id) && matchesKeyword(staff),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [staffPool, assignedIds, keyword],
  )
  const availableStaff = useMemo(
    () =>
      staffPool.filter(
        (staff) => !assignedIds.includes(staff.id) && matchesKeyword(staff),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [staffPool, assignedIds, keyword],
  )
  const addStaff = (staffId: string) =>
    setAssignedIds((prev) =>
      prev.includes(staffId) ? prev : [...prev, staffId],
    )
  const cancelStaff = (staffId: string) =>
    setAssignedIds((prev) => prev.filter((sid) => sid !== staffId))

  const createMutation = useMutation({
    mutationFn: () => {
      const appAdminIds = assignedIds
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
            query: permissionQuery,
            onQueryChange: setPermissionQuery,
            assigned: assignedStaff,
            available: availableStaff,
            onAdd: addStaff,
            onCancel: cancelStaff,
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
