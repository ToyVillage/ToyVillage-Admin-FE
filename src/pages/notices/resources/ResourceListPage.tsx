import { useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ResourceTable,
  deleteDocument,
  getDocuments,
  fileTypeTabs,
  fileTypeToDocumentType,
  tabToFileType,
} from '@/entities/resource'
import { CreateResourceButton } from '@/features/create-resource'
import { readPageParam, useListSearchParams } from '@/shared/lib'
import {
  DeleteConfirmationDialog,
  Toast,
  useFocusFrame,
  type DataTableSortValue,
  type ToastVariant,
} from '@/shared/ui'
import type { ResourceFormCompletion } from '@/features/create-resource'
import { FileTypeTabs } from './ui/FileTypeTabs'
import { ResourceListSkeleton } from './ui/ResourceListSkeleton'

// 한 페이지당 자료 수. 서버에 size 로 전달하고 page 이동 시 page 로 재요청한다.
const PAGE_SIZE = 10
// 빈 상태에서 유지할 테이블 본문 높이(Figma 빈 상태 프레임 기준).
const EMPTY_MIN_HEIGHT = 368
// 검색 입력 디바운스(ms). 입력이 멈춘 뒤에만 조회 요청을 보낸다.
const SEARCH_DEBOUNCE_MS = 200

// 생성·수정 화면에서 돌아왔을 때 띄우는 토스트(Figma `자료실 · 토스트` 311:12766).
// 삭제는 이 화면(목록 케밥)에서 하므로 아래 `localToast` 가 맡는다.
// 수정 성공만 Figma 에 노드가 없다 — 나머지와 같은 문구 규칙으로 맞춘다(개발자 결정).
const toastMessages: Record<ResourceFormCompletion, string> = {
  created: '데이터 생성에 성공했습니다',
  updated: '데이터 수정에 성공했습니다',
}

// URL 에 남기지 않을 기본값(전체 유형·최신순·첫 페이지·검색어 없음).
const listParamDefaults = {
  tab: '전체',
  keyword: '',
  sort: 'newest',
  page: '1',
} as const

export function ResourceListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // 조회 조건(파일 유형·검색어·페이지)은 URL 이 소유한다.
  // 상세에 다녀오거나 새로고침해도 걸어둔 조건이 그대로 남는다.
  const { values, update } = useListSearchParams(listParamDefaults)
  const active = values.tab
  const debouncedKeyword = values.keyword
  const page = readPageParam(new URLSearchParams({ page: values.page }))
  const [query, setQuery] = useState(debouncedKeyword)
  // 케밥 메뉴는 동시에 하나만 열린다. 열린 행 id 를 목록이 소유한다.
  const [openKebabId, setOpenKebabId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [localToast, setLocalToast] = useState<{
    variant: ToastVariant
    message: string
  } | null>(null)
  const queryClient = useQueryClient()
  const deletingRef = useRef(false)
  // 행별 `⋮` 버튼. 삭제 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const kebabTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument({ id: Number(id) }),
  })

  const sort: DataTableSortValue =
    values.sort === 'oldest' ? 'oldest' : 'newest'

  function setSort(next: DataTableSortValue) {
    update({ sort: next, page: '1' })
  }

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

  function setActive(next: string) {
    update({ tab: next, page: '1' })
  }

  function setPage(next: number) {
    update({ page: String(next) })
  }

  // 입력값(query)은 즉시 반영하되, 실제 조회 키워드(URL)는 디바운스해 타이핑 중 요청을 막는다.
  useEffect(() => {
    if (query.trim() === debouncedKeyword) return

    const timer = setTimeout(
      () => update({ keyword: query.trim(), page: '1' }),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [query, debouncedKeyword, update])

  // 파일 유형 탭 → DOCUMENTS_QUERY_ALL 의 types 필터. '전체'면 보내지 않는다.
  const types = useMemo(() => {
    const fileType = tabToFileType[active]
    return fileType ? [fileTypeToDocumentType[fileType]] : undefined
  }, [active])

  // 서버 사이드 페이지네이션: page·size·keyword·types 로 해당 페이지만 요청한다.
  // 자료실 API 의 page 는 화면과 같은 1-based 다(1 페이지 = `page=1`, 서버 기본값도 1).
  const { data, isPending } = useQuery({
    queryKey: [
      'resources',
      'list',
      { page, size: PAGE_SIZE, keyword: debouncedKeyword, types, sort },
    ],
    queryFn: () =>
      getDocuments({
        page,
        size: PAGE_SIZE,
        keyword: debouncedKeyword || undefined,
        // 최신순 = 등록일 내림차순. 오래된순이 ASC 다.
        orderDirection: sort === 'oldest' ? 'ASC' : 'DESC',
        types,
      }),
    placeholderData: (previousData) => previousData,
  })
  const resources = useMemo(() => data?.resources ?? [], [data])

  // 응답의 totalPageSize(전체 페이지 수)로 페이지 번호를 그린다. 자료가 없으면 1로 둔다.
  const pageCount = Math.max(1, data?.totalPageSize ?? 1)

  // 삭제·필터로 전체 페이지 수가 줄어 URL 의 page 가 범위를 벗어나면 마지막 페이지로
  // 되돌려 빈 페이지에 고착되지 않게 한다.
  useEffect(() => {
    if (data && page > pageCount) setPage(pageCount)
    // setPage 는 렌더마다 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page, pageCount])

  function focusKebabTrigger(id: string) {
    // 삭제된 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
    focusFrame(() => kebabTriggersRef.current.get(id))
  }

  function handleDelete() {
    if (!deleteTargetId || deletingRef.current || deleteMutation.isPending) {
      return
    }

    deletingRef.current = true
    const targetId = deleteTargetId
    deleteMutation.mutate(targetId, {
      onSuccess: async () => {
        // 목록만 무효화한다. 상세 쿼리까지 넓히면 삭제된 id 를 다시 GET 해 404 가 난다.
        await queryClient.invalidateQueries({ queryKey: ['resources', 'list'] })
        deletingRef.current = false
        setDeleteTargetId(null)
        setLocalToast({
          variant: 'success',
          message: '데이터 삭제에 성공했습니다',
        })
      },
      onError: () => {
        deletingRef.current = false
        setDeleteTargetId(null)
        setLocalToast({
          variant: 'error',
          message: '데이터 삭제에 실패했습니다',
        })
        focusKebabTrigger(targetId)
      },
    })
  }

  if (isPending) {
    return (
      <Page>
        <Content>
          <ResourceListSkeleton />
        </Content>
      </Page>
    )
  }

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
          onRowClick={(id) =>
            navigate(`/notices/resources/${id}`, {
              state: { listSearch: location.search },
            })
          }
          onEdit={(id) =>
            navigate(`/notices/resources/${id}/edit`, {
              state: { listSearch: location.search },
            })
          }
          onDelete={(id) => {
            setOpenKebabId(null)
            setDeleteTargetId(id)
          }}
          openKebabId={openKebabId}
          onOpenKebabChange={setOpenKebabId}
          onKebabTriggerRef={(id, node) => {
            if (node) kebabTriggersRef.current.set(id, node)
            else kebabTriggersRef.current.delete(id)
          }}
          sort={{
            value: sort,
            onChange: (value) => setSort(value as DataTableSortValue),
            ariaLabel: '자료 날짜 정렬',
          }}
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

      {deleteTargetId && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => {
            const targetId = deleteTargetId
            setDeleteTargetId(null)
            focusKebabTrigger(targetId)
          }}
          onConfirm={handleDelete}
        />
      )}

      {localToast && (
        <Toast
          variant={localToast.variant}
          message={localToast.message}
          onDismiss={() => setLocalToast(null)}
        />
      )}

      {!localToast && toastMessage && (
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
