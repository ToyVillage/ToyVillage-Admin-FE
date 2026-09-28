import { useCallback, useEffect } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  feedQueryKeys,
  formatAnimalLabel,
  getFeedDetail,
  isFeedNotFoundError,
} from '@/entities/feed'
import { FeedForm } from '@/features/feed-form'
import { BackLink, LeaveConfirmationDialog } from '@/shared/ui'
import { FeedEditSkeleton } from './ui/FeedEditSkeleton'
import { useFormLeaveGuard } from './ui/useFormLeaveGuard'

const listPath = '/feeds'

// `/feeds/:id/edit` — 급여 기록 수정(Figma `feeding correction` 2429:24034).
// 목록 행 케밥 `수정` 에서 들어오며, 뒤로가기·저장 성공은 진입 전 조회 조건의 목록으로 돌아간다.
export function EditFeedPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { blocker, setIsDirty, allowNavigation } = useFormLeaveGuard()
  const navState = location.state as { listSearch?: string } | null
  const backPath = `${listPath}${navState?.listSearch ?? ''}`

  // 진입 시 페이지 상단으로 스크롤한다.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const feedLogId = Number(id)
  const validId = Number.isSafeInteger(feedLogId) && feedLogId > 0
  const {
    data: feed,
    isPending,
    error,
  } = useQuery({
    queryKey: feedQueryKeys.detail(id),
    queryFn: () => getFeedDetail({ feedLogId }),
    enabled: validId,
    retry: false,
  })

  // 저장 결과는 목록에서 토스트로 알린다. 목록이 닫힐 때 state 를 비운다.
  const handleCompleted = useCallback(() => {
    allowNavigation()
    navigate(backPath, { state: { toast: 'edit-success' } })
  }, [allowNavigation, backPath, navigate])

  // 잘못된 id 나 없는 기록(404)은 목록으로 되돌린다(`FeedDetailPage` 와 같다).
  if (!validId) return <Navigate to={listPath} replace />

  if (isPending) return <FeedEditSkeleton backTo={backPath} />

  if (!feed) {
    if (isFeedNotFoundError(error)) return <Navigate to={backPath} replace />
    return (
      <StatePage>
        <StateCard role="alert">
          급여 기록을 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <BackLink to={backPath} />
        <Header>
          <Title>급여 기록 수정</Title>
          <Subtitle>
            {formatAnimalLabel(feed.animalType, feed.animalName)}의 급여 기록을
            수정합니다
          </Subtitle>
        </Header>
        <FeedForm
          feed={feed}
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
  padding: 0 32px 80px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 980px) {
    padding: 0 20px 48px;
  }
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: 75px;
`

// Figma 뒤로가기 하단(111) → 제목 33px, 제목 → 부제 8px, 부제 하단(229) → 폼 31px.
const Header = styled.header`
  display: flex;
  align-self: stretch;
  flex-direction: column;
  gap: 8px;
  margin: 33px 0 31px;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 40px;
  font-weight: 500;
  line-height: 48px;
`

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 29px;
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
