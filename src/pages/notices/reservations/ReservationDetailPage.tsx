import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  deleteReservation,
  getReservation,
  getReservationEmployees,
  updateReservation,
  type ReservationDetail,
  type Staff,
} from '@/entities/reservation'
import {
  ReservationForm,
  clock24ToParts,
  emptyReservationFormValue,
  formatMoney,
  scrollToFirstError,
  toCreateReservationRequest,
  validateReservationForm,
  type ReservationFormErrors,
  type ReservationFormValue,
} from '@/features/reservation-form'
import { DeleteConfirmationDialog } from '@/shared/ui'
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
  return '요청 처리에 실패했습니다. 다시 시도해 주세요.'
}

// 조회한 상세 → 폼 값. 초기값을 폼 입력 계약에 맞춰 서식한다:
// 금액 콤마, 시간은 24h→12h(raw 자릿수)+am/pm, 사전답사 섹션 포함.
function toFormValue(detail: ReservationDetail): ReservationFormValue {
  const visit = clock24ToParts(detail.reserveTime)
  const exit = clock24ToParts(detail.reserveTimeEnd)
  const surveyEnter = clock24ToParts(detail.surveyEnterTime ?? '')
  const surveyExit = clock24ToParts(detail.surveyExitTime ?? '')
  return {
    ...emptyReservationFormValue,
    groupName: detail.groupName,
    region: detail.regionDetail || detail.region,
    counselDate: detail.consultDate,
    reserverName: detail.reserverName,
    representativeContact: detail.guideContact,
    // 숫자 0(무료 입장료·0명 등)도 유효값이므로 truthy가 아닌 존재 여부로 판단한다.
    headcount: detail.headcount != null ? String(detail.headcount) : '',
    guideCount: detail.guideCount != null ? String(detail.guideCount) : '',
    admissionFee:
      detail.admissionFee != null
        ? formatMoney(String(detail.admissionFee))
        : '',
    visitDate: detail.reserveDate,
    visitTime: visit.time,
    visitTimeAmPm: visit.ampm,
    exitTime: exit.time,
    exitTimeAmPm: exit.ampm,
    // 사전답사 섹션 초기값(visitSite*).
    surveyCount: detail.surveyCount != null ? String(detail.surveyCount) : '',
    surveyDate: detail.surveyDate ?? '',
    surveyEnterTime: surveyEnter.time,
    surveyEnterAmPm: surveyEnter.ampm,
    surveyExitTime: surveyExit.time,
    surveyExitAmPm: surveyExit.ampm,
  }
}

export function ReservationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [value, setValue] = useState<ReservationFormValue | null>(null)
  const [errors, setErrors] = useState<ReservationFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  // 권한 섹션 검색어(서버 검색 없음 → 프론트에서 필터).
  const [permissionQuery, setPermissionQuery] = useState('')

  const { data: reservation, isPending } = useQuery({
    queryKey: ['reservations', id],
    queryFn: () => getReservation({ id: Number(id) }),
    enabled: Boolean(id),
    retry: false,
  })

  // 조회 결과가 처음 도착하면 폼을 1회 초기화한다(이후 사용자 편집 유지).
  const [hydratedId, setHydratedId] = useState<string | null>(null)
  if (reservation && hydratedId !== id) {
    setHydratedId(id)
    setValue(toFormValue(reservation))
  }

  // 배정 직원 목록(배정됨/배정가능) — 상세와 병렬 조회. 전원 반환(서버 검색 없음).
  const { data: employees } = useQuery({
    queryKey: ['reservations', id, 'employees'],
    queryFn: () => getReservationEmployees({ reservationId: Number(id) }),
    enabled: Boolean(id),
    retry: false,
  })

  // 로컬 배정 상태: 첫 응답의 배정됨 id로 1회 시드하고 이후 로컬 편집을 유지한다
  // (검색 재조회에도 재시드하지 않음). 저장 시 이 id 목록을 함께 전송한다.
  const [assignedIds, setAssignedIds] = useState<string[] | null>(null)
  if (employees && assignedIds === null) {
    setAssignedIds(employees.assigned.map((staff) => staff.id))
  }
  const currentAssignedIds = useMemo(() => assignedIds ?? [], [assignedIds])

  // 배정됨 + 배정가능 합집합(중복 제거). 전원 반환된 풀(서버 검색 없음).
  const staffPool = useMemo<Staff[]>(() => {
    if (!employees) return []
    const byId = new Map<string, Staff>()
    for (const staff of [...employees.assigned, ...employees.assignable]) {
      byId.set(staff.id, staff)
    }
    return [...byId.values()]
  }, [employees])

  // 이름 검색은 프론트에서 처리(부분 일치, 대소문자 무시).
  const keyword = permissionQuery.trim().toLowerCase()
  const matchesKeyword = (staff: Staff) =>
    !keyword || staff.name.toLowerCase().includes(keyword)

  const assignedStaff = useMemo(
    () =>
      staffPool.filter(
        (staff) =>
          currentAssignedIds.includes(staff.id) && matchesKeyword(staff),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [staffPool, currentAssignedIds, keyword],
  )
  const availableStaff = useMemo(
    () =>
      staffPool.filter(
        (staff) =>
          !currentAssignedIds.includes(staff.id) && matchesKeyword(staff),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [staffPool, currentAssignedIds, keyword],
  )

  const addStaff = (staffId: string) =>
    setAssignedIds((prev) => {
      const current = prev ?? []
      return current.includes(staffId) ? current : [...current, staffId]
    })
  const cancelStaff = (staffId: string) =>
    setAssignedIds((prev) => (prev ?? []).filter((sid) => sid !== staffId))

  const saveMutation = useMutation({
    mutationFn: (next: ReservationFormValue) => {
      // 배정 id는 직원 조회 API에서 온 실제 숫자 id → 그대로 전송(배정 통째 교체).
      const appAdminIds = currentAssignedIds
        .map((staffId) => Number(staffId))
        .filter((n) => Number.isSafeInteger(n) && n > 0)
      return updateReservation({
        id: Number(id),
        body: toCreateReservationRequest(next, appAdminIds),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      navigate('/notices/reservations')
    },
    onError: (error) => setActionError(serverMessage(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteReservation(Number(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] })
      navigate('/notices/reservations')
    },
    onError: (error) => {
      setDeleteOpen(false)
      setActionError(serverMessage(error))
    },
  })

  const formValue = value ?? emptyReservationFormValue

  function handleSave() {
    setActionError('')
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
        {actionError && <ErrorAlert role="alert">{actionError}</ErrorAlert>}
        <ReservationForm
          value={formValue}
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
