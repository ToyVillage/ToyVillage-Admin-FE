import { useEffect } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  feedQueryKeys,
  FeedHistoryTable,
  feedHistoryTableMinWidth,
  FeedRecordCard,
  getFeedDetail,
  isFeedNotFoundError,
  type AnimalSpecies,
} from '@/entities/feed'
import {
  getIndividualSpeciesId,
  individualQueryKeys,
} from '@/entities/individual'
import { BackLink, SectionHeader } from '@/shared/ui'

const listPath = '/feeds'

export function FeedDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  // 목록에서 넘어왔다면 그때의 조회 조건(날짜·분류·페이지)으로 돌아간다.
  // 개체 상세에서 넘어왔다면 그 개체 상세로 돌아간다(`backPath`).
  // 분류는 급여 API 가 주지 않아 목록에서 고른 탭을 그대로 받아 뱃지에 쓴다.
  const navState = location.state as {
    listSearch?: string
    backPath?: string
    species?: AnimalSpecies | null
  } | null
  const backPath =
    navState?.backPath ?? `${listPath}${navState?.listSearch ?? ''}`
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

  // `관찰 및 특이사항 보러가기` 링크에는 종 id 가 필요한데 급여 응답은 개체 id 만 준다.
  const animalManageId = feed?.animalManageId
  const individualId = animalManageId == null ? '' : String(animalManageId)
  const { data: speciesId } = useQuery({
    queryKey: individualQueryKeys.speciesId(individualId),
    queryFn: () =>
      getIndividualSpeciesId({ animalManageId: Number(individualId) }),
    enabled: individualId !== '',
    retry: false,
  })

  // 종 id 를 모르면(로딩 중·조회 실패) 링크를 걸지 않고 비활성으로 둔다.
  const observationHref = speciesId
    ? `/species/${speciesId}/individuals/${individualId}`
    : null

  // 없는 기록이나 잘못된 id 로 진입하면 목록으로 되돌린다.
  if (!Number.isSafeInteger(feedLogId) || feedLogId <= 0) {
    return <Navigate to={listPath} replace />
  }

  // 404(없는 기록)만 목록으로 되돌린다. 500·네트워크 실패까지 되돌리면
  // 조회 실패가 '없는 기록'으로 오인된다.
  if (!isPending && !feed) {
    // 목록에서 넘어왔다면 그때의 조회 조건으로 되돌린다(뒤로가기와 같은 곳).
    if (isFeedNotFoundError(error)) {
      return <Navigate to={backPath} replace />
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

        {feed && (
          <FeedRecordCard
            feed={{ ...feed, species }}
            observationHref={observationHref}
          />
        )}

        <HistorySection>
          <SectionHeader title="급여 이력" count={history.length} />
          <HistoryTableArea>
            <FeedHistoryTable
              records={history}
              emptyLabel={isPending ? ' ' : '급여 이력이 없습니다.'}
              onSelect={(feedLogId) => {
                // 같은 개체의 다른 급여 기록으로 옮겨간다. 뒤로가기 목적지는 그대로 물려준다.
                if (feedLogId === id) return
                navigate(`/feeds/${feedLogId}`, {
                  state: { backPath, species },
                })
              }}
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
