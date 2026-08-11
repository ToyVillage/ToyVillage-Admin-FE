import { forwardRef } from 'react'
import styled from '@emotion/styled'
import { taskPriorityLabels, type TaskPriority } from '@/entities/task'

interface TaskPriorityFieldProps {
  value: TaskPriority | null
  onChange: (value: TaskPriority) => void
}

const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW']

// Figma "Frame 406/393" — 우선순위 3분할 pill. 단일 선택이며 해제는 없다.
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

const Fieldset = styled.fieldset`
  display: flex;
  width: min(100%, 815px);
  flex-direction: column;
  gap: 20px;
  margin: 0;
  padding: 0;
  border: 0;
`

const Legend = styled.legend`
  padding: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
`

const Options = styled.div`
  display: flex;
  gap: 24px;
`

const Option = styled.label<{ $selected: boolean }>`
  display: flex;
  min-width: 0;
  height: 88px;
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 800px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.accentBg : theme.colors.surface};
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.accent : theme.colors.text};
  font-size: 32px;
  font-weight: 500;
  cursor: pointer;

  &:has(input:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const RadioInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
`
