import styled from '@emotion/styled'

export type ActivityTab = 'feed' | 'observation' | 'work-log'

interface ActivityTypeTabsProps {
  value: ActivityTab
  onChange: (tab: ActivityTab) => void
}

const tabs: { value: ActivityTab; label: string }[] = [
  { value: 'feed', label: '먹이 급여' },
  { value: 'observation', label: '관찰일지' },
  { value: 'work-log', label: '업무일지' },
]

// Figma `유형 탭`(3039:25280) — pill 3개. 선택된 탭만 진한 배경이다.
export function ActivityTypeTabs({ value, onChange }: ActivityTypeTabsProps) {
  return (
    <Tabs role="group" aria-label="기록 유형">
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          type="button"
          aria-pressed={tab.value === value}
          $active={tab.value === value}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </Tab>
      ))}
    </Tabs>
  )
}

const Tabs = styled.div`
  display: flex;
  gap: 12px;
`

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.textStrong : theme.colors.tableHeaderStrong};
  border-radius: 100px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.textStrong : theme.colors.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.surface : theme.colors.textValue};
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
