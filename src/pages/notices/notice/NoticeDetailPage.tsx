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
import { getNotice, isNoticeNotFoundError } from '@/entities/notice'
import { NoticeForm } from '@/features/create-notice'
import { LeaveConfirmationDialog } from '@/shared/ui'

export function NoticeDetailPage() {
  const { id = '' } = useParams()
  const noticeId = parseNoticeId(id)
  const navigate = useNavigate()
  const allowNavigationRef = useRef(false)
  const [isDirty, setIsDirty] = useState(false)
  const {
    data: notice,
    error,
    isError,
    isPending,
  } = useQuery({
    queryKey: ['notices', id],
    queryFn: () => {
      if (noticeId === null) {
        throw new Error('공지사항 ID가 올바르지 않습니다.')
      }

      return getNotice({ id: noticeId })
    },
    enabled: noticeId !== null,
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
    navigate('/notices/list')
  }, [navigate])

  const isNotFound =
    noticeId === null || (isError && isNoticeNotFoundError(error))

  if (isNotFound) {
    return (
      <StatePage>
        <StateCard>
          <StateTitle>공지사항을 찾을 수 없습니다.</StateTitle>
          <BackLink to="/notices/list">공지사항 목록으로 돌아가기</BackLink>
        </StateCard>
      </StatePage>
    )
  }

  if (isPending) {
    return (
      <StatePage>
        <StateCard role="status">공지사항을 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (isError || !notice) {
    return (
      <StatePage>
        <StateCard role="alert">
          <StateTitle>공지사항을 불러오지 못했습니다.</StateTitle>
          <StateDescription>다시 시도해 주세요.</StateDescription>
          <BackLink to="/notices/list">공지사항 목록으로 돌아가기</BackLink>
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <NoticeForm
          key={notice.id}
          initialNotice={notice}
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

function parseNoticeId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
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

const StateDescription = styled.p`
  margin: 12px 0 0;
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
