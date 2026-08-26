import { useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getMockReservationDetail,
  type ReservationDetail,
} from '@/entities/reservation'
import {
  ReservationForm,
  clock24ToParts,
  deleteReservationMock,
  emptyReservationFormValue,
  formatMoney,
  mockAssignableStaff,
  scrollToFirstError,
  updateReservationMock,
  usePermissionAssignment,
  validateReservationForm,
  type ReservationFormErrors,
  type ReservationFormValue,
} from '@/features/reservation-form'
import { DeleteConfirmationDialog } from '@/shared/ui'
import { ReservationBackLink } from './ui/ReservationBackLink'

// 조회한 상세 → 폼 값(mock 경계 매핑). 폼에만 있는 필드(사전답사 등)는 빈 값으로 둔다.
// 초기값도 폼 입력 계약에 맞춰 서식한다: 금액 콤마, 시간은 24h→12h(raw 자릿수)+am/pm.
function toFormValue(detail: ReservationDetail): ReservationFormValue {
  const visit = clock24ToParts(detail.reserveTime)
  const exit = clock24ToParts(detail.reserveTimeEnd)
  return {
    ...emptyReservationFormValue,
    groupName: detail.groupName,
    region: detail.regionDetail || detail.region,
    counselDate: detail.consultDate,
    reserverName: detail.reserverName,
    representativeContact: detail.guideContact,
    headcount: detail.headcount ? String(detail.headcount) : '',
    guideCount: detail.guideCount ? String(detail.guideCount) : '',
    admissionFee: detail.admissionFee ? formatMoney(String(detail.admissionFee)) : '',
    visitDate: detail.reserveDate,
    visitTime: visit.time,
    visitTimeAmPm: visit.ampm,
    exitTime: exit.time,
    exitTimeAmPm: exit.ampm,
  }
}

export function ReservationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [value, setValue] = useState<ReservationFormValue | null>(null)
  const [errors, setErrors] = useState<ReservationFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  // 수정 페이지는 배정팀이 채워진 상태로 보이도록 mock 시드(백엔드 배정 후보 명세 전까지).
  const permission = usePermissionAssignment(mockAssignableStaff, ['a1', 'a2'])

  const { data: reservation, isPending } = useQuery({
    queryKey: ['reservations', id],
    queryFn: () => getMockReservationDetail(id),
    enabled: Boolean(id),
    retry: false,
  })

  // 조회 결과가 처음 도착하면 폼을 1회 초기화한다(이후 사용자 편집 유지).
  const [hydratedId, setHydratedId] = useState<string | null>(null)
  if (reservation && hydratedId !== id) {
    setHydratedId(id)
    setValue(toFormValue(reservation))
  }

  const saveMutation = useMutation({
    mutationFn: (next: ReservationFormValue) =>
      updateReservationMock(id, next, permission.assignedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      navigate('/notices/reservations')
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteReservationMock(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      navigate('/notices/reservations')
    },
  })

  const formValue = value ?? emptyReservationFormValue

  function handleSave() {
    const nextErrors = validateReservationForm(formValue)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      saveMutation.mutate(formValue)
    } else {
      scrollToFirstError()
    }
  }

  // 조회가 끝났는데 데이터가 없을 때만 미조회 상태(로딩 중에는 빈 폼 유지).
  if (!isPending && !reservation) {
    return (
      <Page>
        <Content>
          <ReservationBackLink />
          <NotFound>예약을 찾을 수 없습니다.</NotFound>
        </Content>
      </Page>
    )
  }

  return (
    <Page>
      <Content>
        <ReservationBackLink />
        <ReservationForm
          value={formValue}
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
          <DeleteButton
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => setDeleteOpen(true)}
          >
            삭제하기
          </DeleteButton>
          <SaveButton
            type="button"
            disabled={saveMutation.isPending}
            onClick={handleSave}
          >
            저장하기
          </SaveButton>
        </Actions>
      </Content>

      {deleteOpen && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 66px;
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
  gap: 16px;
`

const baseAction = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 16px 20px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  }

  &:disabled {
    cursor: wait;
  }
`

// 삭제하기: 빨강 아웃라인(bg gray/10) — hover 그림자, disabled 회색.
const DeleteButton = styled.button`
  ${baseAction}
  border: 2px solid ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.danger};

  &:disabled {
    border-color: ${({ theme }) => theme.colors.textGuide};
    color: ${({ theme }) => theme.colors.textGuide};
  }
`

const SaveButton = styled.button`
  ${baseAction}
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};

  &:disabled {
    background: ${({ theme }) => theme.colors.textGuide};
  }
`

const NotFound = styled.p`
  margin: 48px 0 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
  font-weight: 600;
  text-align: center;
`
