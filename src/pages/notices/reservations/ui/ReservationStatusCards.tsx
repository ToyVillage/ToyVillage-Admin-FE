import styled from '@emotion/styled'
import {
  reservationStatusLabel,
  reservationStatuses,
  type ReservationStatus,
} from '@/entities/reservation'

interface ReservationStatusCardsProps {
  counts: Record<ReservationStatus, number>
  active: ReservationStatus
  onSelect: (status: ReservationStatus) => void
}

// 상태별 카운트 카드 + 필터 탭. 활성 카드는 blue-background(accentBg) 강조.
export function ReservationStatusCards({
  counts,
  active,
  onSelect,
}: ReservationStatusCardsProps) {
  return (
    <Cards role="group" aria-label="상태별 예약 수">
      {reservationStatuses.map((status) => (
        <Card
          key={status}
          type="button"
          $active={status === active}
          aria-pressed={status === active}
          onClick={() => onSelect(status)}
        >
          <Label $active={status === active}>
            {reservationStatusLabel[status]}
          </Label>
          <Count $active={status === active}>{counts[status]}</Count>
        </Card>
      ))}
    </Cards>
  )
}

const Cards = styled.div`
  display: flex;
  gap: 21px;

  @media (max-width: 980px) {
    flex-wrap: wrap;
  }
`

const Card = styled.button<{ $active: boolean }>`
  display: flex;
  width: 240px;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 12px 62px;
  border: 0;
  border-radius: 24px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accentBg : theme.colors.surface};
  cursor: pointer;
  font: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }

  @media (max-width: 980px) {
    padding: 12px 32px;
  }
`

const Label = styled.span<{ $active: boolean }>`
  color: ${({ theme, $active }) =>
    $active ? theme.colors.textGuide : theme.colors.textMuted};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  text-align: center;
`

const Count = styled.span<{ $active: boolean }>`
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
`
