import { forwardRef } from 'react'
import styled from '@emotion/styled'
import { taskPriorityLabels, type TaskPriority } from '@/entities/task'

interface TaskPriorityFieldProps {
  value: TaskPriority | null
  onChange: (value: TaskPriority) => void
}

const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW']

// Figma `priority` 카드(yot 1:3694, 868×194). 252×68 pill 3개이며 단일 선택이고 해제는 없다.
// 선택색만 Figma(`#DDDDE3` 회색 채움)와 다르다 — 담당자 체크박스와 같은 accent 로 통일한다
// (2026-09-07 개발자 결정, task-create.spec.md 참조).
export const TaskPriorityField = forwardRef<
  HTMLInputElement,
  TaskPriorityFieldProps
>(function TaskPriorityField({ value, onChange }, ref) {
  return (
    <Fieldset>
      <Legend>우선순위를 선택해주세요</Legend>
      <Options>
        {priorities.map((priority, index) => (
          <Option key={priority} $selected={priority === value}>
            <RadioInput
              ref={index === 0 ? ref : undefined}
              type="radio"
              name="task-priority"
              value={priority}
              checked={priority === value}
              onChange={() => onChange(priority)}
            />
            {taskPriorityLabels[priority]}
          </Option>
        ))}
      </Options>
    </Fieldset>
  )
})

// fieldset 은 block 으로 둔다. flex 로 두면 legend 가 padding 을 무시하고
// 카드 최상단(border box)에 붙는다 — 아래 Legend 의 float 과 짝을 이룬다.
const Fieldset = styled.fieldset`
  display: block;
  min-width: 0;
  flex: 1 1 868px;
  margin: 0;
  padding: 40px;
  border: 0;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    flex-basis: auto;
    padding: 24px;
  }
`

// float + width 100% 로 legend 를 일반 흐름에 되돌려 카드 padding 안에 들어오게 한다.
const Legend = styled.legend`
  float: left;
  width: 100%;
  margin: 0 0 20px;
  padding: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
`

const Options = styled.div`
  display: flex;
  clear: both;
  gap: 16px;

  @media (max-width: 980px) {
    gap: 8px;
  }
`

const Option = styled.label<{ $selected: boolean }>`
  position: relative;
  display: flex;
  width: 252px;
  min-width: 0;
  height: 68px;
  align-items: center;
  justify-content: center;
  border-radius: 800px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.accentBg : theme.colors.background};
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.accent : theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  cursor: pointer;

  &:has(input:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  @media (max-width: 980px) {
    width: auto;
    flex: 1;
  }
`

// 시각적으로는 숨기되 pill 전체를 클릭 대상으로 삼아 label 이 클릭을 가로채지 않게 한다.
const RadioInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  appearance: none;
  border: 0;
  border-radius: inherit;
  background: transparent;
  cursor: pointer;
`
