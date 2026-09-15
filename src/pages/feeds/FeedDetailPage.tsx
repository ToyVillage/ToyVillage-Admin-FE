import { useEffect } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import {
  FeedHistoryTable,
  FeedRecordCard,
  getMockFeedDetail,
} from '@/entities/feed'
import { BackLink, SectionHeader } from '@/shared/ui'

const listPath = '/feeds'

export function FeedDetailPage() {
  const { id = '' } = useParams()

  // 상세 진입 시 페이지 상단으로 스크롤한다.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { data: feed, isPending } = useQuery({
    queryKey: ['feeds', 'detail', id],
    queryFn: () => getMockFeedDetail(id),
  })

  // 목록에서 사라진 기록으로 진입하면 목록으로 되돌린다.
  if (!isPending && !feed) return <Navigate to={listPath} replace />

  const history = feed?.history ?? []

  return (
    <Page>
      <Content>
        <BackLink to={listPath} />

        {feed && <FeedRecordCard feed={feed} />}

        <HistorySection>
          <SectionHeader title="급여 이력" meta={`${history.length}건`} />
          <FeedHistoryTable
            records={history}
            emptyLabel={isPending ? ' ' : '급여 이력이 없습니다.'}
          />
        </HistorySection>
      </Content>
    </Page>
  )
}

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

// Figma 카드 아래 `급여 이력` 섹션 헤더까지의 간격(499 - 카드 하단).
const HistorySection = styled.section`
  display: flex;
  width: 100%;
  flex-direction: column;
  margin-top: 86px;
`
