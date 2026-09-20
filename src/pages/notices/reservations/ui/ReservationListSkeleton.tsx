import styled from '@emotion/styled'
import {
  PageHeaderSkeleton,
  Skeleton,
  SkeletonStatus,
  TableSkeleton,
} from '@/shared/ui'

const STATUS_CARD_COUNT = 3

// Figma `단체예약 목록 (스켈레톤)`(2021:18102).
export function ReservationListSkeleton() {
  return (
    <SkeletonStatus>
      <PageHeaderSkeleton subtitleWidth={500} />
      <StatusRow>
        <Cards>
          {Array.from({ length: STATUS_CARD_COUNT }, (_, index) => (
            <Card key={index}>
              <LabelLine>
                <Skeleton width={100} height={18} />
              </LabelLine>
              <CountLine>
                <Skeleton width={80} height={32} />
              </CountLine>
            </Card>
          ))}
        </Cards>
        <Skeleton width={206} height={52} radius={53} />
      </StatusRow>
      <TableSkeleton
        columns={[
          { width: 180, bar: 122, barHeight: 18 },
          { width: 180, bar: 120, barHeight: 18 },
          { width: 180, bar: 70, barHeight: 18 },
          { bar: 190, barHeight: 18, headerBar: 70 },
          { width: 200, bar: 46, barHeight: 18 },
        ]}
        rows={3}
        search
        pagination
      />
    </SkeletonStatus>
  )
}

// `ReservationStatusCards` 치수를 따른다(240 폭 · 12/62 여백 · 라벨-숫자 간격 32).
const StatusRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-top: 24px;
`

const Cards = styled.div`
  display: flex;
  gap: 21px;
`

const Card = styled.div`
  display: flex;
  width: 240px;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 12px 62px;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.surface};
`

const LabelLine = styled.div`
  display: flex;
  height: 26px;
  align-items: center;
`

const CountLine = styled.div`
  display: flex;
  height: 48px;
  align-items: center;
`
