import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import {
  getMockWorkLogFormDetail,
  WorkLogFormQuestionCard,
} from '@/entities/work-log'
import { BackLink } from '@/shared/ui'

const listPath = '/work-logs?tab=forms'

export function WorkLogFormDetailPage() {
  const { id = '' } = useParams()

  const { data: form, isPending } = useQuery({
    queryKey: ['work-log-forms', 'detail', id],
    queryFn: () => getMockWorkLogFormDetail(id),
  })

  // 목록에서 삭제된 양식으로 진입하면 양식 관리 탭으로 되돌린다(spec).
  if (!isPending && !form) return <Navigate to={listPath} replace />

  return (
    <Page>
      <Content>
        <BackLink to={listPath} />
        <Cards>
          <TitleCard>
            <TitleLabel>
              양식명<Required aria-hidden="true"> *</Required>
            </TitleLabel>
            <TitleValue>{form?.name ?? ''}</TitleValue>
          </TitleCard>
          {form?.questions.map((question) => (
            <WorkLogFormQuestionCard key={question.id} question={question} />
          ))}
        </Cards>
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
  padding-top: calc(76px - 32px);
`

const Cards = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 32px;
  margin-top: 32px;
`

const TitleCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const TitleLabel = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const TitleValue = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
`
