import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { findTaskAssignee } from '@/entities/task'
import {
  getMockTaskReports,
  taskReportReviewStatusLabels,
  taskReportReviewStatuses,
  TaskReportTable,
  type TaskReportListItem,
  type TaskReportReviewStatus,
} from '@/entities/task-report'
import { CategoryTabs } from '@/shared/ui'

// Figma 표 높이(372 = 헤더 72 + 행 100 × 3) 기준.
const TABLE_PAGE_SIZE = 3

interface ReviewTab {
  label: string
  reviewStatus: TaskReportReviewStatus
  count: number
}

export function TaskReportListPage() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] =
    useState<TaskReportReviewStatus>('PENDING')
  const [page, setPage] = useState(1)

  const {
    data: queryReports,
    isPending,
    isError,
  } = useQuery({ queryKey: ['task-reports'], queryFn: getMockTaskReports })
  const allReports = useMemo(() => queryReports ?? [], [queryReports])

  // 탭 라벨의 건수는 조회 결과에서 파생한다(spec: `{상태명} {건수}`).
  const tabs = useMemo<ReviewTab[]>(
    () =>
      taskReportReviewStatuses.map((reviewStatus) => ({
        reviewStatus,
        label: taskReportReviewStatusLabels[reviewStatus],
        count: allReports.filter(
          (report) => report.reviewStatus === reviewStatus,
        ).length,
      })),
    [allReports],
  )

  const items = useMemo<TaskReportListItem[]>(
    () =>
      allReports
        .filter((report) => report.reviewStatus === activeStatus)
        .map((report) => ({
          id: report.id,
          assigneeName: findTaskAssignee(report.assigneeId)?.name ?? '미지정',
          title: report.title,
          taskStatus: report.taskStatus,
          priority: report.priority,
          dueDate: report.dueDate,
          visibility: report.visibility,
        })),
    [activeStatus, allReports],
  )

  const pageCount = Math.max(1, Math.ceil(items.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)

  const reports = useMemo(
    () =>
      items.slice(
        (currentPage - 1) * TABLE_PAGE_SIZE,
        currentPage * TABLE_PAGE_SIZE,
      ),
    [items, currentPage],
  )

  const tabLabels = tabs.map(({ label, count }) => `${label} ${count}`)
  const activeLabel =
    tabLabels[tabs.findIndex((tab) => tab.reviewStatus === activeStatus)]

  function handleSelectTab(selectedLabel: string) {
    const selected = tabs[tabLabels.indexOf(selectedLabel)]
    if (!selected) return

    // 탭이 바뀌면 첫 페이지로 되돌린다.
    setActiveStatus(selected.reviewStatus)
    setPage(1)
  }

  if (isPending) {
    return (
      <StatePage>
        <StateCard role="status">업무보고를 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (isError) {
    return (
      <StatePage>
        <StateCard role="alert">
          업무보고를 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <Header>
          <Title>업무보고</Title>
          <Subtitle>토이빌리지 업무 보고 관리</Subtitle>
        </Header>

        <CategoryTabs
          categories={tabLabels}
          active={activeLabel}
          onSelect={handleSelectTab}
        />

        <TaskReportTable
          reports={reports}
          onRowClick={(id) => navigate(`/task-reports/${id}`)}
          pagination={{ page: currentPage, pageCount, onChange: setPage }}
          emptyLabel="등록된 업무보고가 없습니다."
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
