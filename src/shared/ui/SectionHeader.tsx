import styled from '@emotion/styled'

interface SectionHeaderProps {
  title: string
  // 제목 옆에 `N건` 으로 붙는 건수. 생략하면 제목만 표시한다.
  count?: number
}

// Figma 공용 `section header`(127:9419)의 `plain` variant — 제목 + 건수.
export function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <Header>
      <Title>{title}</Title>
      {count != null && <Count>{count}건</Count>}
    </Header>
  )
}

const Header = styled.div`
  display: flex;
  min-height: 56px;
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
