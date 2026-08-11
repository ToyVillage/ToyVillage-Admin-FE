import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { findTaskAssignee } from '@/entities/task'
import { getMockTaskReport, TaskReportMetaRow } from '@/entities/task-report'
import { TaskReportReviewActions } from '@/features/review-task-report'
import { AttachmentList } from '@/shared/ui'

export function TaskReportDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const {
    data: report,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['task-reports', id],
    queryFn: () => getMockTaskReport(id),
    enabled: Boolean(id),
  })

  if (isPending) {
    return (
      <StatePage>
        <StateCard role="status">업무보고를 불러오는 중입니다.</StateCard>
      </StatePage>
    )
  }

  if (isError || !report) {
    return (
      <StatePage>
        <StateCard role="alert">
          업무보고를 찾을 수 없습니다.
          <BackToList to="/task-reports">목록으로 돌아가기</BackToList>
        </StateCard>
      </StatePage>
    )
  }

  return (
    <Page>
      <Content>
        <TaskReportMetaRow
          priority={report.priority}
          taskStatus={report.taskStatus}
          assigneeName={findTaskAssignee(report.assigneeId)?.name ?? '미지정'}
          dueDate={report.dueDate}
          visibility={report.visibility}
        />

        <TitleCard>
          <Label>제목</Label>
          <TitleValue>{report.title}</TitleValue>
        </TitleCard>

        <ContentCard>
          <Label>
            상세 업무 내용 <Required aria-hidden="true">*</Required>
          </Label>
          <ContentValue>{report.content}</ContentValue>
        </ContentCard>

        <AttachmentList fileNames={report.attachments ?? []} />

        <TaskReportReviewActions
          reportId={report.id}
          onCompleted={() => navigate('/task-reports')}
        />
      </Content>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 32px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  gap: 32px;
  margin: 0 auto;
  padding-top: 164px;
`

const TitleCard = styled.section`
  display: flex;
  min-height: 162px;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const ContentCard = styled.section`
  display: flex;
  min-height: 240px;
  flex-direction: column;
  gap: 10px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Label = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const TitleValue = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
`

const ContentValue = styled.p`
  margin: 0;
  flex: 1;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
  white-space: pre-wrap;
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
  display: flex;
  width: min(100%, 560px);
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`

const BackToList = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  font-size: 20px;
  font-weight: 600;
`
