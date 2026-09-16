import styled from '@emotion/styled'

interface CategoryTabsProps {
  categories: string[]
  active: string
  onSelect: (category: string) => void
  /** 고를 수 없는 탭. 서버가 그 필터를 지원하지 않을 때 쓴다. */
  disabled?: string[]
}

export function CategoryTabs({
  categories,
  active,
  onSelect,
  disabled = [],
}: CategoryTabsProps) {
  return (
    <Tabs>
      {categories.map((c) => {
        const isDisabled = disabled.includes(c)

        return (
          <Tab
            key={c}
            type="button"
            $active={c === active}
            $disabled={isDisabled}
            aria-pressed={c === active}
            aria-disabled={isDisabled || undefined}
            onClick={() => {
              if (isDisabled) return
              onSelect(c)
            }}
          >
            {c}
          </Tab>
        )
      })}
    </Tabs>
  )
}

const Tabs = styled.div`
  display: flex;
  width: 100%;
  margin-top: 32px;
`

const Tab = styled.button<{ $active: boolean; $disabled?: boolean }>`
  border: 0;
  border-bottom: ${({ $active, theme }) =>
    $active ? `2px solid ${theme.colors.text}` : '2px solid transparent'};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
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
