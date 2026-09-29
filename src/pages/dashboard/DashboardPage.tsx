import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { getCloseSchedules } from '@/entities/close-schedule'
import { getTaskReports, TaskReportReviewBadge } from '@/entities/task-report'
import { getWorkLogs } from '@/entities/work-log'
import {
  closeSchedulesInMonth,
  type DashboardKpi,
  dashboardIcons,
  dashboardQueryKeys,
  DashboardKpiCard,
  DashboardListRows,
  DashboardSectionCard,
  DashboardWeekChip,
  formatDateTime,
  formatRecentDate,
  getDashboardCounts,
  getDashboardFeeds,
  getDashboardObservations,
  getDashboardTaskStatusCounts,
  HolidayList,
  HolidayMiniCalendar,
  TaskStatusDonut,
  toIsoDay,
} from '@/features/dashboard'
import { SkeletonStatus } from '@/shared/ui'

const LIST_LIMIT = 3
// 대시보드 목록 API·업무보고·업무일지 목록은 page 가 1부터다.
const FIRST_PAGE = 1
// 승인 시나리오가 어느 API 가 실패하든 이 문구를 찾는다. 실패한 섹션 자리에만 뜬다.
const LOAD_ERROR_MESSAGE = '대시보드를 불러오지 못했습니다.'

const KPI_CARDS = [
  {
    key: 'feeds',
    label: '먹이 급여 기록',
    icon: dashboardIcons.kpi.feed,
    to: '/feeds',
  },
  {
    key: 'individuals',
    label: '관찰 및 특이사항',
    icon: dashboardIcons.kpi.animal,
    to: '/species',
  },
  {
    key: 'taskReports',
    label: '업무보고',
    icon: dashboardIcons.kpi.report,
    to: '/task-reports',
  },
  {
    key: 'workLogs',
    label: '작성된 일지',
    icon: dashboardIcons.kpi.workLog,
    to: '/work-logs',
  },
] as const satisfies readonly {
  key: keyof DashboardKpi
  label: string
  icon: string
  to: string
}[]

// Figma `dashboard`(1385:15048).
export function DashboardPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const today = toIsoDay(now)

  const countsQuery = useQuery({
    queryKey: dashboardQueryKeys.counts(),
    queryFn: getDashboardCounts,
  })
  const taskStatusQuery = useQuery({
    queryKey: dashboardQueryKeys.taskStatus(),
    queryFn: getDashboardTaskStatusCounts,
  })
  const feedsQuery = useQuery({
    queryKey: dashboardQueryKeys.feeds(FIRST_PAGE, LIST_LIMIT),
    queryFn: () => getDashboardFeeds({ page: FIRST_PAGE, size: LIST_LIMIT }),
  })
  const observationsQuery = useQuery({
    queryKey: dashboardQueryKeys.observations(FIRST_PAGE, LIST_LIMIT),
    queryFn: () =>
      getDashboardObservations({ page: FIRST_PAGE, size: LIST_LIMIT }),
  })
  const closeSchedulesQuery = useQuery({
    queryKey: dashboardQueryKeys.closeSchedules(),
    queryFn: getCloseSchedules,
  })
  const taskReportsQuery = useQuery({
    queryKey: dashboardQueryKeys.taskReports(FIRST_PAGE, LIST_LIMIT),
    queryFn: () => getTaskReports({ page: FIRST_PAGE, size: LIST_LIMIT }),
  })
  const workLogsQuery = useQuery({
    queryKey: dashboardQueryKeys.workLogs(today, FIRST_PAGE, LIST_LIMIT),
    queryFn: () =>
      getWorkLogs({ date: today, page: FIRST_PAGE, size: LIST_LIMIT }),
  })

  // 섹션마다 자기 조회만 기다린다. 느린 API 하나가 이미 도착한 카드까지 스켈레톤으로 묶지 않는다.
  const kpi = countsQuery.data
  // 스크린리더에는 섹션별 막대 대신 영역 전체의 "불러오는 중" 하나만 읽힌다.
  const loading = [
    countsQuery,
    taskStatusQuery,
    feedsQuery,
    observationsQuery,
    closeSchedulesQuery,
    taskReportsQuery,
    workLogsQuery,
  ].some((query) => query.isPending)

  return (
    <Page>
      <Content>
        <Header>
          <Title>대시보드</Title>
          <ChipSlot>
            <DashboardWeekChip today={now} />
          </ChipSlot>
        </Header>

        <SkeletonStatus busy={loading}>
          {countsQuery.isError ? (
            <StateMessage role="alert">{LOAD_ERROR_MESSAGE}</StateMessage>
          ) : (
            <KpiGrid>
              {KPI_CARDS.map(({ key, label, icon, to }) => (
                <DashboardKpiCard
                  key={key}
                  label={label}
                  value={kpi?.[key] ?? 0}
                  icon={icon}
                  to={to}
                  loading={!kpi}
                />
              ))}
            </KpiGrid>
          )}

          <WideRow>
            <TallCard
              title="휴무일 관리"
              icon={dashboardIcons.title.holiday}
              to="/notices/guide"
            >
              <SectionBody
                data={closeSchedulesQuery.data}
                isError={closeSchedulesQuery.isError}
                skeleton={
                  <HolidayBody>
                    <HolidayMiniCalendar
                      year={year}
                      month={month}
                      schedules={[]}
                    />
                    <HolidayList schedules={[]} loading />
                  </HolidayBody>
                }
              >
                {(closeSchedules) => (
                  <HolidayBody>
                    <HolidayMiniCalendar
                      year={year}
                      month={month}
                      schedules={closeSchedules}
                    />
                    <HolidayList
                      schedules={closeSchedulesInMonth(
                        closeSchedules,
                        year,
                        month,
                      ).slice(0, LIST_LIMIT)}
                      getScheduleHref={(schedule) =>
                        `/notices/guide/${schedule.id}`
                      }
                    />
                  </HolidayBody>
                )}
              </SectionBody>
            </TallCard>
            <TallCard
              title="전체 업무"
              icon={dashboardIcons.title.task}
              to="/tasks"
            >
              <SectionBody
                data={taskStatusQuery.data}
                isError={taskStatusQuery.isError}
                skeleton={
                  <TaskStatusDonut
                    counts={{ COMPLETED: 0, IN_PROGRESS: 0, EXPIRED: 0 }}
                    loading
                  />
                }
              >
                {(taskStatusCounts) => (
                  <TaskStatusDonut counts={taskStatusCounts} />
                )}
              </SectionBody>
            </TallCard>
          </WideRow>

          <HalfRow>
            <ListCard
              title="먹이 급여 관리"
              icon={dashboardIcons.title.feed}
              to="/feeds"
            >
              <SectionBody
                data={feedsQuery.data}
                isError={feedsQuery.isError}
                skeleton={listSkeleton}
              >
                {(feeds) => (
                  <DashboardListRows
                    emptyText="최근 먹이 급여 기록이 없습니다."
                    rows={feeds.slice(0, LIST_LIMIT).map((feed) => ({
                      key: feed.id,
                      primary: `${feed.species} · ${feed.animalName}`,
                      secondary: formatDateTime(feed.fedAt),
                      to: `/feeds/${feed.id}`,
                    }))}
                  />
                )}
              </SectionBody>
            </ListCard>
            <ListCard
              title="관찰 및 특이사항"
              icon={dashboardIcons.title.animal}
              to="/species"
            >
              <SectionBody
                data={observationsQuery.data}
                isError={observationsQuery.isError}
                skeleton={listSkeleton}
              >
                {(observations) => (
                  <DashboardListRows
                    emptyText="최근 관찰 기록이 없습니다."
                    rows={observations
                      .slice(0, LIST_LIMIT)
                      .map((observation) => ({
                        key: observation.id,
                        primary: observation.content,
                        secondary: formatRecentDate(
                          observation.recordedAt,
                          now,
                        ),
                        // 응답에 종 ID 가 없어 종 ID 없는 경로에서 개체를 조회한 뒤 관찰 상세로 옮긴다.
                        to: `/individuals/${observation.individualId}/observations/${observation.id}`,
                      }))}
                  />
                )}
              </SectionBody>
            </ListCard>
            <ListCard
              title="업무보고"
              icon={dashboardIcons.title.report}
              to="/task-reports"
            >
              <SectionBody
                data={taskReportsQuery.data?.items}
                isError={taskReportsQuery.isError}
                skeleton={listSkeleton}
              >
                {(taskReports) => (
                  <DashboardListRows
                    emptyText="최근 업무보고가 없습니다."
                    rows={taskReports.slice(0, LIST_LIMIT).map((report) => ({
                      key: report.id,
                      to: `/task-reports/${report.id}`,
                      primary: report.title,
                      secondary: (
                        <TaskReportReviewBadge status={report.reviewStatus} />
                      ),
                    }))}
                  />
                )}
              </SectionBody>
            </ListCard>
            <ListCard
              title="업무일지관리"
              icon={dashboardIcons.title.workLog}
              to="/work-logs"
            >
              <SectionBody
                data={workLogsQuery.data?.items}
                isError={workLogsQuery.isError}
                skeleton={listSkeleton}
              >
                {(workLogs) => (
                  <DashboardListRows
                    emptyText="최근 업무일지가 없습니다."
                    rows={workLogs.slice(0, LIST_LIMIT).map((workLog) => ({
                      key: workLog.id,
                      to: `/work-logs/${workLog.id}`,
                      primary: workLog.formName,
                      secondary: workLog.authorName,
                    }))}
                  />
                )}
              </SectionBody>
            </ListCard>
          </HalfRow>
        </SkeletonStatus>
      </Content>
    </Page>
  )
}

const listSkeleton = <DashboardListRows rows={[]} emptyText="" loading />

interface SectionBodyProps<T> {
  data: T | undefined
  isError: boolean
  skeleton: ReactNode
  children: (data: T) => ReactNode
}

// 카드 본문 하나의 조회 상태. 제목·아이콘·`자세히 보기`는 카드가 그리고, 본문만 막대·오류·데이터로 바뀐다.
function SectionBody<T>({
  data,
  isError,
  skeleton,
  children,
}: SectionBodyProps<T>) {
  if (isError) {
    return <SectionError role="alert">{LOAD_ERROR_MESSAGE}</SectionError>
  }
  if (data === undefined) {
    return <SectionSkeleton>{skeleton}</SectionSkeleton>
  }
  return children(data)
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
  padding: calc(96px - 32px) 0 48px;
`

const Header = styled.header`
  display: flex;
  min-height: 120px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 980px) {
    min-height: 0;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
`

// Figma chip 은 제목보다 12.5px 아래(@y108.5)에서 시작해 제목과 세로 가운데가 맞는다.
const ChipSlot = styled.div`
  margin-top: 12px;

  @media (max-width: 980px) {
    margin-top: 0;
  }
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 60px;
  font-weight: 600;
  line-height: normal;

  @media (max-width: 980px) {
    font-size: 40px;
  }
`

const StateMessage = styled.p`
  margin: 0;
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`

const KpiGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const WideRow = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 860fr) minmax(0, 440fr);
  margin-top: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const HalfRow = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const TallCard = styled(DashboardSectionCard)`
  min-height: 420px;
`

const ListCard = styled(DashboardSectionCard)`
  min-height: 272px;
`

const HolidayBody = styled.div`
  display: flex;
  flex: 1;
  gap: 40px;
  padding-top: 20px;

  @media (max-width: 760px) {
    flex-direction: column;
    gap: 0;
  }
`

// 본문 막대 묶음이 카드 본문(flex column)을 그대로 채우게 한다.
const SectionSkeleton = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
`

const SectionError = styled.p`
  margin: 0;
  padding: 20px 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
`
