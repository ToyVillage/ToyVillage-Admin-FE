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
import { getMockResource } from '@/entities/resource'
import { LeaveConfirmationDialog } from '@/features/create-notice'
import { ResourceForm } from '@/features/create-resource'

export function ResourceDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const allowNavigationRef = useRef(false)
  const [isDirty, setIsDirty] = useState(false)
  const { data: resource, isPending } = useQuery({
    queryKey: ['resources', id],
    queryFn: () => getMockResource(id),
    enabled: Boolean(id),
  })
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
    navigate('/notices/resources')
  }, [navigate])

  if (isPending) {
    return (
      <StatePage>
        <StateCard role="status">자료를 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (!resource) {
    return (
      <StatePage>
        <StateCard>
          <StateTitle>자료를 찾을 수 없습니다.</StateTitle>
          <BackLink to="/notices/resources">자료실 목록으로 돌아가기</BackLink>
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <ResourceForm
          key={resource.id}
          initialResource={resource}
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
  padding: 0 32px 66px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: 168px;

  @media (max-width: 980px) {
    padding-top: 96px;
  }
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

const StateTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 600;
`

const BackLink = styled(Link)`
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  margin-top: 28px;
  padding: 0 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 18px;
  text-decoration: none;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 3px;
  }
`
