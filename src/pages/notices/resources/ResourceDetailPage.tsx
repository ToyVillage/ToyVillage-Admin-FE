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

  const { data: resource, isError } = useQuery({
    queryKey: ['resources', id],
    queryFn: () => getDocument({ id: Number(id) }),
    enabled: Boolean(id),
    retry: false,
    // 상세 페이지를 떠나는 즉시 캐시를 제거한다. 삭제 후 재진입 시 stale 데이터가
    // 표시되지 않고 항상 신규 요청을 보낸다.
    gcTime: 0,
  })

  // 상세 조회가 실패하면(잘못된 id·404·네트워크) resource 가 영영 undefined 로 남아
  // 제출·삭제가 비활성화된 빈 폼에 고착된다. 별도 '찾을 수 없음' 화면은 디자인에 없으므로
  // 목록으로 되돌려 보낸다. (이탈 차단은 우회한다.)
  useEffect(() => {
    if (!isError) return
    allowNavigationRef.current = true
    navigate('/notices/resources', { replace: true })
  }, [isError, navigate])
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
