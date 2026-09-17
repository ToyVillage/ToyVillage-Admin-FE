import styled from '@emotion/styled'
import type { DashboardCloseSchedule } from '../model/types'
import { formatCloseScheduleRange } from '../model/format'

interface HolidayListProps {
  schedules: DashboardCloseSchedule[]
}

// Figma `holiday list`(1906:17458). 호출하는 쪽이 이번 달 휴관일을 정렬·자른 뒤 넘긴다.
export function HolidayList({ schedules }: HolidayListProps) {
  if (schedules.length === 0) return <Empty>이번 달 휴관일이 없습니다.</Empty>

  return (
    <List>
      {schedules.map((schedule) => (
        <Row key={schedule.id}>
          <Accent aria-hidden="true" />
          <Text>
            <Range>{formatCloseScheduleRange(schedule)}</Range>
            <Reason>{schedule.title}</Reason>
          </Text>
        </Row>
      ))}
    </List>
  )
}

const List = styled.ul`
  min-width: 0;
  flex: 1;
  margin: 0;
  padding: 40px 0 0;
  list-style: none;
`

const Row = styled.li`
  display: flex;
  height: 76px;
  align-items: center;
  gap: 14px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  }
`

const Accent = styled.span`
  width: 4px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.danger};
`

const Text = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`

const Range = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 600;
  line-height: normal;
`

const Reason = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 16px;
  font-weight: 500;
  line-height: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Empty = styled.p`
  flex: 1;
  margin: 0;
  padding-top: 40px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
`
