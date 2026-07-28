import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Navigate, useParams } from 'react-router-dom'
import { getCloseSchedulesByDate } from '@/entities/close-schedule'
import { OperatingHoursForm } from '@/features/edit-operating-hours'
import { GuideBackLink } from './ui/GuideBackLink'

export function OperatingHoursPage() {
  const { date } = useParams()
  if (!date || !isDateKey(date)) {
    return <Navigate to="/notices/guide" replace />
  }

  return <OperatingHoursDetail date={date} />
}

function OperatingHoursDetail({ date }: { date: string }) {
  const {
    data: schedules = [],
    isError,
    isPending,
  } = useQuery({
    queryKey: ['close-schedules', 'by-date', date],
    queryFn: () => getCloseSchedulesByDate({ date }),
  })
  const firstSchedule = schedules[0]

  return (
    <Page>
      <Content>
        <BackRow>
          <GuideBackLink />
        </BackRow>
        <Title>{formatTitle(date)}</Title>
        {isPending ? (
          <QueryStatus role="status">
            휴관일을 조회하는 중입니다.
          </QueryStatus>
        ) : isError ? (
          <QueryStatus role="alert">
            휴관일을 불러오지 못했습니다. 다시 시도해 주세요.
          </QueryStatus>
        ) : (
          <>
            {firstSchedule && (
              <ScheduleSummary>휴관 일정: {firstSchedule.title}</ScheduleSummary>
            )}
            <OperatingHoursForm date={date} />
          </>
        )}
      </Content>
    </Page>
  )
}

function isDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  )
}

function formatTitle(value: string) {
  const [, month, day] = value.split('-').map(Number)
  return `${month}월 ${day}일 영업시간`
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: 76px;
`

const BackRow = styled.div`
  display: flex;
  height: 36px;
  align-items: center;
`

const Title = styled.h1`
  margin: 32px 0 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 60px;
  font-weight: 600;
  line-height: 1.2;
`

const ScheduleSummary = styled.p`
  margin: 16px 0 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
`

const QueryStatus = styled.p`
  margin: 32px 0 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;

  &[role='alert'] {
    color: ${({ theme }) => theme.colors.danger};
  }
`
