import { useCallback, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom'
import { NoticeForm } from '@/features/create-notice'
import { BackLink, LeaveConfirmationDialog } from '@/shared/ui'

export function CreateNoticePage() {
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

  const handleCreated = useCallback(() => {
    allowNavigationRef.current = true
    navigate('/notices/list')
  }, [navigate])

  return (
    <Page>
      <Content>
        <BackRow>
          <BackLink to="/notices/list" />
        </BackRow>
        <NoticeForm onCompleted={handleCreated} onDirtyChange={setIsDirty} />
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
  padding: 0 32px 66px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: 76px;
`

// Figma yot `1:6919`: 뒤로가기(top 76, 높이 36) → 60 → 제목 카드(top 172).
const BackRow = styled.div`
  display: flex;
  height: 36px;
  align-items: center;
  margin: 0 0 60px;
`
