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
import { TaskForm } from '@/features/create-task'
import { LeaveConfirmationDialog } from '@/shared/ui'
import { TaskBackLink } from './ui/TaskBackLink'

// `/tasks/:id/edit` — 업무 수정. 읽기 전용 상세(`/tasks/:id`)에서 케밥 `수정` 으로 들어온다.
export function EditTaskPage() {
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

  // 저장 결과는 상세 화면에서 확인한다(spec 결정 사항 — 별도 토스트 없음).
  const handleCompleted = useCallback(() => {
    allowNavigationRef.current = true
    navigate(`/tasks/${id}`)
  }, [id, navigate])

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
        <TaskBackLink to={`/tasks/${id}`} />
        <TaskForm
          mode="edit"
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
  gap: 32px;
  margin: 0 auto;
  padding-top: 75px;
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
