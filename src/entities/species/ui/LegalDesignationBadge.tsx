import styled from '@emotion/styled'

interface LegalDesignationBadgeProps {
  label: string
}

// 종 상세 프로필 카드의 법정지정분류 표시 뱃지(Figma `1191:14926`). 폼의 추가·제거 pill 과는 다르다.
export function LegalDesignationBadge({ label }: LegalDesignationBadgeProps) {
  return <Badge>{label}</Badge>
}

const Badge = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding: 6px 16px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.warningBg};
  color: ${({ theme }) => theme.colors.warningText};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`
