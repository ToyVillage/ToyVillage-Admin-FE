import { useCallback, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom'
import { TaskForm } from '@/features/create-task'
import { LeaveConfirmationDialog } from '@/shared/ui'
import { TaskBackLink } from './ui/TaskBackLink'

export function CreateTaskPage() {
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

  const handleCompleted = useCallback(() => {
    allowNavigationRef.current = true
    navigate('/tasks')
  }, [navigate])

  return (
    <Page>
      <Content>
        <TaskBackLink />
        <TaskForm onCompleted={handleCompleted} onDirtyChange={setIsDirty} />
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
  gap: 108px;
  margin: 0 auto;
  padding-top: 75px;
`
