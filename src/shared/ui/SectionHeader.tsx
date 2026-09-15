import type { ReactNode } from 'react'
import styled from '@emotion/styled'

interface SectionHeaderProps {
  title: string
  // 제목 옆에 `N건` 으로 붙는 건수. 생략하면 제목만 표시한다.
  count?: number
  // 건수 뒤에 붙는 단위. 생략하면 `건` 이다(개체 수는 `마리`).
  unit?: string
  // 우측 버튼. 넘기면 `with button` variant(127:9297)가 된다.
  action?: ReactNode
}

// Figma 공용 `section header`(127:9419)의 `plain` variant — 제목 + 건수.
export function SectionHeader({
  title,
  count,
  unit = '건',
  action,
}: SectionHeaderProps) {
  return (
    <Header>
      <Title>{title}</Title>
      {count != null && (
        <Count>
          {count}
          {unit}
        </Count>
      )}
      {action && <Action>{action}</Action>}
    </Header>
  )
}

const Header = styled.div`
  display: flex;
  min-height: 56px;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
`

const Count = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

// Figma 의 `spacer` 자리 — 버튼을 행 오른쪽 끝으로 민다.
const Action = styled.div`
  display: flex;
  margin-left: auto;
`
