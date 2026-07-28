import styled from '@emotion/styled'
import { Link } from 'react-router-dom'

interface ReservationBackLinkProps {
  className?: string
}

// 예약 상세 → 목록 복귀 링크(Figma 2015:989). GuideBackLink와 동일한 패턴이나
// 예약 목록으로 이동하고 gray/60 24 SemiBold 라벨을 쓴다.
export function ReservationBackLink({ className }: ReservationBackLinkProps) {
  return (
    <BackLink className={className} to="/notices/reservations">
      <BackIcon viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 4-8 8 8 8" />
      </BackIcon>
      뒤로가기
    </BackLink>
  )
}

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 4px;
  }
`

const BackIcon = styled.svg`
  width: 36px;
  height: 36px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.5;
`
