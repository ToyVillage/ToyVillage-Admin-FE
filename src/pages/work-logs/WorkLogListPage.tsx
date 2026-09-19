import { useEffect, useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  deleteWorkLog,
  deleteWorkLogForm,
  getWorkLogForms,
  getWorkLogs,
  todayWorkLogDate,
  toIsoDate,
  workLogFormQueryKeys,
  workLogQueryKeys,
  WorkLogFormTable,
  WorkLogTable,
  type WorkLogDate,
} from '@/entities/work-log'
import { readIsoDateParam, readPageParam, toCalendarDate } from '@/shared/lib'
import {
  CategoryTabs,
  DateFilter,
  DeleteConfirmationDialog,
  LinkButton,
  Toast,
} from '@/shared/ui'

// Figma 표 높이(552 = 헤더 52 + 행 92 × 4 + 페이지네이션) 기준.
const TABLE_PAGE_SIZE = 4

const logsTabLabel = '작성된 일지'
const formsTabLabel = '양식 관리'
const tabs = [logsTabLabel, formsTabLabel]

type WorkLogTab = 'logs' | 'forms'

interface PendingDelete {
  tab: WorkLogTab
  id: string
}

export function WorkLogListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  // 조회 조건(탭·조회날짜·페이지)은 URL 이 소유한다.
  // 상세에 다녀오거나 새로고침해도 고른 날짜와 페이지가 그대로 남는다.
  const [searchParams, setSearchParams] = useSearchParams()
  const [openKebabId, setOpenKebabId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // 알 수 없는 탭 값은 기본 탭으로 본다(spec).
  const tab: WorkLogTab = searchParams.get('tab') === 'forms' ? 'forms' : 'logs'
  const isoDate = readIsoDateParam(searchParams)
  const date: WorkLogDate = toCalendarDate(isoDate)
  const page = readPageParam(searchParams)

  // 조회날짜·탭이 바뀌면 첫 페이지로 되돌린다.
  function setDate(next: WorkLogDate) {
    updateParams({ tab, date: toIsoDate(next), page: 1 })
  }

  function setPage(next: number) {
    updateParams({ tab, date: isoDate, page: next })
  }

  function updateParams(next: { tab: WorkLogTab; date: string; page: number }) {
    const params = new URLSearchParams()
    params.set('tab', next.tab)
    // 오늘이면 URL 에 남기지 않는다(기본값). 양식 관리에서도 값은 들고 다녀
    // 탭을 왕복해도 고른 날짜가 풀리지 않게 한다.
    if (next.date !== toIsoDate(todayWorkLogDate())) params.set('date', next.date)
    if (next.page > 1) params.set('page', String(next.page))
    setSearchParams(params, { replace: true })
  }

  // 서버 페이지네이션이다. 명세는 page 를 0부터 적었지만 서버는 1부터 센다(#158).

  const logsQuery = useQuery({
    queryKey: workLogQueryKeys.list(isoDate, page),
    queryFn: () => getWorkLogs({ date: isoDate, page, size: TABLE_PAGE_SIZE }),
    enabled: tab === 'logs',
  })
  // 양식은 날짜에 묶이지 않는다 — 조회날짜를 보내지 않는다(양식 관리 탭에 필터가 없다).
  const formsQuery = useQuery({
    queryKey: workLogFormQueryKeys.list(page),
    queryFn: () => getWorkLogForms({ page, size: TABLE_PAGE_SIZE }),
    enabled: tab === 'forms',
  })

  const deleteMutation = useMutation({
    mutationFn: ({ tab: target, id }: PendingDelete) =>
      target === 'logs'
        ? deleteWorkLog({ workLogId: Number(id) })
        : deleteWorkLogForm({ workLogTemplateId: Number(id) }),
    onSuccess: async (_data, variables) => {
      // 목록 쿼리만 무효화한다(상세 쿼리까지 넓히지 않는다).
      await queryClient.invalidateQueries({
        queryKey:
          variables.tab === 'logs'
            ? workLogQueryKeys.all
            : workLogFormQueryKeys.all,
        predicate: (query) => query.queryKey[1] === 'list',
      })
      setPendingDelete(null)
      setToastMessage('데이터 삭제에 성공했습니다')
    },
  })

  const logs = useMemo(() => logsQuery.data?.items ?? [], [logsQuery.data])
  const forms = useMemo(() => formsQuery.data?.items ?? [], [formsQuery.data])
  const activeQuery = tab === 'logs' ? logsQuery : formsQuery
  const isPending = activeQuery.isPending

  const totalPages = activeQuery.data?.totalPages
  const pageCount = Math.max(1, totalPages ?? page)
  const currentPage = Math.min(page, pageCount)
  const pagination = { page: currentPage, pageCount, onChange: setPage }

  // 삭제로 마지막 페이지가 비면 직전 페이지를 다시 조회한다.
  // 로딩 중에는 총 페이지 수를 모르므로 응답을 받은 뒤에만 보정한다.
  // URL 을 바꾸는 일이라 렌더가 끝난 뒤에 한다(렌더 중 라우터 갱신 금지).
  useEffect(() => {
    if (totalPages !== undefined && page > pageCount) setPage(pageCount)
    // setPage 는 렌더마다 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, page, pageCount])

  // 로딩 중에는 같은 자리에 빈 표를 두어 레이아웃이 튀지 않게 한다(빈 상태 문구는 아직 쓰지 않는다).
  const logsEmptyLabel = isPending
    ? ' '
    : '해당 날짜에 작성된 업무일지가 없습니다.'
  const formsEmptyLabel = isPending ? ' ' : '등록된 양식이 없습니다.'

  function handleSelectTab(label: string) {
    const nextTab: WorkLogTab = label === formsTabLabel ? 'forms' : 'logs'
    setOpenKebabId(null)
    updateParams({ tab: nextTab, date: isoDate, page: 1 })
  }

  function handleRequestDelete(id: string) {
    setOpenKebabId(null)
    setPendingDelete({ tab, id })
  }

  // 조회 실패를 빈 목록으로 숨기지 않는다(다른 목록 화면과 같은 상태 카드).
  if (activeQuery.isError) {
    return (
      <StatePage>
        <StateCard role="alert">
          {tab === 'forms'
            ? '양식을 불러오지 못했습니다. 다시 시도해 주세요.'
            : '업무일지를 불러오지 못했습니다. 다시 시도해 주세요.'}
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <Header>
          <Heading>
            <Title>업무일지관리</Title>
            <Subtitle>토이빌리지의 업무일지관리</Subtitle>
          </Heading>
          <LinkButton to="/work-logs/forms/create">양식 생성하기</LinkButton>
        </Header>

        <CategoryTabs
          categories={tabs}
          active={tab === 'forms' ? formsTabLabel : logsTabLabel}
          onSelect={handleSelectTab}
        />

        {tab === 'logs' && <DateFilter value={date} onChange={setDate} />}

        <TableArea>
          {tab === 'logs' ? (
            <WorkLogTable
              logs={logs}
              onRowClick={(id) =>
                navigate(`/work-logs/${id}`, {
                  state: { listSearch: location.search },
                })
              }
              onDelete={handleRequestDelete}
              openKebabId={openKebabId}
              onOpenKebabChange={setOpenKebabId}
              pagination={pagination}
              emptyLabel={logsEmptyLabel}
            />
          ) : (
            <WorkLogFormTable
              forms={forms}
              onRowClick={(id) =>
                navigate(`/work-logs/forms/${id}`, {
                  state: { listSearch: location.search },
                })
              }
              onDelete={handleRequestDelete}
              openKebabId={openKebabId}
              onOpenKebabChange={setOpenKebabId}
              pagination={pagination}
              emptyLabel={formsEmptyLabel}
            />
          )}
        </TableArea>
      </Content>

      {pendingDelete && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteMutation.mutate(pendingDelete)}
        />
      )}

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

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`

const Heading = styled.div`
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
