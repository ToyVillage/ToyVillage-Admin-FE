import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getNotices, NoticeTable } from '@/entities/notice'
import { CreateNoticeButton } from '@/features/create-notice'
import { CategoryTabs } from './ui/CategoryTabs'
import type { DataTableSortValue } from '@/shared/ui'

const API_PAGE = 0
const API_PAGE_SIZE = 10
const TABLE_PAGE_SIZE = 4

export function NoticeListPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState('전체')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<DataTableSortValue>('newest')
  const [page, setPage] = useState(1)
  const {
    data: queryNotices,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['notices', { page: API_PAGE, size: API_PAGE_SIZE }],
    queryFn: () => getNotices({ page: API_PAGE, size: API_PAGE_SIZE }),
  })
  const allNotices = useMemo(() => queryNotices ?? [], [queryNotices])

  const categories = useMemo(
    () => [
      ...new Set(['전체', ...allNotices.map((notice) => notice.category)]),
    ],
    [allNotices],
  )

  const filtered = useMemo(() => {
    const byCategory =
      active === '전체'
        ? allNotices
        : allNotices.filter((notice) => notice.category === active)

    const keyword = query.trim().toLowerCase()
    const matchingNotices = keyword
      ? byCategory.filter((notice) =>
          `${notice.title} ${notice.category} ${notice.date}`
            .toLowerCase()
            .includes(keyword),
        )
      : byCategory

    return [...matchingNotices].sort((a, b) =>
      sort === 'newest'
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    )
  }, [active, allNotices, query, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE))

  // 탭·검색이 바뀌면 첫 페이지로 되돌린다. 렌더 중 상태 보정(effect 불필요).
  const filterKey = `${active} ${query} ${sort}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }
  const currentPage = Math.min(page, pageCount)

  const notices = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * TABLE_PAGE_SIZE,
        currentPage * TABLE_PAGE_SIZE,
      ),
    [filtered, currentPage],
  )

  if (isPending) {
    return (
      <StatePage>
        <StateCard role="status">공지사항을 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (isError) {
    return (
      <StatePage>
        <StateCard role="alert">
          공지사항을 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <Header>
          <div>
            <Title>공지사항</Title>
            <Subtitle>토이빌리지의 중요한 공지사항</Subtitle>
          </div>
          <CreateNoticeButton />
        </Header>

        <CategoryTabs
          categories={categories}
          active={active}
          onSelect={setActive}
        />

        <NoticeTable
          notices={notices}
          onRowClick={(id) => navigate(`/notices/list/${id}`)}
          search={{
            value: query,
            onChange: setQuery,
            placeholder: '제목을 입력해주세요',
            ariaLabel: '공지 검색',
          }}
          sort={{
            value: sort,
            onChange: (value) => setSort(value as DataTableSortValue),
            ariaLabel: '공지 날짜 정렬',
          }}
          pagination={{ page: currentPage, pageCount, onChange: setPage }}
          emptyLabel={
            query.trim() ? '검색결과가 없습니다' : '표시할 공지가 없습니다'
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
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
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
  color: ${({ theme }) => theme.colors.textSub};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

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
