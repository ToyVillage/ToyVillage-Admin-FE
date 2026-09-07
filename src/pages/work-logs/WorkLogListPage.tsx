import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  deleteMockWorkLog,
  deleteMockWorkLogForm,
  getMockWorkLogForms,
  getMockWorkLogs,
  todayWorkLogDate,
  toIsoDate,
  WorkLogFormTable,
  WorkLogTable,
  type WorkLogDate,
} from '@/entities/work-log'
import {
  CategoryTabs,
  DeleteConfirmationDialog,
  LinkButton,
  Toast,
} from '@/shared/ui'
import { WorkLogDateFilter } from './ui/WorkLogDateFilter'

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
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [date, setDate] = useState<WorkLogDate>(todayWorkLogDate)
  const [page, setPage] = useState(1)
  const [openKebabId, setOpenKebabId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // 탭은 URL 이 소유한다. 알 수 없는 값은 기본 탭으로 본다(spec).
  const tab: WorkLogTab = searchParams.get('tab') === 'forms' ? 'forms' : 'logs'
  const isoDate = toIsoDate(date)

  const logsQuery = useQuery({
    queryKey: ['work-logs', 'list', { date: isoDate }],
    queryFn: () => getMockWorkLogs(isoDate),
    enabled: tab === 'logs',
  })
  const formsQuery = useQuery({
    queryKey: ['work-log-forms', 'list'],
    queryFn: getMockWorkLogForms,
    enabled: tab === 'forms',
  })

  const deleteMutation = useMutation({
    mutationFn: ({ tab: target, id }: PendingDelete) =>
      target === 'logs' ? deleteMockWorkLog(id) : deleteMockWorkLogForm(id),
    onSuccess: async (_data, variables) => {
      // 목록 쿼리만 무효화한다(상세 쿼리까지 넓히지 않는다).
      await queryClient.invalidateQueries({
        queryKey:
          variables.tab === 'logs'
            ? ['work-logs', 'list']
            : ['work-log-forms', 'list'],
      })
      setPendingDelete(null)
      setToastMessage('데이터 삭제에 성공했습니다')
    },
  })

  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data])
  const forms = useMemo(() => formsQuery.data ?? [], [formsQuery.data])
  const items = tab === 'logs' ? logs : forms
  const isPending = tab === 'logs' ? logsQuery.isPending : formsQuery.isPending

  const pageCount = Math.max(1, Math.ceil(items.length / TABLE_PAGE_SIZE))
  // 삭제로 마지막 페이지가 비면 자연히 직전 페이지가 된다.
  const currentPage = Math.min(page, pageCount)
  const pagination = { page: currentPage, pageCount, onChange: setPage }

  function slicePage<T>(list: T[]): T[] {
    return list.slice(
      (currentPage - 1) * TABLE_PAGE_SIZE,
      currentPage * TABLE_PAGE_SIZE,
    )
  }

  // 탭·조회날짜가 바뀌면 첫 페이지로 되돌린다. 렌더 중 상태 보정(effect 불필요).
  const tabAndDate = `${tab}:${isoDate}`
  const [prevTabAndDate, setPrevTabAndDate] = useState(tabAndDate)
  if (prevTabAndDate !== tabAndDate) {
    setPrevTabAndDate(tabAndDate)
    setPage(1)
    setOpenKebabId(null)
  }

  // 로딩 중에는 같은 자리에 빈 표를 두어 레이아웃이 튀지 않게 한다(빈 상태 문구는 아직 쓰지 않는다).
  const logsEmptyLabel = isPending
    ? ' '
    : '해당 날짜에 작성된 업무일지가 없습니다.'
  const formsEmptyLabel = isPending ? ' ' : '등록된 양식이 없습니다.'

  function handleSelectTab(label: string) {
    const nextTab: WorkLogTab = label === formsTabLabel ? 'forms' : 'logs'
    setSearchParams({ tab: nextTab })
  }

  function handleRequestDelete(id: string) {
    setOpenKebabId(null)
    setPendingDelete({ tab, id })
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

        <WorkLogDateFilter value={date} onChange={setDate} />

        <CategoryTabs
          categories={tabs}
          active={tab === 'forms' ? formsTabLabel : logsTabLabel}
          onSelect={handleSelectTab}
        />

        <TableArea>
          {tab === 'logs' ? (
            <WorkLogTable
              logs={slicePage(logs)}
              onRowClick={(id) => navigate(`/work-logs/${id}`)}
              onDelete={handleRequestDelete}
              openKebabId={openKebabId}
              onOpenKebabChange={setOpenKebabId}
              pagination={pagination}
              emptyLabel={logsEmptyLabel}
            />
          ) : (
            <WorkLogFormTable
              forms={slicePage(forms)}
              onEdit={(id) => navigate(`/work-logs/forms/${id}/edit`)}
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
