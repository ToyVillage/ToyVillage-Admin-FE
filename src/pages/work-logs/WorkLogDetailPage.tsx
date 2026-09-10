import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import { getMockWorkLogDetail, WorkLogSheet } from '@/entities/work-log'
import { BackLink } from '@/shared/ui'

export function WorkLogDetailPage() {
  const { id = '' } = useParams()

  const { data: detail, isPending } = useQuery({
    queryKey: ['work-logs', 'detail', id],
    queryFn: () => getMockWorkLogDetail(id),
  })

  // 목록에서 삭제된 일지로 진입하면 목록으로 되돌린다(spec).
  if (!isPending && !detail) return <Navigate to="/work-logs" replace />

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
          />
        </SheetArea>
      </Content>
    </Page>
  )
}

// Figma 헤더의 `0월 00일 업무일지` 는 더미값이라 작성일에서 만든다.
function formatTitle(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  return `${Number(month)}월 ${Number(day)}일 업무일지`
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
