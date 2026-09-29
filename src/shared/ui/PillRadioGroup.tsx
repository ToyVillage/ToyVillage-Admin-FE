import { useId, type ReactNode } from 'react'
import styled from '@emotion/styled'
import { FormFieldLabel } from './FormFieldLabel'

export interface PillRadioOption {
  value: string
  label: string
  /** 라벨 앞 장식 기호(예: 성별 `♀`). 보조기기에는 숨기고 선택 시 흰색으로 바뀐다. */
  icon?: ReactNode
}

interface PillRadioGroupProps {
  legend: string
  required?: boolean
  name: string
  options: PillRadioOption[]
  /** 미선택은 null. */
  value: string | null
  onChange: (value: string) => void
  /** 카드 아래 오류 줄 id. 그룹의 `aria-describedby` 로 연결한다. */
  errorId?: string
}

// Figma `field / 분류`(127:9342) 분류군 pill · `field / 성별`(127:9376) 성별 pill.
// native radio 를 시각 pill 로 그려 방향키 선택과 폼 semantics 를 그대로 쓴다.
// 선택된 pill 을 다시 눌러도 해제되지 않는다(radio 기본 동작).
export function PillRadioGroup({
  legend,
  required,
  name,
  options,
  value,
  onChange,
  errorId,
}: PillRadioGroupProps) {
  const legendId = useId()

  return (
    <Group
      role="radiogroup"
      aria-labelledby={legendId}
      aria-required={required || undefined}
      aria-describedby={errorId}
    >
      <Legend id={legendId}>
        <FormFieldLabel required={required}>{legend}</FormFieldLabel>
      </Legend>
      <Pills>
        {options.map((option) => (
          <PillLabel key={option.value}>
            <RadioInput
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <Pill>
              {option.icon && (
                <PillIcon aria-hidden="true">{option.icon}</PillIcon>
              )}
              {option.label}
            </Pill>
          </PillLabel>
        ))}
      </Pills>
    </Group>
  )
}

const Group = styled.fieldset`
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
`

const Legend = styled.legend`
  display: flex;
  margin-bottom: 12px;
  padding: 0;
`

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const PillLabel = styled.label`
  position: relative;
  display: inline-flex;
  cursor: pointer;
`

// 투명한 radio 가 pill 전체를 덮어 클릭을 직접 받는다(NoticeForm 분류 pill 과 같은 방식).
const RadioInput = styled.input`
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
`

// Figma 는 테두리를 안쪽 stroke 로 그려 선택·미선택 크기가 같다(padding 14/32).
// CSS 에서는 테두리 1px 만큼 padding 을 줄이고, 선택 시 테두리를 투명하게 둔다.
const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 13px 31px;
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.choiceMuted};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;

  input:checked + & {
    border-color: transparent;
    background: ${({ theme }) => theme.colors.textStrong};
    color: ${({ theme }) => theme.colors.surface};
  }

  input:focus-visible + & {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const PillIcon = styled.span`
  display: inline-flex;
  font-weight: 400;

  input:checked + span > &,
  input:checked + span > & * {
    color: ${({ theme }) => theme.colors.surface};
  }
`
