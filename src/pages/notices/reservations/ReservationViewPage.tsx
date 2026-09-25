import { useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getReservation, getReservationEmployees } from '@/entities/reservation'
import {
  ReservationReadonlyForm,
  emptyReservationFormValue,
  toReservationFormValue,
} from '@/features/reservation-form'
import { ReservationBackLink } from './ui/ReservationBackLink'

// `/notices/reservations/:id` — 읽기 전용 단체예약 상세(Figma yot 1:6293 / 1:6494).
// 수정은 목록 케밥의 `/notices/reservations/:id/edit` 에서 한다.
export function ReservationViewPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  // 목록에서 넘어왔다면 그때의 조회 조건(상태·검색어·정렬·페이지)으로 돌아간다.
  const listState = location.state as { listSearch?: string } | null
  const listPath = `/notices/reservations${listState?.listSearch ?? ''}`

  const { data: reservation, isError } = useQuery({
    queryKey: ['reservations', id],
    queryFn: () => getReservation({ id: Number(id) }),
    enabled: Boolean(id),
    retry: false,
    // 삭제된 예약으로 다시 들어와도 stale 값이 보이지 않게 떠날 때 캐시를 버린다.
    gcTime: 0,
  })

  const { data: employees } = useQuery({
    queryKey: ['reservations', id, 'employees'],
    queryFn: () => getReservationEmployees({ reservationId: Number(id) }),
    enabled: Boolean(id),
    retry: false,
  })

  // 잘못된 id·404·조회 실패. 별도 '찾을 수 없음' 화면은 디자인에 없어 목록으로 되돌린다.
  useEffect(() => {
    if (!isError) return
    navigate(listPath, { replace: true })
  }, [isError, listPath, navigate])

  // 목록에서 스크롤을 내린 채 들어와도 상세는 맨 위부터 보이게 한다.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  // 조회 전에는 같은 구조의 빈 폼을 두어 값이 도착해도 레이아웃이 튀지 않게 한다.
  const value = useMemo(
    () =>
      reservation
        ? toReservationFormValue(reservation)
        : emptyReservationFormValue,
    [reservation],
  )

  return (
    <Page>
      <Content>
        <ReservationBackLink to={listPath} />
        <ReservationReadonlyForm
          value={value}
          assigned={employees?.assigned ?? []}
        />
      </Content>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 200px;
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
