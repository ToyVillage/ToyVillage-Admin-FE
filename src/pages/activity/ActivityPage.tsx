import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  activityQueryKeys,
  getFloorFiveFeedActivities,
  getFloorFourFeedActivities,
  getObservationActivities,
  getWorkLogActivities,
  type ActivityFloor,
} from '@/entities/activity'
import { readIsoDateParam } from '@/shared/lib'
import {
  CategoryTabs,
  DataTable,
  DayNavigator,
  PageHeader,
  type DataTableColumn,
  type DataTableRow,
} from '@/shared/ui'
import { ActivityTypeTabs, type ActivityTab } from './ui/ActivityTypeTabs'
import {
  floorFiveColumns,
  floorFourColumns,
  observationColumns,
  toFloorFiveRows,
  toFloorFourRows,
  toObservationRows,
  toWorkLogRows,
  workLogColumns,
} from './ui/activityColumns'

interface ActivityParams {
  tab: ActivityTab
  date: string
  floor: ActivityFloor
}

const floorTabs = ['4층', '5층']

const emptyHint = {
  feed: '이 날짜에 올라온 먹이 급여 기록이 없어요',
  observation: '이 날짜에 올라온 관찰일지가 없어요',
  'work-log': '이 날짜에 올라온 업무일지가 없어요',
} as const

// 조회 실패 문구. 디자인에 없어 빈 상태 자리에 같은 꼴로 보여준다(업무일지는 아직 mock 이라 없다).
const failedHint = {
  feed: '먹이 급여 기록을 불러오지 못했어요. 다시 시도해 주세요.',
  observation: '관찰일지를 불러오지 못했어요. 다시 시도해 주세요.',
} as const

// Figma `전체 활동 · 목록`(3034:25175). 탭·날짜·층은 URL 이 소유해 새로고침·뒤로가기에서 그대로 남는다.
export function ActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = readTabParam(searchParams.get('tab'))
  const date = readIsoDateParam(searchParams)
  const floor: ActivityFloor = searchParams.get('floor') === '5' ? '5' : '4'

  const floorFourQuery = useQuery({
    queryKey: activityQueryKeys.feed(date, '4'),
    queryFn: () => getFloorFourFeedActivities(date),
    enabled: tab === 'feed' && floor === '4',
    // 직원이 계속 기록을 올리므로 전역 staleTime(60초) 캐시를 쓰지 않는다(`/feeds` 와 같다).
    staleTime: 0,
  })
  const floorFiveQuery = useQuery({
    queryKey: activityQueryKeys.feed(date, '5'),
    queryFn: () => getFloorFiveFeedActivities(date),
    enabled: tab === 'feed' && floor === '5',
    staleTime: 0,
  })
  const observationQuery = useQuery({
    queryKey: activityQueryKeys.observation(date),
    queryFn: () => getObservationActivities(date),
    enabled: tab === 'observation',
    staleTime: 0,
  })
  const workLogQuery = useQuery({
    queryKey: activityQueryKeys.workLog(date),
    queryFn: () => getWorkLogActivities(date),
    enabled: tab === 'work-log',
  })

  function updateParams(next: Partial<ActivityParams>) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        if (next.tab) params.set('tab', next.tab)
        if (next.date) params.set('date', next.date)
        if (next.floor) params.set('floor', next.floor)
        return params
      },
      { replace: true },
    )
  }

  return (
    <Page>
      <Content>
        <PageHeader
          title="전체 활동"
          subtitle="직원이 올린 기록을 날짜별로 한눈에 확인해요"
        />

        <Toolbar>
          <ActivityTypeTabs
            value={tab}
            onChange={(nextTab) => updateParams({ tab: nextTab })}
          />
          <DayNavigator
            value={date}
            onChange={(nextDate) => updateParams({ date: nextDate })}
          />
        </Toolbar>

        {tab === 'feed' && (
          <>
            <CategoryTabs
              categories={floorTabs}
              active={`${floor}층`}
              onSelect={(label) =>
                updateParams({ floor: label === '5층' ? '5' : '4' })
              }
            />
            <BlockArea>
              {floor === '4' ? (
                <ActivityTable
                  columns={floorFourColumns}
                  rows={
                    floorFourQuery.data && toFloorFourRows(floorFourQuery.data)
                  }
                  failed={floorFourQuery.isError}
                  failedTitle={failedHint.feed}
                  emptyTitle={emptyHint.feed}
                />
              ) : (
                <ActivityTable
                  columns={floorFiveColumns}
                  rows={
                    floorFiveQuery.data && toFloorFiveRows(floorFiveQuery.data)
                  }
                  failed={floorFiveQuery.isError}
                  failedTitle={failedHint.feed}
                  emptyTitle={emptyHint.feed}
                />
              )}
            </BlockArea>
          </>
        )}

        {tab === 'observation' && (
          <LogArea>
            <ActivityTable
              columns={observationColumns}
              rows={
                observationQuery.data &&
                toObservationRows(observationQuery.data)
              }
              failed={observationQuery.isError}
              failedTitle={failedHint.observation}
              emptyTitle={emptyHint.observation}
            />
          </LogArea>
        )}

        {tab === 'work-log' && (
          <LogArea>
            <ActivityTable
              columns={workLogColumns}
              rows={workLogQuery.data && toWorkLogRows(workLogQuery.data)}
              emptyTitle={emptyHint['work-log']}
            />
          </LogArea>
        )}
      </Content>
    </Page>
  )
}

interface ActivityTableProps {
  columns: DataTableColumn[]
  /** 아직 받지 못했으면 undefined — 값 자리를 막대로 채운다. */
  rows: DataTableRow[] | undefined
  /** 조회 실패. 빈 표로 숨기지 않고 행 자리에 `failedTitle` 을 보여준다. */
  failed?: boolean
  failedTitle?: string
  emptyTitle: string
}

// 디자인 시스템 `list`(1:11043) — 먹이 급여·업무일지 목록과 같은 진한 머리 행·회색 구분선 표.
const tableAppearance = {
  headerBackground: 'tableHeaderStrong',
  headerColor: 'textStrong',
  dividerColor: 'textGuide',
  offsetTop: 0,
} as const

// 행은 눌러도 이동하지 않는다.
function ActivityTable({
  columns,
  rows,
  failed = false,
  failedTitle,
  emptyTitle,
}: ActivityTableProps) {
  if (failed) {
    return (
      <DataTable
        columns={columns}
        rows={[]}
        headerTestId="activity-table-header"
        appearance={tableAppearance}
        emptyMinHeight={420}
        emptyLabel={<EmptyTitle role="alert">{failedTitle}</EmptyTitle>}
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      rows={rows ?? []}
      loading={rows === undefined}
      rowTestId="activity-row"
      headerTestId="activity-table-header"
      appearance={tableAppearance}
      emptyMinHeight={420}
      emptyLabel={
        <Empty>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyHint>다른 날짜를 선택해 보세요</EmptyHint>
        </Empty>
      }
    />
  )
}

function readTabParam(value: string | null): ActivityTab {
  return value === 'observation' || value === 'work-log' ? value : 'feed'
}

const Page = styled.main`
  min-height: 100vh;
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: calc(124px - 32px);
`

// Figma: 제목 블록 아래 44px 에 툴바(유형 탭 · 날짜 선택).
const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 44px;
`

// Figma: 층 탭 아래 39px 에 표. 표 자체 위 여백(offsetTop)은 0 으로 두고 여기서만 띄운다.
const BlockArea = styled.section`
  margin-top: 39px;
`

// Figma: 툴바 아래 37px 에 표.
const LogArea = styled.section`
  margin-top: 37px;
`

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

const EmptyTitle = styled.span`
  font-size: 24px;
`

const EmptyHint = styled.span`
  font-size: 20px;
`
