import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getTaskReports,
  taskReportReviewStatusLabels,
  taskReportReviewStatuses,
  TaskReportTable,
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
import { readPageParam, useListSearchParams } from '@/shared/lib'

// 한 페이지 10행(2026-09-13 개발자 결정). Figma 표 높이(행 100 × 3) 기준 3행을 대체한다.
const TABLE_PAGE_SIZE = 10

interface ReviewTab {
  label: string
  reviewStatus: TaskReportReviewStatus
  count: number
}

// URL 에 남기지 않을 기본값(첫 탭·첫 페이지).
const listParamDefaults = { status: 'PENDING', page: '1' } as const

// 상세에서 승인·반려에 성공하면 이동 state 로 결과 토스트를 넘겨받는다.
interface TaskReportListLocationState {
  toast?: TaskReportReviewResult
}

export function TaskReportListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // 조회 조건(탭·페이지)은 URL 이 소유한다. 상세에 다녀와도 그대로 남는다.
  const { values, update } = useListSearchParams(listParamDefaults)
  const activeStatus = taskReportReviewStatuses.includes(
    values.status as TaskReportReviewStatus,
  )
    ? (values.status as TaskReportReviewStatus)
    : 'PENDING'
  const page = readPageParam(new URLSearchParams({ page: values.page }))

  function setPage(next: number) {
    update({ page: String(next) })
  }
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

  const { data, isPending, isError, isPlaceholderData } = useQuery({
    queryKey: [
      'task-reports',
      'list',
      { page, size: TABLE_PAGE_SIZE, status: activeStatus },
    ],
    queryFn: () =>
      getTaskReports({ page, size: TABLE_PAGE_SIZE, status: activeStatus }),
    // 페이지·탭을 바꾸는 동안 표와 탭이 로딩 화면으로 사라지지 않게 직전 결과를 둔다.
    placeholderData: (previousData) => previousData,
  })

  // 탭 라벨 `{상태명} {건수}` 의 건수는 서버 집계를 그대로 쓴다. status 필터와 무관하다.
  const tabs = useMemo<ReviewTab[]>(
    () =>
      taskReportReviewStatuses.map((reviewStatus) => ({
        reviewStatus,
        label: taskReportReviewStatusLabels[reviewStatus],
        count: data?.counts[reviewStatus] ?? 0,
      })),
    [data],
  )

  const reports = data?.items ?? []
  // 페이지 수는 서버가 준 총 페이지 수를 그대로 쓴다.
  const pageCount = Math.max(1, data?.totalPageSize ?? 1)

  // 처리로 행이 다른 탭으로 옮겨가 마지막 페이지가 사라지면 범위 밖 페이지에 고착되지 않게 당긴다.
  // URL 을 바꾸는 일이라 렌더가 끝난 뒤에 한다(렌더 중 라우터 갱신 금지).
  useEffect(() => {
    if (data && page > pageCount) setPage(pageCount)
    // setPage 는 렌더마다 새로 만들어지므로 의존성에 넣지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page, pageCount])

  // 조회 전에는 건수를 모르므로 `0` 을 보이지 않고 라벨만 둔다.
  const tabLabels = tabs.map(({ label, count }) =>
    isPending ? label : `${label} ${count}`,
  )
  const activeLabel =
    tabLabels[tabs.findIndex((tab) => tab.reviewStatus === activeStatus)]

  const stateToast = (location.state as TaskReportListLocationState | null)
    ?.toast
  const toastKey = localToast?.result ?? stateToast
  const toast = toastKey ? taskReportReviewToasts[toastKey] : undefined

  // 닫을 때 이동 state 를 비워 재방문 시 다시 뜨지 않게 한다.
  const dismissToast = useCallback(() => {
    setLocalToast(null)
    // 조회 조건(쿼리)은 그대로 두고 토스트 state 만 비운다.
    if (stateToast) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      })
    }
  }, [location.pathname, location.search, navigate, stateToast])

  const focusMenuTrigger = useCallback((reportId: string) => {
    // 다른 탭으로 옮겨간 행의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
    requestAnimationFrame(() => menuTriggersRef.current.get(reportId)?.focus())
  }, [])

  function handleSelectTab(selectedLabel: string) {
    const selected = tabs[tabLabels.indexOf(selectedLabel)]
    if (!selected) return

    // 탭이 바뀌면 첫 페이지로 되돌린다.
    update({ status: selected.reviewStatus, page: '1' })
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
          loading={isPending}
          reports={reports}
          onRowClick={(id) =>
            // 상세의 `returnTo` 규약에 맞춘다 — 조회 조건까지 담아 그 자리로 돌아온다.
            navigate(`/task-reports/${id}`, {
              state: { returnTo: `${location.pathname}${location.search}` },
            })
          }
          pagination={{ page, pageCount, onChange: setPage }}
          emptyLabel="등록된 업무보고가 없습니다."
          renderRowAction={(report) => (
            <RowActionMenu
              triggerLabel={`${report.assigneeName} 업무보고 메뉴 열기`}
              // 승인·반려는 한 번에 하나씩 처리한다. 처리 중에는 다른 행의 메뉴도 열지 않는다.
              // 탭·페이지를 바꾸는 동안 남아 있는 직전 행은 다른 상태의 보고라 메뉴를 열지 않는다.
              open={!pending && !isPlaceholderData && openMenuId === report.id}
              onOpenChange={(open) =>
                setOpenMenuId(
                  open && !pending && !isPlaceholderData ? report.id : null,
                )
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
