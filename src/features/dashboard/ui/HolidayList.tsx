import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/shared/ui'
import type { DashboardCloseSchedule } from '../model/types'
import { formatCloseScheduleRange } from '../model/format'

interface HolidayListProps {
  schedules: DashboardCloseSchedule[]
  /** 있으면 행 전체가 휴관일 상세 링크가 된다. */
  getScheduleHref?: (schedule: DashboardCloseSchedule) => string
  // 첫 조회 중. 일정 값 자리만 막대로 채운다(Figma 2238:22610).
  loading?: boolean
}

const LOADING_ROWS: [number, number][] = [
  [80, 70],
  [180, 140],
  [80, 70],
]

// Figma `holiday list`(1906:17458). 호출하는 쪽이 이번 달 휴관일을 정렬·자른 뒤 넘긴다.
export function HolidayList({
  schedules,
  getScheduleHref,
  loading = false,
}: HolidayListProps) {
  if (loading) {
    return (
      <List>
        {LOADING_ROWS.map(([rangeWidth, titleWidth], index) => (
          <Row key={index}>
            <Accent aria-hidden="true" />
            <Text>
              <Skeleton width={rangeWidth} height={18} />
              <Skeleton width={titleWidth} height={14} />
            </Text>
          </Row>
        ))}
      </List>
    )
  }

  if (schedules.length === 0) return <Empty>이번 달 휴무일이 없습니다.</Empty>

  return (
    <List>
      {schedules.map((schedule) => {
        const content = (
          <>
            <Accent aria-hidden="true" />
            <Text>
              <Range>{formatCloseScheduleRange(schedule)}</Range>
              <Reason>{schedule.title}</Reason>
            </Text>
          </>
        )

        return (
          <Row key={schedule.id}>
            {getScheduleHref ? (
              <RowLink to={getScheduleHref(schedule)}>{content}</RowLink>
            ) : (
              content
            )}
          </Row>
        )
      })}
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

// 카드 전체를 덮는 `자세히 보기` 링크(::after) 위에 올려 행 클릭이 상세로 가게 한다.
const RowLink = styled(Link)`
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  height: 100%;
  flex: 1;
  align-items: center;
  gap: 14px;
  color: inherit;
  text-decoration: none;

  &:focus-visible {
    border-radius: 8px;
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
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
