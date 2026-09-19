import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ResourceTable,
  getDocuments,
  fileTypeTabs,
  fileTypeToDocumentType,
  tabToFileType,
} from '@/entities/resource'
import { CreateResourceButton } from '@/features/create-resource'
import { Toast } from '@/shared/ui'
import type { ResourceFormCompletion } from '@/features/create-resource'
import { FileTypeTabs } from './ui/FileTypeTabs'

// 한 페이지당 자료 수. 서버에 size 로 전달하고 page 이동 시 page 로 재요청한다.
const PAGE_SIZE = 10
// 빈 상태에서 유지할 테이블 본문 높이(Figma 빈 상태 프레임 기준).
const EMPTY_MIN_HEIGHT = 368
// 검색 입력 디바운스(ms). 입력이 멈춘 뒤에만 조회 요청을 보낸다.
const SEARCH_DEBOUNCE_MS = 200

// 목록으로 돌아왔을 때 띄우는 토스트(Figma `자료실 · 토스트` 311:12766).
// 수정 성공만 Figma 에 노드가 없다 — 나머지와 같은 `데이터 {동작}에 성공했습니다`
// 문구로 맞춘다(개발자 결정).
const toastMessages: Record<ResourceFormCompletion, string> = {
  created: '데이터 생성에 성공했습니다',
  updated: '데이터 수정에 성공했습니다',
  deleted: '데이터 삭제에 성공했습니다',
}

export function ResourceListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // 생성·수정·삭제 화면에서 넘겨받은 결과로 토스트를 띄운다.
  // 첫 렌더에서 값을 읽어 두고 이동 state 는 지운다 — 새로고침이나 뒤로가기로
  // 같은 토스트가 다시 뜨지 않게 하려는 것이다.
  const completion = (
    location.state as { toast?: ResourceFormCompletion } | null
  )?.toast
  const [toastMessage, setToastMessage] = useState<string | null>(
    completion ? toastMessages[completion] : null,
  )
  useEffect(() => {
    if (!completion) return

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    })
  }, [completion, location.pathname, location.search, navigate])
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

  // 파일 유형 탭 → DOCUMENTS_QUERY_ALL 의 types 필터. '전체'면 보내지 않는다.
  const types = useMemo(() => {
    const fileType = tabToFileType[active]
    return fileType ? [fileTypeToDocumentType[fileType]] : undefined
  }, [active])

  // 서버 사이드 페이지네이션: page(0부터)·size·keyword·types 로 해당 페이지만 요청한다.
  const { data } = useQuery({
    queryKey: [
      'resources',
      'list',
      { page, size: PAGE_SIZE, keyword: debouncedKeyword, types },
    ],
    queryFn: () =>
      getDocuments({
        page: page - 1,
        size: PAGE_SIZE,
        keyword: debouncedKeyword || undefined,
        orderDirection: 'DESC',
        types,
      }),
    placeholderData: (previousData) => previousData,
  })
  const resources = useMemo(() => data?.resources ?? [], [data])

  // 탭·검색이 바뀌면 첫 페이지로 되돌린다(최초 마운트에서는 URL 페이지를 유지).
  const filterKey = `${active} ${debouncedKeyword}`
  const prevFilterKeyRef = useRef(filterKey)
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey
      setPage(1)
    }
  }, [filterKey, setPage])

  // 응답의 totalPageSize(전체 페이지 수)로 페이지 번호를 그린다. 자료가 없으면 1로 둔다.
  const pageCount = Math.max(1, data?.totalPageSize ?? 1)

  // 삭제·필터로 전체 페이지 수가 줄어 URL 의 page 가 범위를 벗어나면 마지막 페이지로
  // 되돌려 빈 페이지에 고착되지 않게 한다.
  useEffect(() => {
    if (data && page > pageCount) {
      setPage(pageCount, { replace: true })
    }
  }, [data, page, pageCount, setPage])

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
      {toastMessage && (
        <Toast
          variant="success"
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      )}
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
