import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  animalSpeciesList,
  feedQueryKeys,
  FeedTable,
  getFeeds,
  type AnimalSpecies,
} from '@/entities/feed'
import { CategoryTabs, DateFilter } from '@/shared/ui'
import { todayCalendarDate, toIsoDate, type CalendarDate } from '@/shared/lib'

// Figma 표 높이(552 = 헤더 52 + 행 92 × 4 + 페이지네이션) 기준.
const TABLE_PAGE_SIZE = 4

const allTabLabel = '전체'
const tabs = [allTabLabel, ...animalSpeciesList]

export function FeedListPage() {
  const navigate = useNavigate()
  const [date, setDate] = useState<CalendarDate>(todayCalendarDate)
  const [tab, setTab] = useState<string>(allTabLabel)
  const [page, setPage] = useState(1)

  const isoDate = toIsoDate(date)
  const species: AnimalSpecies | null =
    tab === allTabLabel ? null : (tab as AnimalSpecies)

  // 조회날짜·분류 탭이 바뀔 때마다 그 조건으로 다시 조회한다.
  // 서버에 분류 필터가 없어 요청은 날짜만 싣고, 분류는 받은 뒤 거른다.
  const feedsQuery = useQuery({
    queryKey: feedQueryKeys.list(isoDate, species),
    queryFn: () => getFeeds({ date: isoDate, species }),
    // 전역 staleTime(60초)을 쓰면 이미 본 탭으로 돌아올 때 캐시만 보고 요청하지 않는다.
    // 급여 내역은 다른 직원이 계속 추가하므로 탭을 누를 때마다 다시 조회한다.
    staleTime: 0,
  })

  const feeds = useMemo(() => feedsQuery.data ?? [], [feedsQuery.data])

  const pageCount = Math.max(1, Math.ceil(feeds.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagination = { page: currentPage, pageCount, onChange: setPage }
  const pageFeeds = feeds.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  )

  // 조회날짜·분류가 바뀌면 첫 페이지로 되돌린다. 렌더 중 상태 보정(effect 불필요).
  const dateAndTab = `${isoDate}:${tab}`
  const [prevDateAndTab, setPrevDateAndTab] = useState(dateAndTab)
  if (prevDateAndTab !== dateAndTab) {
    setPrevDateAndTab(dateAndTab)
    setPage(1)
  }

  // 로딩 중에는 같은 자리에 빈 표를 두어 레이아웃이 튀지 않게 한다.
  const emptyLabel = feedsQuery.isPending
    ? ' '
    : '해당 날짜에 급여 내역이 없습니다.'

  return (
    <Page>
      <Content>
        <Heading>
          <Title>먹이 급여 관리</Title>
          <Subtitle>포유류·파충류·조류·어류별 먹이 급여 내역</Subtitle>
        </Heading>

        <DateFilter value={date} onChange={setDate} />

        <CategoryTabs categories={tabs} active={tab} onSelect={setTab} />

        <TableArea>
          <FeedTable
            feeds={pageFeeds}
            onRowClick={(id) => navigate(`/feeds/${id}`)}
            pagination={pagination}
            emptyLabel={emptyLabel}
          />
        </TableArea>
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
const TableArea = styled.div`
  margin-top: 12px;
`
