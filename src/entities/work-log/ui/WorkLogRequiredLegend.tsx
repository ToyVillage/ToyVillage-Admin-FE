import styled from '@emotion/styled'

// Figma `필수 범례`(2783:25009) — 시트 헤더의 `*` 가 무엇인지 알려주는 범례. 항상 보인다.
export function WorkLogRequiredLegend({ className }: { className?: string }) {
  return (
    <Legend className={className}>
      <Mark aria-hidden="true">*</Mark>
      필수 입력 항목
    </Legend>
  )
}

const Legend = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
  line-height: normal;
  white-space: nowrap;
`

const Mark = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`
