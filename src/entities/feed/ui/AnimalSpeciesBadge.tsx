import styled from '@emotion/styled'
import type { AnimalSpecies } from '../model/types'

interface AnimalSpeciesBadgeProps {
  species: AnimalSpecies
}

// Figma `individual / 성별 뱃지`(161:11782) 규격의 pill. 개체 분류를 blue 배지로 표시한다.
export function AnimalSpeciesBadge({ species }: AnimalSpeciesBadgeProps) {
  return <Badge>{species}</Badge>
}

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
