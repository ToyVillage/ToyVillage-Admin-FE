import styled from '@emotion/styled'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import {
  getCloseSchedules,
  type CloseSchedule,
} from '@/entities/close-schedule'
import { BackLink } from '@/shared/ui'
import { CloseScheduleDetailSkeleton } from './ui/CloseScheduleDetailSkeleton'

// Figma yot `holiday detail`(2000:17207). 읽기 전용이며 수정은 목록 카드 케밥으로만 들어간다.
export function CloseScheduleDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: schedule, isPending } = useQuery({
    queryKey: ['close-schedules', id],
    queryFn: async () => {
      const cachedSchedules = queryClient.getQueryData<CloseSchedule[]>([
        'close-schedules',
      ])
      const cachedSchedule = cachedSchedules?.find(
        (schedule) => schedule.id === id,
      )

      if (cachedSchedule) return cachedSchedule

      const schedules = await getCloseSchedules()
      return schedules.find((schedule) => schedule.id === id)
    },
    enabled: Boolean(id),
  })

  if (!id) return <Navigate to="/notices/guide" replace />
  if (isPending) {
    return (
      <Page>
        <Content>
          <BackRow>
            <BackLink to="/notices/guide" />
          </BackRow>
          <CloseScheduleDetailSkeleton />
        </Content>
      </Page>
    )
  }
  if (!schedule) return <Navigate to="/notices/guide" replace />

  return (
    <Page>
      <Content>
        <BackRow>
          <BackLink to="/notices/guide" />
        </BackRow>
        <MetaCard>
          <MetaItem>
            <MetaLabel>시작일</MetaLabel>
            <MetaValue>{formatDate(schedule.startDate)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>종료일</MetaLabel>
            <MetaValue>{formatDate(schedule.endDate)}</MetaValue>
          </MetaItem>
        </MetaCard>
        <TitleCard>
          <Title>{schedule.title}</Title>
        </TitleCard>
      </Content>
    </Page>
  )
}

function formatDate(value: string) {
  return value.replaceAll('-', '.')
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
  padding-top: 76px;
`

// Figma: 뒤로가기(top 76, 높이 36) → 60 → 메타 카드(top 172).
const BackRow = styled.div`
  display: flex;
  height: 36px;
  align-items: center;
  margin: 0 0 60px;
`

// 메타 카드: 높이 140, 라벨 top 36, 값 top 74, 두 번째 열 x=440.
const MetaCard = styled.dl`
  display: grid;
  height: 140px;
  grid-template-columns: 400px 1fr;
  margin: 0;
  padding: 36px 40px 0;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    height: auto;
    grid-template-columns: 1fr 1fr;
    padding: 24px;
  }
`

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const MetaLabel = styled.dt`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: normal;
`

const MetaValue = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: normal;
`

const TitleCard = styled.section`
  margin-top: 32px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: normal;
  overflow-wrap: anywhere;
`
