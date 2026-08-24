import { useCallback, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { getMockTask } from '@/entities/task'
import { getMockTaskReportByTaskId } from '@/entities/task-report'
import { TaskForm } from '@/features/create-task'
import { LeaveConfirmationDialog } from '@/shared/ui'
import { TaskBackLink } from './ui/TaskBackLink'

export function TaskDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const allowNavigationRef = useRef(false)
  const [isDirty, setIsDirty] = useState(false)
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        !allowNavigationRef.current &&
        isDirty &&
        currentLocation.pathname !== nextLocation.pathname,
      [isDirty],
    ),
  )

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!isDirty || allowNavigationRef.current) return
        event.preventDefault()
        event.returnValue = ''
      },
      [isDirty],
    ),
  )

  const {
    data: task,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => getMockTask(id),
    enabled: Boolean(id),
  })

  // 이 업무에 올라온 업무보고. 없으면 이동할 상세가 없어 버튼을 비활성으로 둔다.
  const { data: report } = useQuery({
    queryKey: ['task-reports', 'by-task', id],
    queryFn: () => getMockTaskReportByTaskId(id),
    enabled: Boolean(id),
  })

  const handleCompleted = useCallback(
    (result: 'saved' | 'deleted') => {
      allowNavigationRef.current = true
      navigate('/tasks', {
        state: result === 'deleted' ? { toast: 'delete-success' } : null,
      })
    },
    [navigate],
  )

  if (isPending) {
    return (
      <StatePage>
        <StateCard role="status">업무를 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (isError || !task) {
    return (
      <StatePage>
        <StateCard role="alert">
          업무를 찾을 수 없습니다.
          <BackToList to="/tasks">목록으로 돌아가기</BackToList>
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <TopRow>
          <TaskBackLink />
          {/* 이 업무의 업무보고 상세(spec: task-report)로 진입한다. */}
          <ReportButton
            type="button"
            disabled={!report}
            onClick={() => report && navigate(`/task-reports/${report.id}`)}
          >
            업무 보고 상세조회
            <ReportIcon viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 4 8 8-8 8" />
            </ReportIcon>
          </ReportButton>
        </TopRow>
        <TaskForm
          initialTask={task}
          onCompleted={handleCompleted}
          onDirtyChange={setIsDirty}
        />
      </Content>
      {blocker.state === 'blocked' && (
        <LeaveConfirmationDialog
          onCancel={blocker.reset}
          onConfirm={blocker.proceed}
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
  gap: 40px;
  margin: 0 auto;
  padding-top: 75px;
`

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
`

const ReportButton = styled.button`
  display: inline-flex;
  min-height: 68px;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  font-family: inherit;
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
`

const ReportIcon = styled.svg`
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
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
