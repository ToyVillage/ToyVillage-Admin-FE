import { useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteCloseSchedule,
  getCloseSchedules,
  type CloseSchedule,
} from '@/entities/close-schedule'
import { CreateCloseScheduleButton } from '@/features/create-close-schedule'
import {
  DeleteConfirmationDialog,
  KebabMenu,
  Toast,
  useFocusFrame,
  type ToastVariant,
} from '@/shared/ui'
import arrowIcon from './ui/assets/arrow.svg'
import { CloseScheduleSkeleton } from './ui/CloseScheduleSkeleton'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

interface NoticeGuideLocationState {
  toast?: 'create-success'
}

interface CalendarDay {
  key: string
  date: Date
  inMonth: boolean
  schedules: CloseSchedule[]
}

export function NoticeGuidePage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // 케밥 메뉴는 동시에 하나만 열린다. 열린 카드 id 를 목록이 소유한다.
  const [openKebabId, setOpenKebabId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    variant: ToastVariant
    message: string
  } | null>(null)
  // 생성 화면에서 이동 state 로 전달받은 결과. yot `1:6158`.
  const location = useLocation()
  const createdToast =
    (location.state as NoticeGuideLocationState | null)?.toast ===
    'create-success'
  const visibleToast =
    toast ??
    (createdToast
      ? { variant: 'success' as const, message: '데이터 생성에 성공했습니다' }
      : null)
  const deletingRef = useRef(false)
  // 카드별 `⋮` 버튼. 삭제 모달을 닫은 뒤 초점을 되돌리는 데 쓴다.
  const kebabTriggersRef = useRef(new Map<string, HTMLButtonElement>())
  const focusFrame = useFocusFrame()
  const deleteMutation = useMutation({ mutationFn: deleteCloseSchedule })
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
  const calendarDays = useMemo(
    () => createCalendarDays(month, monthSchedules),
    [month, monthSchedules],
  )

  function focusKebabTrigger(id: string) {
    // 삭제된 카드의 버튼은 이미 사라졌을 수 있어 남아 있을 때만 되돌린다.
    focusFrame(() => kebabTriggersRef.current.get(id))
  }

  function handleDelete() {
    if (!deleteTargetId || deletingRef.current || deleteMutation.isPending) {
      return
    }

    deletingRef.current = true
    const targetId = deleteTargetId
    deleteMutation.mutate(
      { id: Number(targetId) },
      {
        onSuccess: async () => {
          queryClient.removeQueries({
            queryKey: ['close-schedules', targetId],
          })
          await queryClient.invalidateQueries({
            queryKey: ['close-schedules'],
          })
          deletingRef.current = false
          setDeleteTargetId(null)
          setToast({
            variant: 'success',
            message: '데이터 삭제에 성공했습니다',
          })
        },
        onError: () => {
          deletingRef.current = false
          setDeleteTargetId(null)
          setToast({ variant: 'error', message: '데이터 삭제에 실패했습니다' })
          focusKebabTrigger(targetId)
        },
      },
    )
  }

  function handleCancelDelete() {
    if (!deleteTargetId) return
    const targetId = deleteTargetId
    setDeleteTargetId(null)
    focusKebabTrigger(targetId)
  }

  if (isPending) {
    return (
      <Page>
        <Content>
          <CloseScheduleSkeleton weeks={calendarDays.length / 7} />
        </Content>
      </Page>
    )
  }

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
            {isError ? (
              <QueryStatus role="alert">
                휴관일을 불러오지 못했습니다. 다시 시도해 주세요.
              </QueryStatus>
            ) : monthSchedules.length > 0 ? (
              <CardList aria-label="휴관 일정 목록">
                {monthSchedules.map((schedule) => (
                  <CardItem key={schedule.id}>
                    <ScheduleCard
                      to={`/notices/guide/${schedule.id}`}
                      aria-label={`${schedule.title} 휴관 일정 상세`}
                    >
                      <CardDate>{formatScheduleRange(schedule)}</CardDate>
                      <CardTitle>{schedule.title}</CardTitle>
                    </ScheduleCard>
                    <CardKebab>
                      <KebabMenu
                        placement="below-trigger"
                        ariaLabel={`${schedule.title} 메뉴`}
                        open={openKebabId === schedule.id}
                        onOpenChange={(open) =>
                          setOpenKebabId(open ? schedule.id : null)
                        }
                        onTriggerRef={(node) => {
                          if (node) {
                            kebabTriggersRef.current.set(schedule.id, node)
                          } else {
                            kebabTriggersRef.current.delete(schedule.id)
                          }
                        }}
                        items={[
                          {
                            label: '수정',
                            onSelect: () =>
                              navigate(`/notices/guide/${schedule.id}/edit`),
                          },
                          {
                            label: '삭제',
                            tone: 'danger',
                            onSelect: () => setDeleteTargetId(schedule.id),
                          },
                        ]}
                      />
                    </CardKebab>
                  </CardItem>
                ))}
              </CardList>
            ) : (
              <EmptyState>아직 추가된 휴관일이 없습니다</EmptyState>
            )}
          </Aside>
        </MainGrid>
      </Content>

      {deleteTargetId && (
        <DeleteConfirmationDialog
          pending={deleteMutation.isPending}
          onCancel={handleCancelDelete}
          onConfirm={handleDelete}
        />
      )}

      {visibleToast && (
        <Toast
          variant={visibleToast.variant}
          message={visibleToast.message}
          onDismiss={() => {
            setToast(null)
            // 재방문·새로고침 때 다시 뜨지 않게 이동 state 를 비운다.
            if (createdToast) {
              navigate(location.pathname, { replace: true, state: null })
            }
          }}
        />
      )}
    </Page>
  )
}

function createCalendarDays(month: Date, schedules: CloseSchedule[]) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())
  // yot `1:6148`: 6주로 고정하지 않고 그 달이 걸친 주만 그린다.
  const lastDate = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate()
  const weekCount = Math.ceil((firstDay.getDay() + lastDate) / 7)

  return Array.from({ length: weekCount * 7 }, (_, index): CalendarDay => {
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

const QueryStatus = styled.p`
  margin: 0;
  padding: 24px 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSub};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
`

// Figma: 카드는 캘린더와 같은 높이(top 278)에서 시작하고 카드 간 간격은 16이다.
const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const CardItem = styled.div`
  position: relative;
`

// 케밥은 카드 오른쪽 40px, 세로 중앙(Figma 246:12915). 메뉴가 뒤따르는 카드 위에 그려지도록
// transform 대신 음수 margin 으로 가운데를 맞춘다(쌓임 맥락을 만들지 않는다).
const CardKebab = styled.div`
  position: absolute;
  top: 50%;
  right: 40px;
  margin-top: -26px;
`

const ScheduleCard = styled(Link)`
  display: flex;
  min-height: 88px;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 18px 124px 18px 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: #36363f;
  text-decoration: none;
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
