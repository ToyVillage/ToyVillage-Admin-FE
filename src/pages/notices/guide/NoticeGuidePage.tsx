import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  getCloseSchedules,
  type CloseSchedule,
} from '@/entities/close-schedule'
import { CreateCloseScheduleButton } from '@/features/create-close-schedule'
import arrowIcon from './ui/assets/arrow.svg'
import filterIcon from '@/shared/ui/assets/filter.svg'
import searchIcon from '@/shared/ui/assets/search.svg'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

interface CalendarDay {
  key: string
  date: Date
  inMonth: boolean
  schedules: CloseSchedule[]
}

export function NoticeGuidePage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const {
    data: schedules = [],
    isError,
    isPending,
  } = useQuery({
    queryKey: ['close-schedules'],
    queryFn: getCloseSchedules,
  })

  const monthSchedules = useMemo(
    () => filterSchedulesByMonth(schedules, month),
    [month, schedules],
  )
  const filteredSchedules = useMemo(
    () => filterSchedulesByQuery(monthSchedules, query),
    [monthSchedules, query],
  )
  const calendarDays = useMemo(
    () => createCalendarDays(month, monthSchedules),
    [month, monthSchedules],
  )

  return (
    <Page>
      <Content>
        <Header>
          <div>
            <Title>휴관일 관리</Title>
            <Subtitle>토이빌리지의 휴관 일정 확인 및 조율</Subtitle>
          </div>
          <CreateCloseScheduleButton />
        </Header>

        <MainGrid>
          <CalendarSection>
            <CalendarHeader>
              <MonthButton
                type="button"
                aria-label="이전 달"
                onClick={() => setMonth((current) => addMonths(current, -1))}
              >
                <ArrowIcon src={arrowIcon} alt="" $left />
              </MonthButton>
              <MonthTitle>{formatMonthTitle(month)}</MonthTitle>
              <MonthButton
                type="button"
                aria-label="다음 달"
                onClick={() => setMonth((current) => addMonths(current, 1))}
              >
                <ArrowIcon src={arrowIcon} alt="" />
              </MonthButton>
            </CalendarHeader>

            <WeekHeader>
              {DAYS.map((day) => (
                <WeekCell key={day}>{day}</WeekCell>
              ))}
            </WeekHeader>

            <CalendarGrid>
              {calendarDays.map((day) => (
                <DayCell
                  key={day.key}
                  to={`/notices/guide/hours/${day.key}`}
                  aria-label={`${formatFullDate(day.date)}${
                    day.schedules.length > 0 ? ' 휴관 일정 있음' : ''
                  }`}
                >
                  <DayNumber $muted={!day.inMonth}>
                    {day.date.getDate()}
                  </DayNumber>
                  {day.schedules.length > 0 && (
                    <ClosedMarker aria-hidden="true">휴관</ClosedMarker>
                  )}
                </DayCell>
              ))}
            </CalendarGrid>
          </CalendarSection>

          <Aside>
            <SearchBar>
              <SearchIcon src={searchIcon} alt="" />
              <SearchInput
                aria-label="휴관 일정 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <FilterButton
                type="button"
                aria-label="휴관 일정 필터"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
              >
                <FilterIcon src={filterIcon} alt="" />
              </FilterButton>
            </SearchBar>

            {filterOpen && (
              <FilterNotice role="status">
                필터 옵션은 준비 중입니다
              </FilterNotice>
            )}

            {isPending ? (
              <QueryStatus role="status">
                휴관일을 불러오는 중입니다.
              </QueryStatus>
            ) : isError ? (
              <QueryStatus role="alert">
                휴관일을 불러오지 못했습니다. 다시 시도해 주세요.
              </QueryStatus>
            ) : filteredSchedules.length > 0 ? (
              <CardList aria-label="휴관 일정 목록">
                {filteredSchedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    to={`/notices/guide/${schedule.id}/edit`}
                    aria-label={`${schedule.title} 휴관 일정 수정`}
                  >
                    <CardDate>{formatScheduleRange(schedule)}</CardDate>
                    <CardTitle>{schedule.title}</CardTitle>
                  </ScheduleCard>
                ))}
              </CardList>
            ) : (
              <EmptyState>아직 추가된 휴관일이 없습니다</EmptyState>
            )}
          </Aside>
        </MainGrid>
      </Content>
    </Page>
  )
}

function createCalendarDays(month: Date, schedules: CloseSchedule[]) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index): CalendarDay => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    return {
      key: toDateKey(date),
      date,
      inMonth: date.getMonth() === month.getMonth(),
      schedules: schedules.filter((schedule) =>
        isDateWithinSchedule(date, schedule),
      ),
    }
  })
}

function filterSchedulesByMonth(schedules: CloseSchedule[], month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

  return schedules.filter((schedule) => {
    const scheduleStart = parseDate(schedule.startDate)
    const scheduleEnd = parseDate(schedule.endDate)
    return scheduleStart <= end && scheduleEnd >= start
  })
}

function filterSchedulesByQuery(schedules: CloseSchedule[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return schedules

  return schedules.filter((schedule) => {
    const label = `${formatScheduleRange(schedule)} ${schedule.title}`
    return label.toLowerCase().includes(normalizedQuery)
  })
}

function isDateWithinSchedule(date: Date, schedule: CloseSchedule) {
  const start = parseDate(schedule.startDate)
  const end = parseDate(schedule.endDate)
  return start <= date && date <= end
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}월`
}

function formatFullDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

function formatScheduleRange(schedule: CloseSchedule) {
  const start = parseDate(schedule.startDate)
  const end = parseDate(schedule.endDate)
  const startLabel = formatShortDate(start)
  const endLabel = formatShortDate(end)

  return schedule.startDate === schedule.endDate
    ? startLabel
    : `${startLabel} ~ ${endLabel}`
}

function formatShortDate(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

const Page = styled.main`
  min-height: 100vh;
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: calc(124px - 32px);
`

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 60px;
  font-weight: 600;
  line-height: 1.2;
`

const Subtitle = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.textSub};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(520px, 756px) minmax(360px, 532px);
  gap: 24px;
  margin-top: 28px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const CalendarSection = styled.section`
  overflow: hidden;
  border-radius: 20px;
`

const CalendarHeader = styled.div`
  display: flex;
  min-height: 80px;
  align-items: center;
  justify-content: space-between;
  padding: 17px 40px;
  background: ${({ theme }) => theme.colors.surface};
`

const MonthButton = styled.button`
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #848491;
  cursor: pointer;
`

const ArrowIcon = styled.img<{ $left?: boolean }>`
  width: 13px;
  height: 22px;
  transform: rotate(${({ $left }) => ($left ? '180deg' : '0deg')});
`

const MonthTitle = styled.h2`
  margin: 0;
  color: #36363f;
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: #dddde3;
`

const WeekCell = styled.div`
  display: flex;
  min-height: 31px;
  align-items: center;
  justify-content: center;
  color: #36363f;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: ${({ theme }) => theme.colors.surface};
`

const DayCell = styled(Link)`
  display: flex;
  min-height: 112px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  overflow: hidden;
  color: inherit;
  cursor: pointer;
  text-decoration: none;

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.primary};
    outline-offset: calc(-1 * 4px);
  }

  @media (min-width: 1280px) {
    min-height: 152px;
  }
`

const DayNumber = styled.span<{ $muted: boolean }>`
  width: 100%;
  color: ${({ $muted }) => ($muted ? '#848491' : '#36363f')};
  font-size: ${({ $muted }) => ($muted ? '18px' : '20px')};
  font-weight: ${({ $muted }) => ($muted ? 500 : 600)};
  line-height: 1.2;
`

const ClosedMarker = styled.span`
  display: inline-flex;
  width: min(100%, 84px);
  min-height: 32px;
  align-items: center;
  justify-content: center;
  background: #ff7d7d;
  color: ${({ theme }) => theme.colors.surface};
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
`

const Aside = styled.aside`
  position: relative;
  min-height: 360px;
`

const SearchBar = styled.div`
  display: flex;
  height: 50px;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.surface};
`

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #36363f;
  font: inherit;
`

const SearchIcon = styled.img`
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
`

const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #848491;
  cursor: pointer;
`

const FilterIcon = styled.img`
  width: 22px;
  height: 20px;
  flex: 0 0 22px;
`

const FilterNotice = styled.p`
  margin: 8px 0 0;
  padding: 0 16px;
  color: #848491;
  font-size: 18px;
  font-weight: 500;
`

const QueryStatus = styled.p`
  margin: 24px 0 0;
  padding: 24px 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSub};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
`

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 24px;
`

const ScheduleCard = styled(Link)`
  display: flex;
  min-height: 88px;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 18px 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: #36363f;
  text-decoration: none;

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 4px;
  }
`

const CardDate = styled.strong`
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
`

const CardTitle = styled.span`
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const EmptyState = styled.p`
  position: absolute;
  top: 250px;
  left: 50%;
  margin: 0;
  color: #afafba;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  transform: translateX(-50%);
`
