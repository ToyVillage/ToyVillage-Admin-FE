import styled from '@emotion/styled'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import {
  getWorkLogDetail,
  isWorkLogNotFoundError,
  workLogQueryKeys,
  WorkLogSheet,
} from '@/entities/work-log'
import { BackLink, Toast } from '@/shared/ui'
import { WorkLogDetailSkeleton } from './ui/WorkLogDetailSkeleton'

export function WorkLogDetailPage() {
  const { id = '' } = useParams()
  // 첨부 다운로드 실패는 토스트로만 알린다(같은 파일을 다시 눌러도 다시 뜨게 key 를 올린다).
  const [downloadErrorId, setDownloadErrorId] = useState(0)

  const workLogId = Number(id)
  const {
    data: detail,
    isPending,
    error,
  } = useQuery({
    queryKey: workLogQueryKeys.detail(id),
    queryFn: () => getWorkLogDetail({ workLogId }),
    enabled: Number.isSafeInteger(workLogId) && workLogId > 0,
    retry: false,
  })

  // 삭제된 일지나 잘못된 id 로 진입하면 목록으로 되돌린다(spec).
  if (!Number.isSafeInteger(workLogId) || workLogId <= 0) {
    return <Navigate to="/work-logs" replace />
  }

  if (isPending) {
    return (
      <Page>
        <Content>
          <BackLink to="/work-logs" />
          <WorkLogDetailSkeleton />
        </Content>
      </Page>
    )
  }

  // 404(지워진 일지)만 목록으로 되돌린다. 500·네트워크 실패까지 되돌리면
  // 조회 실패가 '삭제됨'으로 오인된다.
  if (!isPending && !detail) {
    if (isWorkLogNotFoundError(error)) {
      return <Navigate to="/work-logs" replace />
    }
    return (
      <StatePage>
        <StateCard role="alert">
          업무일지를 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <BackLink to="/work-logs" />
        <Meta>
          <Title>{detail ? formatTitle(detail.date) : ''}</Title>
          <MetaItem>
            {detail ? `선택 양식: ${detail.formName}` : ''}
          </MetaItem>
          <MetaItem>
            {detail ? `작성자: ${detail.authorName}` : ''}
          </MetaItem>
        </Meta>
        <SheetArea>
          <WorkLogSheet
            columns={detail?.columns ?? []}
            rows={detail?.rows ?? []}
            onDownloadError={() => setDownloadErrorId((prev) => prev + 1)}
          />
        </SheetArea>
      </Content>

      {downloadErrorId > 0 && (
        <Toast
          key={downloadErrorId}
          variant="error"
          message="파일 다운로드에 실패했습니다"
          onDismiss={() => setDownloadErrorId(0)}
        />
      )}
    </Page>
  )
}

// Figma 헤더의 `0월 00일 업무일지` 는 더미값이라 작성일에서 만든다.
function formatTitle(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return `${Number(month)}월 ${Number(day)}일 업무일지`
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

const Meta = styled.header`
  display: flex;
  min-height: 38px;
  align-items: flex-end;
  gap: 20px;
  margin-top: 32px;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const MetaItem = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const SheetArea = styled.div`
  width: 100%;
  margin-top: 39px;
`
