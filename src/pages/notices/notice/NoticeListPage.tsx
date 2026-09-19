import { useRef, useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  deleteNotice,
  getAllNotices,
  noticeCategoryLabel,
  NoticeTable,
} from '@/entities/notice'
import { getTeams } from '@/entities/team'
import { CreateNoticeButton } from '@/features/create-notice'

import {
  CategoryTabs,
  DeleteConfirmationDialog,
  Toast,
  useFocusFrame,
  type DataTableSortValue,
  type ToastVariant,
} from '@/shared/ui'
import { NoticeListSkeleton } from './ui/NoticeListSkeleton'

const API_PAGE_SIZE = 10
const TABLE_PAGE_SIZE = 4

export function NoticeListPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState('전체')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<DataTableSortValue>('newest')
  const [page, setPage] = useState(1)
  // 케밥 메뉴는 동시에 하나만 열린다. 열린 행 id 를 목록이 소유한다.
  const [openKebabId, setOpenKebabId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    variant: ToastVariant
    message: string
  } | null>(null)
  const queryClient = useQueryClient()
  const deletingRef = useRef(false)
  // 행별 `⋮` 버튼. 삭제 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const kebabTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()
  const deleteMutation = useMutation({ mutationFn: deleteNotice })
  const {
    data: queryNotices,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['notices', 'all', { size: API_PAGE_SIZE }],
    queryFn: () => getAllNotices({ size: API_PAGE_SIZE }),
  })
  const allNotices = useMemo(() => queryNotices ?? [], [queryNotices])
  // 분류 탭은 공지에 붙은 분류가 아니라 팀 목록이 기준이다(yot `1:2721`).
  // 생성·수정 폼과 같은 캐시를 써서 같은 팀 이름을 보여준다.
  const teamsQuery = useQuery({ queryKey: ['teams', 'list'], queryFn: getTeams })

  const categories = useMemo(
    () => [
      ...new Set([
        '전체',
        ...(teamsQuery.data?.map((team) => team.name) ?? []),
      ]),
    ],
    [teamsQuery.data],
  )

  const filtered = useMemo(() => {
    // 공지 하나가 여러 팀에 속할 수 있어(#147) `전체`가 아니면 팀 이름 포함 여부로 거른다.
    const byCategory =
      active === '전체'
        ? allNotices
        : allNotices.filter((notice) =>
            notice.teams.some((team) => team.name === active),
          )

    const keyword = query.trim().toLowerCase()
    const matchingNotices = keyword
      ? byCategory.filter((notice) =>
          `${notice.title} ${noticeCategoryLabel(notice.teams)} ${notice.date}`
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
    deleteMutation.mutate(
      { id: Number(targetId) },
      {
        onSuccess: async () => {
          queryClient.removeQueries({ queryKey: ['notices', targetId] })
          await queryClient.invalidateQueries({ queryKey: ['notices', 'all'] })
          deletingRef.current = false
          setDeleteTargetId(null)
          setToast({
            variant: 'success',
            message: '데이터 삭제에 성공했습니다',
          })
        },
        onError: () => {
          deletingRef.current = false
          setDeleteTargetId(null)
          setToast({ variant: 'error', message: '데이터 삭제에 실패했습니다' })
          focusKebabTrigger(targetId)
        },
      },
    )
  }

  function handleCancelDelete() {
    if (!deleteTargetId) return
    const targetId = deleteTargetId
    setDeleteTargetId(null)
    focusKebabTrigger(targetId)
  }

  if (isPending) {
    return (
      <Page>
        <Content>
          <NoticeListSkeleton />
        </Content>
      </Page>
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
          onEdit={(id) => navigate(`/notices/list/${id}/edit`)}
          onDelete={setDeleteTargetId}
          openKebabId={openKebabId}
          onOpenKebabChange={setOpenKebabId}
          onKebabTriggerRef={(id, node) => {
            if (node) kebabTriggersRef.current.set(id, node)
            else kebabTriggersRef.current.delete(id)
          }}
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

      {deleteTargetId && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={handleCancelDelete}
          onConfirm={handleDelete}
        />
      )}

      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
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
