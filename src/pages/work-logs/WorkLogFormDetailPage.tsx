import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import {
  getWorkLogFormDetail,
  isWorkLogNotFoundError,
  workLogFormQueryKeys,
  WorkLogFormQuestionCard,
} from '@/entities/work-log'
import { BackLink } from '@/shared/ui'

const listPath = '/work-logs?tab=forms'

export function WorkLogFormDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  // 목록에서 넘어왔다면 그때의 조회 조건(페이지)으로 돌아간다.
  const navState = location.state as { listSearch?: string } | null
  const backPath = navState?.listSearch
    ? `/work-logs${navState.listSearch}`
    : listPath

  const workLogTemplateId = Number(id)
  const {
    data: form,
    isPending,
    error,
  } = useQuery({
    queryKey: workLogFormQueryKeys.detail(id),
    queryFn: () => getWorkLogFormDetail({ workLogTemplateId }),
    enabled: Number.isSafeInteger(workLogTemplateId) && workLogTemplateId > 0,
    retry: false,
  })

  // 삭제된 양식(404)이나 잘못된 id 로 진입하면 양식 관리 탭으로 되돌린다(spec).
  if (!Number.isSafeInteger(workLogTemplateId) || workLogTemplateId <= 0) {
    return <Navigate to={backPath} replace />
  }

  // 404(지워진 양식)만 목록으로 되돌린다. 500·네트워크 실패까지 되돌리면
  // 조회 실패가 '삭제됨'으로 오인된다.
  if (!isPending && !form) {
    if (isWorkLogNotFoundError(error)) {
      return <Navigate to={backPath} replace />
    }
    return (
      <StatePage>
        <StateCard role="alert">
          양식을 불러오지 못했습니다. 다시 시도해 주세요.
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <BackLink to={backPath} />
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
