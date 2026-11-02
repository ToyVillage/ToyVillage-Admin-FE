import styled from '@emotion/styled'
import { feedFloorLabels } from '../model/types'
import type { FeedFloor } from '../model/types'

interface FeedFloorBadgeProps {
  floor: FeedFloor
}

// Figma `individual detail` 의 층 뱃지(`4층`·`5층`). 성별 뱃지(`161:11782`)와 같은 파란 pill 이다.
export function FeedFloorBadge({ floor }: FeedFloorBadgeProps) {
  return <Badge>{feedFloorLabels[floor]}</Badge>
}

const Badge = styled.span`
  display: inline-flex;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  padding: 6px 16px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
`
