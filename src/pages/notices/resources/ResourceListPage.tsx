import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ResourceTable,
  getDocuments,
  fileTypeTabs,
  tabToFileType,
} from '@/entities/resource'
import { CreateResourceButton } from '@/features/create-resource'
import { FileTypeTabs } from './ui/FileTypeTabs'

// 한 페이지당 자료 수. 서버에 size 로 전달하고 page 이동 시 page 로 재요청한다.
const PAGE_SIZE = 10
// 빈 상태에서 유지할 테이블 본문 높이(Figma 빈 상태 프레임 기준).
const EMPTY_MIN_HEIGHT = 368
// 검색 입력 디바운스(ms). 입력이 멈춘 뒤에만 조회 요청을 보낸다.
const SEARCH_DEBOUNCE_MS = 200

export function ResourceListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState('전체')
  const [query, setQuery] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  // 페이지 번호는 URL(?page=)에 둔다. 상세로 갔다가 뒤로가기 하면 그 페이지가 복원된다.
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const setPage = useCallback(
    (next: number, options?: { replace?: boolean }) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        params.set('page', String(next))
        return params
      }, options)
    },
    [setSearchParams],
  )

  // 입력값(query)은 즉시 반영하되, 실제 조회 키워드는 디바운스해 타이핑 중 요청을 막는다.
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedKeyword(query.trim()),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [query])

  // 서버 사이드 페이지네이션: page(0부터)·size·keyword 로 해당 페이지만 요청한다.
  const { data } = useQuery({
    queryKey: ['resources', 'list', { page, size: PAGE_SIZE, keyword: debouncedKeyword }],
    queryFn: () =>
      getDocuments({
        page: page - 1,
        size: PAGE_SIZE,
        keyword: debouncedKeyword || undefined,
        orderDirection: 'DESC',
      }),
    placeholderData: (previousData) => previousData,
  })
  const pageItems = useMemo(() => data ?? [], [data])

  // 탭·검색이 바뀌면 첫 페이지로 되돌린다(최초 마운트에서는 URL 페이지를 유지).
  const filterKey = `${active} ${debouncedKeyword}`
  const prevFilterKeyRef = useRef(filterKey)
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey
      setPage(1)
    }
  }, [filterKey, setPage])

  // 마지막 페이지가 정확히 size(10)개면 빈 다음 페이지가 노출될 수 있다(응답에 총개수가
  // 없어 사전 판단 불가). 조회 성공 응답이 빈 배열이고 1페이지가 아니면 이전 페이지로
  // 되돌려 빈 페이지에 고착되지 않게 한다.
  useEffect(() => {
    if (data && data.length === 0 && page > 1) {
      setPage(page - 1, { replace: true })
    }
  }, [data, page, setPage])

  // 자료 타입 탭은 API 필터 파라미터가 없어 현재 페이지 내 클라이언트 필터로 임시 처리한다.
  // (정식 타입 필터는 백엔드 type 파라미터 추가 후 서버 페이지네이션으로 전환)
  const resources = useMemo(() => {
    const type = tabToFileType[active]
    return type === null || type === undefined
      ? pageItems
      : pageItems.filter((resource) => resource.fileType === type)
  }, [active, pageItems])

  // 총 개수가 응답에 없어(배열만) 마지막 페이지를 알 수 없다. 현재 페이지가 가득 차면
  // 다음 페이지가 있다고 보고 이동을 허용한다(백엔드 총개수 확정 시 정식 번호로 전환).
  const hasNextPage = pageItems.length === PAGE_SIZE
  const pageCount = hasNextPage ? page + 1 : Math.max(page, 1)

  return (
    <Page>
      <Content>
        <Header>
          <div>
            <Title>자료실</Title>
            <Subtitle>토이빌리지의 모든 자료</Subtitle>
          </div>
          <CreateResourceButton />
        </Header>

        <FileTypeTabs
          types={fileTypeTabs}
          active={active}
          onSelect={setActive}
        />

        <ResourceTable
          resources={resources}
          onRowClick={(id) => navigate(`/notices/resources/${id}`)}
          search={{
            value: query,
            onChange: setQuery,
            placeholder: '제목을 입력해주세요',
            ariaLabel: '자료 검색',
          }}
          pagination={{ page, pageCount, onChange: setPage }}
          emptyLabel={
            debouncedKeyword ? '검색결과가 없습니다' : '등록된 자료가 없습니다.'
          }
          // 빈 상태에서도 본문 높이를 유지해 테이블이 쪼그라들지 않게 한다.
          emptyMinHeight={EMPTY_MIN_HEIGHT}
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
