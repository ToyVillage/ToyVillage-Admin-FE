import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import checkboxMixedIcon from './assets/checkbox-mixed.svg'
import checkboxOnIcon from './assets/checkbox-on.svg'

interface ExportCheckboxProps {
  checked: boolean
  /** 일부만 선택된 상태(가로줄). */
  indeterminate?: boolean
  onChange: () => void
  labelledBy?: string
  describedBy?: string
}

// Figma `checkbox / on`·`off`·`mixed`(28px). native checkbox 의 모양만 바꾼다.
export function ExportCheckbox({
  checked,
  indeterminate = false,
  onChange,
  labelledBy,
  describedBy,
}: ExportCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  // indeterminate 는 HTML 속성이 없어 DOM 프로퍼티로만 정할 수 있다.
  // 클릭하면 브라우저가 지우므로 렌더할 때마다 다시 맞춘다.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  })

  return (
    <Input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    />
  )
}

const Input = styled.input`
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  margin: 0;
  border: 2px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 6px;
  appearance: none;
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;

  &:checked,
  &:indeterminate {
    border: 0;
    background: url("${checkboxOnIcon}") center / 28px no-repeat;
  }

  &:indeterminate {
    background-image: url("${checkboxMixedIcon}");
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
