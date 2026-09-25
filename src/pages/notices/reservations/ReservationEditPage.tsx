import { useEffect, useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  getReservation,
  getReservationEmployees,
  updateReservation,
  type Staff,
} from '@/entities/reservation'
import {
  ReservationForm,
  emptyReservationFormValue,
  scrollToFirstError,
  toCreateReservationRequest,
  toReservationFormValue,
  validateReservationForm,
  type ReservationFormCompletion,
  type ReservationFormErrors,
  type ReservationFormValue,
} from '@/features/reservation-form'
import { Toast } from '@/shared/ui'
import { ReservationBackLink } from './ui/ReservationBackLink'
import { ReservationEditSkeleton } from './ui/ReservationEditSkeleton'
import { failureToastMessage } from './model/toast'
import { serverMessage } from './model/serverMessage'

// `/notices/reservations/:id/edit` — 단체예약 수정(Figma yot 1:7846).
// 삭제는 이 화면이 아니라 목록 케밥이 맡는다(Figma 417:13157/417:13177).
export function ReservationEditPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // 목록에서 넘어왔다면 그때의 조회 조건(상태·검색어·정렬·페이지)으로 돌아간다.
  const listState = location.state as { listSearch?: string } | null
  const listPath = `/notices/reservations${listState?.listSearch ?? ''}`
  const queryClient = useQueryClient()

  const [value, setValue] = useState<ReservationFormValue | null>(null)
  const [errors, setErrors] = useState<ReservationFormErrors>({})
  const [failedToast, setFailedToast] = useState<string | null>(null)

  // 권한 섹션 검색어(서버 검색 없음 → 프론트에서 필터).
  const [permissionQuery, setPermissionQuery] = useState('')

  const {
    data: reservation,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['reservations', id],
    queryFn: () => getReservation({ id: Number(id) }),
    enabled: Boolean(id),
    retry: false,
  })

  // 조회 결과가 처음 도착하면 폼을 1회 초기화한다(이후 사용자 편집 유지).
  const [hydratedId, setHydratedId] = useState<string | null>(null)
  if (reservation && hydratedId !== id) {
    setHydratedId(id)
    setValue(toReservationFormValue(reservation))
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

  // 배정 id는 직원 조회 API에서 온 실제 숫자 id → 그대로 전송(배정 통째 교체).
  const appAdminIds = useMemo(
    () =>
      currentAssignedIds
        .map((staffId) => Number(staffId))
        .filter((n) => Number.isSafeInteger(n) && n > 0),
    [currentAssignedIds],
  )

  // 잘못된 id·404·조회 실패. 별도 화면은 디자인에 없어 목록으로 되돌린다.
  useEffect(() => {
    if (!isError) return
    navigate(listPath, { replace: true })
  }, [isError, listPath, navigate])

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

  const formValue = value ?? emptyReservationFormValue

  // 값은 그대로 두고 배정만 바꾼 저장이면 `권한 부여` 토스트를 쓴다(Figma 417:13419).
  function completionKind(
    next: ReservationFormValue,
  ): ReservationFormCompletion {
    if (!reservation || !employees) return 'updated'
    const initialValue = toReservationFormValue(reservation)
    const valueChanged = (
      Object.keys(initialValue) as (keyof ReservationFormValue)[]
    ).some((key) => initialValue[key] !== next[key])
    if (valueChanged) return 'updated'

    const initialAssigned = employees.assigned.map((staff) => staff.id)
    const assignmentChanged =
      initialAssigned.length !== currentAssignedIds.length ||
      initialAssigned.some((staffId) => !currentAssignedIds.includes(staffId))
    return assignmentChanged ? 'permission' : 'updated'
  }

  const saveMutation = useMutation({
    mutationFn: (next: ReservationFormValue) =>
      updateReservation({
        id: Number(id),
        body: toCreateReservationRequest(next, appAdminIds),
      }),
    onSuccess: async (_data, next) => {
      const toast = completionKind(next)
      // 목록만 무효화하고 이 예약의 상세는 따로 지운다. `['reservations']` 로 넓히면
      // 이미 떠난 화면의 쿼리까지 되살아난다.
      await queryClient.invalidateQueries({
        queryKey: ['reservations', 'list'],
      })
      await queryClient.invalidateQueries({ queryKey: ['reservations', id] })
      navigate(listPath, { state: { toast } })
    },
    onError: (error, next) =>
      setFailedToast(
        serverMessage(error, failureToastMessage[completionKind(next)]),
      ),
  })

  function handleSave() {
    setFailedToast(null)
    // 배정 직원 조회가 끝나기 전(또는 실패)에는 현재 배정을 알 수 없다. 이때 저장하면
    // appAdminIds 가 빈 목록으로 나가 기존 배정을 전부 지운다 → 조회 성공 전까지 저장을 막는다.
    if (assignedIds === null) {
      setFailedToast(failureToastMessage.permission)
      return
    }
    const nextErrors = validateReservationForm(formValue)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      saveMutation.mutate(formValue)
    } else {
      scrollToFirstError()
    }
  }

  if (isPending) {
    return (
      <Page>
        <Content>
          <ReservationBackLink to={listPath} />
          <ReservationEditSkeleton />
        </Content>
      </Page>
    )
  }

  return (
    <Page>
      <Content>
        <ReservationBackLink to={listPath} />
        <ReservationForm
          value={formValue}
          onChange={setValue}
          errors={errors}
          permission={{
            query: permissionQuery,
            onQueryChange: setPermissionQuery,
            assigned: assignedStaff,
            assignedCount: currentAssignedIds.length,
            available: availableStaff,
            onAdd: addStaff,
            onCancel: cancelStaff,
          }}
        />
        <Actions>
          <SaveButton
            type="button"
            disabled={saveMutation.isPending}
            onClick={handleSave}
          >
            저장하기
          </SaveButton>
        </Actions>
      </Content>

      {failedToast && (
        <Toast
          variant="error"
          message={failedToast}
          onDismiss={() => setFailedToast(null)}
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

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`

const SaveButton = styled.button`
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
