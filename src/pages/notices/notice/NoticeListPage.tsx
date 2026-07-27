import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getMockNotices,
  NoticeTable,
  mockNotices,
  noticeCategories,
} from '@/entities/notice'
import { CreateNoticeButton } from '@/features/create-notice'
import { CategoryTabs } from './ui/CategoryTabs'
import type { DataTableSortValue } from '@/shared/ui'

// 한 페이지에 노출할 공지 수(Figma list 컴포넌트 기준). 자료실과 동일.
const PAGE_SIZE = 4

export function NoticeListPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState('전체')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<DataTableSortValue>('newest')
  const [page, setPage] = useState(1)
  const { data: allNotices = mockNotices } = useQuery({
    queryKey: ['notices'],
    queryFn: getMockNotices,
    placeholderData: mockNotices,
  })

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

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
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  )

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
          categories={noticeCategories}
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
