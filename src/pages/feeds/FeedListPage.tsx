import { useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  animalSpeciesList,
  animalTaxonomicBySpecies,
  feedQueryKeys,
  FeedTable,
  feedTableMinWidth,
  getFeeds,
  type AnimalSpecies,
} from '@/entities/feed'
import { CategoryTabs, DateFilter } from '@/shared/ui'
import {
  readIsoDateParam,
  readPageParam,
  toCalendarDate,
  toIsoDate,
  type CalendarDate,
} from '@/shared/lib'
import { FeedTableSkeleton } from './ui/FeedTableSkeleton'

// Figma 표 높이(552 = 헤더 52 + 행 92 × 4 + 페이지네이션) 기준.
const TABLE_PAGE_SIZE = 10

const allTabLabel = '전체'
const tabs = [allTabLabel, ...animalSpeciesList]

export function FeedListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // 조회 조건은 URL 이 소유한다. 상세에 다녀오거나 새로고침해도 그대로 남는다.
  const [searchParams, setSearchParams] = useSearchParams()

  const isoDate = readIsoDateParam(searchParams)
  const date = toCalendarDate(isoDate)
  const tab = readTab(searchParams)
  const page = readPageParam(searchParams)
  // 탭 목록은 프론트 상수다. `전체` 는 분류를 보내지 않는다.
  const species: AnimalSpecies | null =
    tab === allTabLabel ? null : (tab as AnimalSpecies)

  // 조회날짜·분류가 바뀌면 첫 페이지로 되돌린다.
  function setDate(next: CalendarDate) {
    updateParams({ date: toIsoDate(next), tab, page: 1 })
  }

  function setTab(next: string) {
    updateParams({ date: isoDate, tab: next, page: 1 })
  }

  function setPage(next: number) {
    updateParams({ date: isoDate, tab, page: next })
  }

  function updateParams(next: { date: string; tab: string; page: number }) {
    const params = new URLSearchParams()
    params.set('date', next.date)
    if (next.tab !== allTabLabel) params.set('tab', next.tab)
    if (next.page > 1) params.set('page', String(next.page))
    setSearchParams(params, { replace: true })
  }

  // 서버 페이지네이션이다. 급여 목록은 화면과 같은 1-based 로 보낸다
  // (다른 목록은 0-based 다 — 개발자 결정).
  const feedsQuery = useQuery({
    queryKey: feedQueryKeys.list(isoDate, species, page),
    queryFn: () =>
      getFeeds({
        date: isoDate,
        animalTaxonomic: species && animalTaxonomicBySpecies[species],
        page,
        size: TABLE_PAGE_SIZE,
      }),
    // 급여 내역은 다른 직원이 계속 추가하므로 전역 staleTime(60초) 캐시를 쓰지 않는다.
    staleTime: 0,
    // 페이지를 넘기는 동안 직전 응답을 유지한다. 없으면 `totalPageSize` 가 잠시
    // 사라져 총 페이지 수가 현재 페이지로 줄었다가 되돌아온다.
    // 단, 조회날짜·분류가 바뀐 경우에는 버린다 — 새 조건을 기다리는 동안 이전
    // 조건의 행이 남아 있으면 그 행을 눌러 엉뚱한 상세로 들어갈 수 있다.
    placeholderData: (previousData, previousQuery) => {
      const previousFilter = previousQuery?.queryKey[2] as
        | { date: string; species: AnimalSpecies | null }
        | undefined
      if (!previousFilter) return undefined
      if (previousFilter.date !== isoDate) return undefined
      if (previousFilter.species !== species) return undefined

      return previousData
    },
  })

  const feeds = useMemo(() => feedsQuery.data?.items ?? [], [feedsQuery.data])

  const totalPageSize = feedsQuery.data?.totalPageSize
  const pageCount = Math.max(1, totalPageSize ?? page)
  const currentPage = Math.min(page, pageCount)
  const pagination = { page: currentPage, pageCount, onChange: setPage }

  // 마지막 페이지가 비면 직전 페이지를 다시 조회한다.
  // URL 을 바꾸는 일이라 렌더가 끝난 뒤에 한다(렌더 중 라우터 갱신 금지).
  useEffect(() => {
    if (totalPageSize !== undefined && page > pageCount) setPage(pageCount)
    // setPage 는 렌더마다 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPageSize, page, pageCount])

  // 조회 실패를 빈 목록으로 숨기지 않는다(다른 목록 화면과 같은 상태 카드).
  if (feedsQuery.isError) {
    return (
      <StatePage>
        <StateCard role="alert">
          급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <Heading>
          <Title>먹이 급여 관리</Title>
          <Subtitle>포유류·파충류·조류·어류별 먹이 급여 내역</Subtitle>
        </Heading>

        <DateFilter value={date} onChange={setDate} />

        <CategoryTabs categories={tabs} active={tab} onSelect={setTab} />

        <TableArea data-testid="feed-table-scroll">
          {feedsQuery.isPending ? (
            <FeedTableSkeleton />
          ) : (
            <FeedTable
              feeds={feeds}
              // 상세의 뒤로가기와 분류 뱃지가 이 조회 조건을 쓴다.
              onRowClick={(id) =>
                navigate(`/feeds/${id}`, {
                  state: { listSearch: location.search, species },
                })
              }
              pagination={pagination}
              emptyLabel="해당 날짜에 급여 내역이 없습니다."
            />
          )}
        </TableArea>
      </Content>
    </Page>
  )
}



// 알 수 없는 값은 기본 탭으로 본다.
function readTab(params: URLSearchParams): string {
  const value = params.get('tab')
  return value && tabs.includes(value) ? value : allTabLabel
}


const StatePage = styled.main`
  display: grid;
  min-height: 100vh;
  padding: 32px;
  place-items: center;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const StateCard = styled.section`
  width: min(100%, 560px);
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`

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

const Heading = styled.header`
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

// DataTable 의 기본 margin-top(20)에 12를 더해 Figma 의 탭바-표 간격 32를 맞춘다.
// 화면이 열 폭 합계보다 좁아지면 표만 가로로 스크롤한다(열이 표 밖으로 새지 않게).
const TableArea = styled.div`
  width: 100%;
  margin-top: 12px;
  overflow-x: auto;

  > * {
    min-width: ${feedTableMinWidth}px;
  }
`
