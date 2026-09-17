import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { TaskReportReviewBadge } from '@/entities/task-report'
import {
  closeSchedulesInMonth,
  dashboardIcons,
  dashboardQueryKeys,
  DashboardKpiCard,
  DashboardListRows,
  DashboardSectionCard,
  DashboardWeekChip,
  formatDateTime,
  formatRecentDate,
  getDashboardSummary,
  HolidayList,
  HolidayMiniCalendar,
  TaskStatusDonut,
} from '@/features/dashboard'

const LIST_LIMIT = 3

// Figma `dashboard`(1385:15048).
export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: dashboardQueryKeys.summary(),
    queryFn: getDashboardSummary,
  })

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const summary = summaryQuery.data

  return (
    <Page>
      <Content>
        <Header>
          <Title>대시보드</Title>
          <ChipSlot>
            <DashboardWeekChip today={now} />
          </ChipSlot>
        </Header>

        {summaryQuery.isPending ? (
          <StateMessage role="status">
            대시보드를 불러오는 중입니다.
          </StateMessage>
        ) : summaryQuery.isError || !summary ? (
          <StateMessage role="alert">
            대시보드를 불러오지 못했습니다.
          </StateMessage>
        ) : (
          <>
            <KpiGrid>
              <DashboardKpiCard
                label="먹이 급여 기록"
                value={summary.kpi.feeds}
                icon={dashboardIcons.kpi.feed}
                to="/feeds"
              />
              <DashboardKpiCard
                label="개체 관리"
                value={summary.kpi.individuals}
                icon={dashboardIcons.kpi.animal}
                to="/species"
              />
              <DashboardKpiCard
                label="업무보고"
                value={summary.kpi.taskReports}
                icon={dashboardIcons.kpi.report}
                to="/task-reports"
              />
              <DashboardKpiCard
                label="작성된 일지"
                value={summary.kpi.workLogs}
                icon={dashboardIcons.kpi.workLog}
                to="/work-logs"
              />
            </KpiGrid>

            <WideRow>
              <TallCard
                title="휴관일 관리"
                icon={dashboardIcons.title.holiday}
                to="/notices/guide"
              >
                <HolidayBody>
                  <HolidayMiniCalendar
                    year={year}
                    month={month}
                    schedules={summary.closeSchedules}
                  />
                  <HolidayList
                    schedules={closeSchedulesInMonth(
                      summary.closeSchedules,
                      year,
                      month,
                    ).slice(0, LIST_LIMIT)}
                  />
                </HolidayBody>
              </TallCard>
              <TallCard
                title="전체 업무"
                icon={dashboardIcons.title.task}
                to="/tasks"
              >
                <TaskStatusDonut counts={summary.taskStatusCounts} />
              </TallCard>
            </WideRow>

            <HalfRow>
              <ListCard
                title="먹이 급여 관리"
                icon={dashboardIcons.title.feed}
                to="/feeds"
              >
                <DashboardListRows
                  emptyText="최근 먹이 급여 기록이 없습니다."
                  rows={summary.feeds.slice(0, LIST_LIMIT).map((feed) => ({
                    key: feed.id,
                    primary: `${feed.species} · ${feed.animalName}`,
                    secondary: formatDateTime(feed.fedAt),
                  }))}
                />
              </ListCard>
              <ListCard
                title="개체관리"
                icon={dashboardIcons.title.animal}
                to="/species"
              >
                <DashboardListRows
                  emptyText="최근 관찰 기록이 없습니다."
                  rows={summary.observations
                    .slice(0, LIST_LIMIT)
                    .map((observation) => ({
                      key: observation.id,
                      primary: observation.content,
                      secondary: formatRecentDate(observation.recordedAt, now),
                    }))}
                />
              </ListCard>
              <ListCard
                title="업무보고"
                icon={dashboardIcons.title.report}
                to="/task-reports"
              >
                <DashboardListRows
                  emptyText="최근 업무보고가 없습니다."
                  rows={summary.taskReports
                    .slice(0, LIST_LIMIT)
                    .map((report) => ({
                      key: report.id,
                      primary: report.title,
                      secondary: (
                        <TaskReportReviewBadge status={report.reviewStatus} />
                      ),
                    }))}
                />
              </ListCard>
              <ListCard
                title="업무일지관리"
                icon={dashboardIcons.title.workLog}
                to="/work-logs"
              >
                <DashboardListRows
                  emptyText="최근 업무일지가 없습니다."
                  rows={summary.workLogs
                    .slice(0, LIST_LIMIT)
                    .map((workLog) => ({
                      key: workLog.id,
                      primary: workLog.formName,
                      secondary: workLog.authorName,
                    }))}
                />
              </ListCard>
            </HalfRow>
          </>
        )}
      </Content>
    </Page>
  )
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
