import styled from '@emotion/styled'
import { PageHeaderSkeleton, Skeleton, SkeletonStatus } from '@/shared/ui'

const DAYS_IN_WEEK = 7
const CARD_TITLE_WIDTHS = [237, 103, 108, 90, 108]

interface CloseScheduleSkeletonProps {
  /** 표시할 달이 걸친 주 수. 실제 달력과 같은 높이를 맞춘다. */
  weeks: number
}

// Figma `휴관일 관리 (스켈레톤)`(1:9679). 달력·카드 치수는 `NoticeGuidePage` 를 따른다.
export function CloseScheduleSkeleton({ weeks }: CloseScheduleSkeletonProps) {
  return (
    <SkeletonStatus>
      <PageHeaderSkeleton action />
      <MainGrid>
        <CalendarSection>
          <CalendarHeader>
            <Skeleton width={26} height={26} />
            <Skeleton width={180} height={26} />
            <Skeleton width={26} height={26} />
          </CalendarHeader>
          <WeekHeader>
            {Array.from({ length: DAYS_IN_WEEK }, (_, index) => (
              <WeekCell key={index}>
                <Skeleton width={45} height={18} />
              </WeekCell>
            ))}
          </WeekHeader>
          <CalendarGrid>
            {Array.from({ length: DAYS_IN_WEEK * weeks }, (_, index) => (
              <DayCell key={index}>
                <Skeleton width={40} height={16} />
              </DayCell>
            ))}
          </CalendarGrid>
        </CalendarSection>

        <CardList>
          {CARD_TITLE_WIDTHS.map((width, index) => (
            <Card key={index}>
              <Skeleton width={width} height={25} />
              <Skeleton width={index === 0 ? 201 : 92} height={18} />
            </Card>
          ))}
        </CardList>
      </MainGrid>
    </SkeletonStatus>
  )
}

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(520px, 756px) minmax(360px, 532px);
  gap: 24px;
  margin-top: 28px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const CalendarSection = styled.div`
  overflow: hidden;
  border-radius: 20px;
`

const CalendarHeader = styled.div`
  display: flex;
  min-height: 80px;
  align-items: center;
  justify-content: space-between;
  padding: 17px 45px;
  background: ${({ theme }) => theme.colors.surface};
`

const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: ${({ theme }) => theme.colors.tableHeaderStrong};
`

const WeekCell = styled.div`
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
`

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  background: ${({ theme }) => theme.colors.surface};
`

const DayCell = styled.div`
  min-height: 112px;
  padding: 16px 12px;

  @media (min-width: 1280px) {
    min-height: 152px;
  }
`

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Card = styled.div`
  display: flex;
  min-height: 103px;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  padding: 18px 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`
