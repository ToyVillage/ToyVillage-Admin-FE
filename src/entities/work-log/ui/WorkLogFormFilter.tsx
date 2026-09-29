import styled from '@emotion/styled'
import { SelectMenu, type SelectMenuOption } from '@/shared/ui'
import type { WorkLogForm } from '../model/types'

interface WorkLogFormFilterProps {
  /** 고른 양식 id. `null` 이면 `전체 양식` 이다. */
  value: string | null
  forms: WorkLogForm[]
  /**
   * 선택지를 다 받았는지. 받는 중이거나 받지 못했으면 고른 양식을 확인할 수 없으므로
   * 트리거를 비워 둔다(`전체 양식` 으로 잘못 보이지 않게).
   */
  optionsConfirmed?: boolean
  onChange: (formId: string | null) => void
}

const allFormsValue = 'all'

// Figma `양식 필터`(2432:24334). `양식 필터` 라벨 + 폭 260 드롭다운.
// 첫 항목 `전체 양식` 아래로 양식 이름이 목록 순서대로 놓인다.
export function WorkLogFormFilter({
  value,
  forms,
  optionsConfirmed = true,
  onChange,
}: WorkLogFormFilterProps) {
  const options: SelectMenuOption[] = [
    { value: allFormsValue, label: '전체 양식' },
    ...forms.map((form) => ({ value: form.id, label: form.name })),
  ]
  // 없는 양식 id(지워진 양식 등)는 `전체 양식` 으로 보인다.
  // 선택지를 확인하지 못했으면 id 를 그대로 두고 트리거를 비운다(placeholder).
  const pendingSelection = !optionsConfirmed && value !== null
  const selected =
    pendingSelection || forms.some((form) => form.id === value)
      ? (value ?? allFormsValue)
      : allFormsValue

  return (
    <Filter>
      <Label>양식 필터</Label>
      <SelectMenu
        value={selected}
        options={options}
        onChange={(next) => onChange(next === allFormsValue ? null : next)}
        ariaLabel="양식 필터"
        width={260}
        openBorder
        placeholder={pendingSelection ? '' : undefined}
      />
    </Filter>
  )
}

const Filter = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`
