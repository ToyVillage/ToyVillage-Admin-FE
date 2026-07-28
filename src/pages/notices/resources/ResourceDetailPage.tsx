import { useCallback, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import {
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { getDocument } from '@/entities/resource'
import { LeaveConfirmationDialog } from '@/features/create-notice'
import { ResourceForm } from '@/features/create-resource'

export function ResourceDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const allowNavigationRef = useRef(false)
  const [isDirty, setIsDirty] = useState(false)

  // 상세 진입 시 페이지 상단으로 스크롤한다.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { data: resource } = useQuery({
    queryKey: ['resources', id],
    queryFn: () => getDocument({ id: Number(id) }),
    enabled: Boolean(id),
    retry: false,
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

  // 로딩 중에는 빈 폼(수정 레이아웃)을 먼저 보여주고, 데이터가 오면 값이 채워진
  // 폼으로 교체한다(key 변경으로 재마운트). 별도의 '찾을 수 없음' 화면은 두지 않는다.
  return (
    <Page>
      <Content>
        <ResourceForm
          key={resource?.id ?? 'loading'}
          initialResource={resource}
          editing
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
