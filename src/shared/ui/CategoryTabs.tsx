import styled from '@emotion/styled'

interface CategoryTabsProps {
  categories: string[]
  active: string
  onSelect: (category: string) => void
}

export function CategoryTabs({
  categories,
  active,
  onSelect,
}: CategoryTabsProps) {
  return (
    <Tabs>
      {categories.map((c) => (
        <Tab
          key={c}
          type="button"
          $active={c === active}
          aria-pressed={c === active}
          onClick={() => onSelect(c)}
        >
          {c}
        </Tab>
      ))}
    </Tabs>
  )
}

const Tabs = styled.div`
  display: flex;
  width: 100%;
  margin-top: 32px;
`

const Tab = styled.button<{ $active: boolean }>`
  border: 0;
  border-bottom: ${({ $active, theme }) =>
    $active ? `2px solid ${theme.colors.text}` : '2px solid transparent'};
  cursor: pointer;
  padding: 10px 40px;
  font-weight: 600;
  font-size: 22px;
  /* Figma 탭바 높이 46 = padding 10 + 라인 24 + padding 10 + 하단선 2 */
  line-height: 24px;
  background: transparent;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.text : theme.colors.textGuide};

  &[aria-pressed='false'] {
    font-weight: 500;
  }
`
