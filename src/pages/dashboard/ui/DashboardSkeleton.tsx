import styled from '@emotion/styled'
import { Skeleton, SkeletonStatus } from '@/shared/ui'

const KPI_CARDS = 4
const DAYS_IN_WEEK = 7
const CALENDAR_WEEKS = 6
const HOLIDAY_ROWS = 3
const DONUT_LEGEND_ROWS = 3
const LIST_CARDS = [
  [112, 90],
  [128, 86],
  [128, 64],
  [110, 90],
]
const LIST_ROWS = 3

// Figma `대시보드 (스켈레톤)`(2021:19440). 카드 치수는 `DashboardPage` 와 dashboard 카드들을 따른다.
export function DashboardSkeleton() {
  return (
    <SkeletonStatus>
      <Header>
        <TitleLine>
          <Skeleton width={192} height={48} />
        </TitleLine>
        <ChipSlot>
          <Skeleton width={343} height={48} />
        </ChipSlot>
      </Header>

      <KpiGrid>
        {Array.from({ length: KPI_CARDS }, (_, index) => (
          <KpiCard key={index}>
            <KpiText>
              <Skeleton width={30} height={48} radius={24} />
              <Skeleton width={110} height={18} />
            </KpiText>
            <Skeleton width={28} height={28} />
          </KpiCard>
        ))}
      </KpiGrid>

      <WideRow>
        <TallCard>
          <CardHeader>
            <Skeleton width={110} height={24} />
            <Skeleton width={90} height={16} />
          </CardHeader>
          <HolidayBody>
            <MiniCalendar>
              <Skeleton width={90} height={20} />
              <CalendarGrid>
                {Array.from(
                  { length: DAYS_IN_WEEK * CALENDAR_WEEKS },
                  (_, index) => (
                    <CalendarCell key={index}>
                      <Skeleton width={16} height={12} />
                    </CalendarCell>
                  ),
                )}
              </CalendarGrid>
            </MiniCalendar>
            <HolidayList>
              {Array.from({ length: HOLIDAY_ROWS }, (_, index) => (
                <HolidayRow key={index}>
                  <Accent />
                  <HolidayText>
                    <Skeleton width={index === 1 ? 180 : 80} height={18} />
                    <Skeleton width={index === 1 ? 140 : 70} height={14} />
                  </HolidayText>
                </HolidayRow>
              ))}
            </HolidayList>
          </HolidayBody>
        </TallCard>

        <TallCard>
          <CardHeader>
            <Skeleton width={90} height={24} />
            <Skeleton width={90} height={16} />
          </CardHeader>
          <DonutBody>
            <Skeleton width={168} height={168} radius={20} />
            <Legend>
              {Array.from({ length: DONUT_LEGEND_ROWS }, (_, index) => (
                <LegendRow key={index}>
                  <Skeleton width={80} height={40} />
                  <Skeleton width={40} height={18} />
                </LegendRow>
              ))}
            </Legend>
          </DonutBody>
        </TallCard>
      </WideRow>

      <HalfRow>
        {LIST_CARDS.map(([titleWidth, rowWidth], cardIndex) => (
          <ListCard key={cardIndex}>
            <CardHeader>
              <Skeleton width={titleWidth} height={24} />
              <Skeleton width={90} height={16} />
            </CardHeader>
            {Array.from({ length: LIST_ROWS }, (_, rowIndex) => (
              <ListRow key={rowIndex}>
                <Skeleton
                  width={rowWidth * (rowIndex === 0 ? 2 : 1)}
                  height={18}
                />
                <Skeleton width={80} height={16} />
              </ListRow>
            ))}
          </ListCard>
        ))}
      </HalfRow>
    </SkeletonStatus>
  )
}

const Header = styled.div`
  display: flex;
  min-height: 120px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 980px) {
    min-height: 0;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
`

const TitleLine = styled.div`
  display: flex;
  height: 73px;
  align-items: center;
`

const ChipSlot = styled.div`
  margin-top: 12px;

  @media (max-width: 980px) {
    margin-top: 0;
  }
`

const KpiGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const KpiCard = styled.div`
  display: flex;
  min-height: 150px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const KpiText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const WideRow = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 860fr) minmax(0, 440fr);
  margin-top: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const HalfRow = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const sectionCard = `
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 28px 32px 16px;
  border-radius: 20px;
`

const TallCard = styled.div`
  ${sectionCard}
  min-height: 420px;
  background: ${({ theme }) => theme.colors.surface};
`

const ListCard = styled.div`
  ${sectionCard}
  min-height: 272px;
  background: ${({ theme }) => theme.colors.surface};
`

const CardHeader = styled.div`
  display: flex;
  height: 44px;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dividerFaint};
`

const HolidayBody = styled.div`
  display: flex;
  flex: 1;
  gap: 40px;
  padding-top: 20px;

  @media (max-width: 760px) {
    flex-direction: column;
    gap: 0;
  }
`

const MiniCalendar = styled.div`
  display: flex;
  width: 100%;
  max-width: 406px;
  flex-direction: column;
  gap: 20px;
`

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
`

const CalendarCell = styled.div`
  display: flex;
  height: 40px;
  align-items: center;
  justify-content: center;
`

const HolidayList = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding-top: 40px;
`

const HolidayRow = styled.div`
  display: flex;
  height: 76px;
  align-items: center;
  gap: 14px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.dividerFaint};
  }
`

const Accent = styled.span`
  width: 4px;
  height: 40px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.skeleton};
`

const HolidayText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const DonutBody = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  gap: 32px;
`

const Legend = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
`

const LegendRow = styled.div`
  display: flex;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const ListRow = styled.div`
  display: flex;
  height: 60px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.dividerFaint};
  }
`
