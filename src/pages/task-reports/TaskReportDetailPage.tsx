import { useCallback, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getMockTaskReport,
  TaskReportContentCard,
  TaskReportMetaRow,
} from '@/entities/task-report'
import {
  TaskReportReviewActions,
  taskReportReviewToasts,
  type TaskReportReviewResult,
} from '@/features/review-task-report'
import { BackLink, Toast } from '@/shared/ui'

// Figma yot 1:7503 `report management`.
export function TaskReportDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  // 상세에 머무는 결과는 실패뿐이다. 성공하면 목록으로 이동해 거기서 토스트를 보인다.
  // 같은 실패가 연달아 나와도 토스트를 새로 띄우도록 매번 id 를 바꾼다.
  const [errorToast, setErrorToast] = useState<{
    result: TaskReportReviewResult
    id: number
  } | null>(null)
  const toastIdRef = useRef(0)
  const dismissToast = useCallback(() => setErrorToast(null), [])

  const {
    data: report,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['task-reports', id],
    queryFn: () => getMockTaskReport(id),
    enabled: Boolean(id),
  })

  if (isPending) {
    return (
      <StatePage>
        <StateCard role="status">업무보고를 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (isError || !report) {
    return (
      <StatePage>
        <StateCard role="alert">
          업무보고를 찾을 수 없습니다.
          <BackToList to="/task-reports">목록으로 돌아가기</BackToList>
        </StateCard>
      </StatePage>
    )
  }

  const toast = errorToast
    ? taskReportReviewToasts[errorToast.result]
    : undefined

  return (
    <Page>
      <Content>
        <DetailBackLink to="/task-reports" />

        <Body>
          <TaskReportMetaRow
            priority={report.priority}
            reviewStatus={report.reviewStatus}
            assigneeName={report.assigneeName}
            dueDate={report.dueDate}
          />

          <TaskReportContentCard
            title={report.title}
            content={report.content}
            attachments={report.attachments ?? []}
          />
        </Body>

        <TaskReportReviewActions
          reportId={report.id}
          onSuccess={(action) =>
            navigate('/task-reports', {
              state: { toast: `${action}-success` },
            })
          }
          onError={(action) => {
            toastIdRef.current += 1
            setErrorToast({ result: `${action}-error`, id: toastIdRef.current })
          }}
        />
      </Content>

      {errorToast && toast && (
        <Toast
          key={errorToast.id}
          variant={toast.variant}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 32px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  margin: 0 auto;
  padding-top: 75px;
`

// 링크 영역이 줄 전체로 늘어나지 않게 글자 폭에 맞춘다.
const DetailBackLink = styled(BackLink)`
  align-self: flex-start;
`

// 뒤로가기(y75 h36) → 요약행(y164) → 카드(y236, 요약행 아래 32) → 버튼(y876, 카드 아래 68).
const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin: 53px 0 68px;
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
  display: flex;
  width: min(100%, 560px);
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`

const BackToList = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 20px;
  font-weight: 600;
`
