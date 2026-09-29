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
  WorkLogFormFilter,
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
// `양식 필터` 선택지를 받는 페이지 크기. 양식이 더 많으면 나머지 페이지도 받는다.
const FORM_FILTER_OPTION_SIZE = 100

const logsTabLabel = '작성된 일지'
const formsTabLabel = '양식 관리'
const tabs = [logsTabLabel, formsTabLabel]

type WorkLogTab = 'logs' | 'forms'

interface PendingDelete {
  tab: WorkLogTab
  id: string
}

interface ListParams {
  tab: WorkLogTab
  date: string
  page: number
  templateId: string | null
}

export function WorkLogListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  // 조회 조건(탭·조회날짜·양식 필터·페이지)은 URL 이 소유한다.
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
  const templateId = readTemplateIdParam(searchParams)
  // 값은 있는데 양식 id 로 읽을 수 없으면(문자·범위 초과) URL 에서 지운다.
  const invalidTemplateParam =
    searchParams.has('templateId') && templateId === null

  // 조회날짜·양식 필터·탭이 바뀌면 첫 페이지로 되돌린다.
  function setDate(next: WorkLogDate) {
    updateParams({ tab, date: toIsoDate(next), page: 1, templateId })
  }

  function setTemplateId(next: string | null) {
    updateParams({ tab, date: isoDate, page: 1, templateId: next })
  }

  function setPage(next: number) {
    updateParams({ tab, date: isoDate, page: next, templateId })
  }

  function updateParams(next: ListParams) {
    const params = new URLSearchParams()
    params.set('tab', next.tab)
    // 오늘이면 URL 에 남기지 않는다(기본값). 양식 관리에서도 값은 들고 다녀
    // 탭을 왕복해도 고른 날짜가 풀리지 않게 한다.
    if (next.date !== toIsoDate(todayWorkLogDate()))
      params.set('date', next.date)
    // 양식 필터도 날짜처럼 양식 관리 탭에서 들고 다닌다. `전체 양식` 이면 남기지 않는다.
    if (next.templateId) params.set('templateId', next.templateId)
    if (next.page > 1) params.set('page', String(next.page))
    setSearchParams(params, { replace: true })
  }

  // 서버 페이지네이션이다. 명세는 page 를 0부터 적었지만 서버는 1부터 센다(#158).
  // 양식 필터도 서버가 거른다(`templateId`, #206).
  const logsQuery = useQuery({
    queryKey: workLogQueryKeys.list(isoDate, page, templateId),
    queryFn: () =>
      getWorkLogs({
        date: isoDate,
        templateId: templateId === null ? undefined : Number(templateId),
        page,
        size: TABLE_PAGE_SIZE,
      }),
    enabled: tab === 'logs',
  })
  // 양식은 날짜에 묶이지 않는다 — 조회날짜를 보내지 않는다(양식 관리 탭에 필터가 없다).
  const formsQuery = useQuery({
    queryKey: workLogFormQueryKeys.list(page),
    queryFn: () => getWorkLogForms({ page, size: TABLE_PAGE_SIZE }),
    enabled: tab === 'forms',
  })
  // 선택지를 못 받아도 목록은 그대로 쓸 수 있다. 실패를 화면 오류로 올리지 않고,
  // 고른 양식이 있으면 트리거를 비워 둔다(`전체 양식` 으로 잘못 보이지 않게).
  const formFilterQuery = useQuery({
    queryKey: workLogFormQueryKeys.filterOptions(),
    queryFn: fetchAllFormFilterOptions,
    enabled: tab === 'logs',
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
  const filterForms = useMemo(
    () => formFilterQuery.data ?? [],
    [formFilterQuery.data],
  )
  const activeQuery = tab === 'logs' ? logsQuery : formsQuery
  const isPending = activeQuery.isPending

  const totalPages = activeQuery.data?.totalPages
  const pageCount = Math.max(1, totalPages ?? page)
  const currentPage = Math.min(page, pageCount)
  const pagination = { page: currentPage, pageCount, onChange: setPage }

  // URL 의 양식이 선택지에 없으면(지워진 양식 등) `전체 양식` 으로 되돌린다.
  // 트리거에는 `전체 양식` 이 보이는데 목록만 그 양식으로 걸러지는 어긋남을 막는다.
  // 선택지는 모든 페이지를 받은 뒤에만(조회 성공) 판단한다.
  const unknownTemplate =
    tab === 'logs' &&
    formFilterQuery.isSuccess &&
    templateId !== null &&
    !filterForms.some((form) => form.id === templateId)

  // URL 보정은 한 번의 갱신으로 모은다. 따로 고치면 나중 갱신이 앞의 수정을 덮어쓴다.
  // - 잘못된 templateId 값 → 지운다(나머지 조건은 그대로).
  // - 없는 양식 → `전체 양식` 으로 되돌리고 첫 페이지로.
  // - 삭제로 마지막 페이지가 비면 → 직전 페이지. 총 페이지 수는 응답을 받은 뒤에만 안다.
  // URL 을 바꾸는 일이라 렌더가 끝난 뒤에 한다(렌더 중 라우터 갱신 금지).
  useEffect(() => {
    const clampPage = totalPages !== undefined && page > pageCount
    if (!invalidTemplateParam && !unknownTemplate && !clampPage) return

    updateParams({
      tab,
      date: isoDate,
      templateId: unknownTemplate ? null : templateId,
      page: unknownTemplate ? 1 : clampPage ? pageCount : page,
    })
    // updateParams 는 렌더마다 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidTemplateParam, unknownTemplate, totalPages, page, pageCount])

  function handleSelectTab(label: string) {
    const nextTab: WorkLogTab = label === formsTabLabel ? 'forms' : 'logs'
    setOpenKebabId(null)
    updateParams({ tab: nextTab, date: isoDate, page: 1, templateId })
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

        {tab === 'logs' && (
          <Filters>
            <RowDateFilter value={date} onChange={setDate} />
            <WorkLogFormFilter
              value={templateId}
              forms={filterForms}
              optionsConfirmed={formFilterQuery.isSuccess}
              onChange={setTemplateId}
            />
          </Filters>
        )}

        <TableArea>
          {tab === 'logs' ? (
            <WorkLogTable
              logs={logs}
              loading={isPending}
              onRowClick={(id) =>
                navigate(`/work-logs/${id}`, {
                  state: { listSearch: location.search },
                })
              }
              onDelete={handleRequestDelete}
              openKebabId={openKebabId}
              onOpenKebabChange={setOpenKebabId}
              pagination={pagination}
              emptyLabel="해당 날짜에 작성된 업무일지가 없습니다."
            />
          ) : (
            <WorkLogFormTable
              forms={forms}
              loading={isPending}
              onRowClick={(id) =>
                navigate(`/work-logs/forms/${id}`, {
                  state: { listSearch: location.search },
                })
              }
              onDelete={handleRequestDelete}
              openKebabId={openKebabId}
              onOpenKebabChange={setOpenKebabId}
              pagination={pagination}
              emptyLabel="등록된 양식이 없습니다."
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

// Figma `조회날짜`(Frame 459)와 `양식 필터`(2432:24334)는 한 줄에 24px 간격으로 놓인다.
const Filters = styled.div`
  display: flex;
  margin-top: 32px;
  align-items: center;
  gap: 24px;
`

// 줄 간격은 Filters 가 맡는다.
const RowDateFilter = styled(DateFilter)`
  margin-top: 0;
`

// DataTable 의 기본 margin-top(20)에 12를 더해 Figma 의 탭바-표 간격 32를 맞춘다.
const TableArea = styled.div`
  margin-top: 12px;
`

// 양식 id 는 양의 안전 정수다. 그 밖의 값은 `전체 양식` 으로 본다.
function readTemplateIdParam(params: URLSearchParams): string | null {
  const value = params.get('templateId')
  if (!value || !/^[1-9]\d*$/.test(value)) return null

  return Number.isSafeInteger(Number(value)) ? value : null
}

// `양식 필터` 선택지는 양식 전체다. 첫 페이지의 총 페이지 수를 보고 나머지를 함께 받는다.
async function fetchAllFormFilterOptions() {
  const first = await getWorkLogForms({
    page: 1,
    size: FORM_FILTER_OPTION_SIZE,
  })
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, index) =>
      getWorkLogForms({ page: index + 2, size: FORM_FILTER_OPTION_SIZE }),
    ),
  )

  return [first, ...rest].flatMap((result) => result.items)
}
