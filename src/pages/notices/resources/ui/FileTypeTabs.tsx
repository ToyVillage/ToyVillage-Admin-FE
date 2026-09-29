import styled from '@emotion/styled'

interface FileTypeTabsProps {
  types: readonly string[]
  active: string
  onSelect: (type: string) => void
}

export function FileTypeTabs({ types, active, onSelect }: FileTypeTabsProps) {
  return (
    <Tabs>
      {types.map((t) => (
        <Tab
          key={t}
          type="button"
          $active={t === active}
          aria-pressed={t === active}
          onClick={() => onSelect(t)}
        >
          {t}
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
    $active ? `4px solid ${theme.colors.text}` : '4px solid transparent'};
  cursor: pointer;
  padding: 10px 40px;
  font-weight: 600;
  font-size: 22px;
  line-height: 1.2;
  background: transparent;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.text : theme.colors.textMuted};

  &[aria-pressed='false'] {
    font-size: 20px;
    font-weight: 500;
  }
`
