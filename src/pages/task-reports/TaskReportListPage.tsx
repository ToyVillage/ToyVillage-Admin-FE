import { useCallback, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getMockTaskReports,
  taskReportReviewStatusLabels,
  taskReportReviewStatuses,
  TaskReportTable,
  type TaskReportListItem,
  type TaskReportReviewStatus,
} from '@/entities/task-report'
import {
  RejectReasonDialog,
  taskReportReviewToasts,
  useReviewTaskReport,
  type TaskReportReviewAction,
  type TaskReportReviewResult,
} from '@/features/review-task-report'
import { RowActionMenu } from '@/features/row-actions'
import { CategoryTabs, Toast } from '@/shared/ui'

// Figma 표 높이(372 = 헤더 72 + 행 100 × 3) 기준.
const TABLE_PAGE_SIZE = 3

interface ReviewTab {
  label: string
  reviewStatus: TaskReportReviewStatus
  count: number
}

// 상세에서 승인·반려에 성공하면 이동 state 로 결과 토스트를 넘겨받는다.
interface TaskReportListLocationState {
  toast?: TaskReportReviewResult
}

export function TaskReportListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeStatus, setActiveStatus] =
    useState<TaskReportReviewStatus>('PENDING')
  const [page, setPage] = useState(1)
  // 케밥 메뉴는 동시에 하나만 열린다. 열린 행 id 를 목록이 소유한다.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  // 목록에서 처리한 결과 토스트. 상세에서 넘겨받는 토스트와 별개다.
  // 같은 결과가 연달아 나와도 토스트를 새로 띄우도록 매번 id 를 바꾼다.
  const [localToast, setLocalToast] = useState<{
    result: TaskReportReviewResult
    id: number
  } | null>(null)
  const toastIdRef = useRef(0)
  // 행별 `⋮` 버튼. 반려 모달을 닫거나 처리를 마친 뒤 초점을 되돌리는 데 쓴다.
  const menuTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const { review, pending } = useReviewTaskReport()

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
          assigneeName: report.assigneeName,
          reviewStatus: report.reviewStatus,
          priority: report.priority,
          dueDate: report.dueDate,
        })),
    [activeStatus, allReports],
  )

  // 처리로 행이 다른 탭으로 옮겨가 현재 페이지가 비면 마지막 페이지로 당긴다.
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

  const stateToast = (location.state as TaskReportListLocationState | null)
    ?.toast
  const toastKey = localToast?.result ?? stateToast
  const toast = toastKey ? taskReportReviewToasts[toastKey] : undefined

  // 닫을 때 이동 state 를 비워 재방문 시 다시 뜨지 않게 한다.
  const dismissToast = useCallback(() => {
    setLocalToast(null)
    if (stateToast) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, navigate, stateToast])

  const focusMenuTrigger = useCallback((reportId: string) => {
    // 다른 탭으로 옮겨간 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
    requestAnimationFrame(() => menuTriggersRef.current.get(reportId)?.focus())
  }, [])

  function handleSelectTab(selectedLabel: string) {
    const selected = tabs[tabLabels.indexOf(selectedLabel)]
    if (!selected) return

    // 탭이 바뀌면 첫 페이지로 되돌린다.
    setActiveStatus(selected.reviewStatus)
    setPage(1)
  }

  function handleReview(
    reportId: string,
    action: TaskReportReviewAction,
    rejectReason?: string,
  ) {
    const finish = (result: TaskReportReviewResult) => {
      // 이 요청이 연 모달만 닫는다.
      setRejectTargetId((current) => (current === reportId ? null : current))
      toastIdRef.current += 1
      setLocalToast({ result, id: toastIdRef.current })
      focusMenuTrigger(reportId)
    }

    review(
      { id: reportId, action, rejectReason },
      {
        onSuccess: () => finish(`${action}-success`),
        onError: () => finish(`${action}-error`),
      },
    )
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
          renderRowAction={(report) => (
            <RowActionMenu
              triggerLabel={`${report.assigneeName} 업무보고 메뉴 열기`}
              // 승인·반려는 한 번에 하나씩 처리한다. 처리 중에는 다른 행의 메뉴도 열지 않는다.
              open={!pending && openMenuId === report.id}
              onOpenChange={(open) =>
                setOpenMenuId(open && !pending ? report.id : null)
              }
              onTriggerRef={(node) => {
                if (node) menuTriggersRef.current.set(report.id, node)
                else menuTriggersRef.current.delete(report.id)
              }}
              items={[
                {
                  key: 'approve',
                  label: '승인하기',
                  onSelect: () => handleReview(report.id, 'approve'),
                },
                {
                  key: 'reject',
                  label: '반려하기',
                  onSelect: () => setRejectTargetId(report.id),
                },
              ]}
            />
          )}
        />
      </Content>

      {rejectTargetId && (
        <RejectReasonDialog
          pending={pending}
          onCancel={() => {
            const targetId = rejectTargetId
            setRejectTargetId(null)
            focusMenuTrigger(targetId)
          }}
          onConfirm={(reason) => handleReview(rejectTargetId, 'reject', reason)}
        />
      )}

      {toast && (
        <Toast
          key={localToast?.id ?? 'state'}
          variant={toast.variant}
          message={toast.message}
          onDismiss={dismissToast}
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
