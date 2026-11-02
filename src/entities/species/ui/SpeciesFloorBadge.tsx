import styled from '@emotion/styled'
import { speciesFloorLabels } from '../model/labels'
import type { SpeciesFloor } from '../model/types'

interface SpeciesFloorBadgeProps {
  floor: SpeciesFloor
}

// 종 상세 프로필 카드 제목 옆 층 뱃지(Figma `badge / 층` 3133:26263).
export function SpeciesFloorBadge({ floor }: SpeciesFloorBadgeProps) {
  return <Badge>{speciesFloorLabels[floor]}</Badge>
}

const Badge = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding: 6px 14px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
`
