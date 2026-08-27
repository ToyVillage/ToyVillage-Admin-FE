import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ReservationTable,
  getAdminReservations,
  reservationStatusToCode,
  type ReservationSortCode,
  type ReservationStatus,
} from '@/entities/reservation'
import { ReservationStatusCards } from './ui/ReservationStatusCards'

// 한 페이지에 노출할 예약 수. 서버에 size 로 전달하고 page 이동 시 page 로 재요청한다.
const PAGE_SIZE = 10
// 검색 입력 디바운스(ms). 입력이 멈춘 뒤에만 조회 요청을 보낸다.
const SEARCH_DEBOUNCE_MS = 200

type ReservationSort = 'consult' | 'reserve'

const sortOptions = [
  { value: 'consult', label: '상담일순' },
  { value: 'reserve', label: '예약일순' },
]

// UI 정렬 값 → 서버 정렬 코드.
const sortToCode: Record<ReservationSort, ReservationSortCode> = {
  consult: 'COUNSEL_DATE',
  reserve: 'RESERVATION_DATE',
}

const emptyCounts: Record<ReservationStatus, number> = {
  pending: 0,
  approved: 0,
  rejected: 0,
}

export function NoticeReservationsPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState<ReservationStatus>('pending')
  const [query, setQuery] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [sort, setSort] = useState<ReservationSort>('consult')
  const [page, setPage] = useState(1)

  // 입력값(query)은 즉시 반영하되, 실제 조회 키워드는 디바운스해 타이핑 중 요청을 막는다.
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedKeyword(query.trim()),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [query])

  // 서버 사이드 조회: 상태 필터·검색·정렬·페이지를 파라미터로 전달한다.
  const { data, isError } = useQuery({
    queryKey: ['reservations', 'list', { status: active, title: debouncedKeyword, sort, page }],
    queryFn: () =>
      getAdminReservations({
        status: reservationStatusToCode[active],
        title: debouncedKeyword || undefined,
        sort: sortToCode[sort],
        page: page - 1,
        size: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  })

  // 상태 카운트는 필터와 무관하게 항상 전체 기준(서버 응답값).
  const counts = data?.counts ?? emptyCounts
  const pageReservations = data?.reservations ?? []
  const pageCount = Math.max(1, data?.totalPages ?? 1)

  // 상태·검색·정렬이 바뀌면 첫 페이지로 되돌린다.
  const filterKey = `${active} ${debouncedKeyword} ${sort}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const currentPage = Math.min(page, pageCount)

  return (
    <Page>
      <Content>
        <Header>
          <Title>단체예약 현황</Title>
          <Subtitle>토이빌리지의 단체 방문 일정을 모니터링</Subtitle>
        </Header>

        {isError && (
          <ErrorAlert role="alert">
            단체예약을 불러오지 못했습니다. 다시 시도해 주세요.
          </ErrorAlert>
        )}

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
            debouncedKeyword ? '검색결과가 없습니다' : '아직 단체예약이 없습니다'
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

const ErrorAlert = styled.div`
  margin-top: 24px;
  padding: 20px 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
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
