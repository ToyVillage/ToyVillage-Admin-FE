import styled from '@emotion/styled'
import { individualSexLabels, individualSexSymbols } from '../model/labels'
import type { IndividualSex } from '../model/types'

interface IndividualSexBadgeProps {
  sex: IndividualSex
}

// Figma `individual / 성별 뱃지`(`161:11782`). 기호는 장식이고 라벨 텍스트로 값을 전달한다.
export function IndividualSexBadge({ sex }: IndividualSexBadgeProps) {
  return (
    <Badge $sex={sex}>
      <SexSymbol aria-hidden="true">{individualSexSymbols[sex]}</SexSymbol>
      {individualSexLabels[sex]}
    </Badge>
  )
}

const Badge = styled.span<{ $sex: IndividualSex }>`
  display: inline-flex;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 100px;
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
  ${({ theme, $sex }) => {
    if ($sex === 'MAN') {
      return `background: ${theme.colors.accentBg}; color: ${theme.colors.accent};`
    }
    if ($sex === 'WOMAN') {
      return `background: ${theme.colors.dangerBg}; color: ${theme.colors.danger};`
    }
    return `background: ${theme.colors.background}; color: ${theme.colors.textGuide};`
  }}
`

const SexSymbol = styled.span`
  font-weight: 400;
`
