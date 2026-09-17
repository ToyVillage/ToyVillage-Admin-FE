import { useEffect } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import {
  feedQueryKeys,
  FeedHistoryTable,
  feedHistoryTableMinWidth,
  FeedRecordCard,
  getFeedDetail,
  isFeedNotFoundError,
  type AnimalSpecies,
} from '@/entities/feed'
import { BackLink, SectionHeader } from '@/shared/ui'

const listPath = '/feeds'

export function FeedDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  // 목록에서 넘어왔다면 그때의 조회 조건(날짜·분류·페이지)으로 돌아간다.
  // 분류는 급여 API 가 주지 않아 목록에서 고른 탭을 그대로 받아 뱃지에 쓴다.
  const navState = location.state as {
    listSearch?: string
    species?: AnimalSpecies | null
  } | null
  const backPath = `${listPath}${navState?.listSearch ?? ''}`
  const species = navState?.species ?? undefined

  // 상세 진입 시 페이지 상단으로 스크롤한다.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const feedLogId = Number(id)
  const {
    data: feed,
    isPending,
    error,
  } = useQuery({
    queryKey: feedQueryKeys.detail(id),
    queryFn: () => getFeedDetail({ feedLogId }),
    enabled: Number.isSafeInteger(feedLogId) && feedLogId > 0,
    retry: false,
  })

  // 없는 기록이나 잘못된 id 로 진입하면 목록으로 되돌린다.
  if (!Number.isSafeInteger(feedLogId) || feedLogId <= 0) {
    return <Navigate to={listPath} replace />
  }

  // 404(없는 기록)만 목록으로 되돌린다. 500·네트워크 실패까지 되돌리면
  // 조회 실패가 '없는 기록'으로 오인된다.
  if (!isPending && !feed) {
    if (isFeedNotFoundError(error)) {
      return <Navigate to={listPath} replace />
    }
    return (
      <StatePage>
        <StateCard role="alert">
          급여 기록을 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  const history = feed?.history ?? []

  return (
    <Page>
      <Content>
        <BackLink to={backPath} />

        {feed && <FeedRecordCard feed={{ ...feed, species }} />}

        <HistorySection>
          <SectionHeader title="급여 이력" count={history.length} />
          <HistoryTableArea>
            <FeedHistoryTable
              records={history}
              emptyLabel={isPending ? ' ' : '급여 이력이 없습니다.'}
            />
          </HistoryTableArea>
        </HistorySection>
      </Content>
    </Page>
  )
}

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

const Page = styled.main`
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: calc(75px - 32px);
`

// 화면이 열 폭 합계보다 좁아지면 표만 가로로 스크롤한다.
const HistoryTableArea = styled.div`
  width: 100%;
  overflow-x: auto;

  > * {
    min-width: ${feedHistoryTableMinWidth}px;
  }
`

// Figma 카드 아래 `급여 이력` 섹션 헤더까지의 간격(499 - 카드 하단).
const HistorySection = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  margin-top: 86px;
`
