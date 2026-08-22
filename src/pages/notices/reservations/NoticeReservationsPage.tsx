import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ReservationTable,
  getReservationsAdmin,
  type Reservation,
  type ReservationStatus,
} from '@/entities/reservation'
import { ReservationStatusCards } from './ui/ReservationStatusCards'

// 한 페이지에 노출할 예약 수(Figma list 기준). 공지/자료와 동일.
const PAGE_SIZE = 4

type ReservationSort = 'consult' | 'reserve'

const sortOptions = [
  { value: 'consult', label: '상담일순' },
  { value: 'reserve', label: '예약일순' },
]

const emptyCounts = { pending: 0, approved: 0, rejected: 0 }
// 안정적인 참조(빈 결과)로 useMemo 의존성이 매 렌더 바뀌지 않게 한다.
const emptyReservations: Reservation[] = []

export function NoticeReservationsPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState<ReservationStatus>('pending')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<ReservationSort>('consult')
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: ['reservations'],
    queryFn: getReservationsAdmin,
  })

  const allReservations = data?.reservations ?? emptyReservations
  const counts = data?.counts ?? emptyCounts

  const filtered = useMemo(() => {
    const byStatus = allReservations.filter(
      (reservation) => reservation.status === active,
    )
    const keyword = query.trim().toLowerCase()
    const matched = keyword
      ? byStatus.filter((reservation) =>
          `${reservation.groupName} ${reservation.region}`
            .toLowerCase()
            .includes(keyword),
        )
      : byStatus

    const dateOf = (reservation: Reservation) =>
      sort === 'consult' ? reservation.consultDate : reservation.reserveDate
    return [...matched].sort((a, b) => dateOf(b).localeCompare(dateOf(a)))
  }, [active, allReservations, query, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  // 상태·검색·정렬이 바뀌면 첫 페이지로 되돌린다(렌더 중 상태 보정).
  const filterKey = `${active} ${query} ${sort}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const currentPage = Math.min(page, pageCount)

  const pageReservations = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  )

  return (
    <Page>
      <Content>
        <Header>
          <Title>단체예약 현황</Title>
          <Subtitle>토이빌리지의 단체 방문 일정을 모니터링</Subtitle>
        </Header>

        <StatusRow>
          <ReservationStatusCards
            counts={counts}
            active={active}
            onSelect={setActive}
          />
          <CreateButton
            type="button"
            onClick={() => navigate('/notices/reservations/create')}
          >
            단체예약 생성하기
          </CreateButton>
        </StatusRow>

        <ReservationTable
          reservations={pageReservations}
          onRowClick={(id) => navigate(`/notices/reservations/${id}`)}
          search={{
            value: query,
            onChange: setQuery,
            placeholder: '제목을 입력해주세요',
            ariaLabel: '예약 검색',
          }}
          sort={{
            value: sort,
            options: sortOptions,
            onChange: (value) => setSort(value as ReservationSort),
            ariaLabel: '예약 정렬',
          }}
          pagination={{ page: currentPage, pageCount, onChange: setPage }}
          emptyLabel={
            query.trim() ? '검색결과가 없습니다' : '아직 단체예약이 없습니다'
          }
        />
      </Content>
    </Page>
  )
}

const Page = styled.main`
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: calc(124px - 32px);
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 60px;
  font-weight: 600;
  line-height: 1.2;
`

const Subtitle = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const StatusRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-top: 24px;
`

const CreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 12px 16px;
  border: 0;
  border-radius: 53px;
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`
