import styled from '@emotion/styled'
import {
  clampWorkLogDate,
  daysInMonth,
  todayWorkLogDate,
  workLogYearSpan,
  type WorkLogDate,
} from '@/entities/work-log'
import { SelectMenu, type SelectMenuOption } from '@/shared/ui'

interface WorkLogDateFilterProps {
  value: WorkLogDate
  onChange: (value: WorkLogDate) => void
}

// Figma `1:3422`(Frame 460). `조회날짜` 라벨 + 년/월/일 셀렉트 3개.
export function WorkLogDateFilter({ value, onChange }: WorkLogDateFilterProps) {
  const currentYear = todayWorkLogDate().year
  const yearOptions = buildOptions(
    Array.from({ length: workLogYearSpan }, (_, index) => currentYear - index),
    (year) => `${year}년`,
  )
  const monthOptions = buildOptions(
    Array.from({ length: 12 }, (_, index) => index + 1),
    (month) => `${pad(month)}월`,
  )
  const dayOptions = buildOptions(
    Array.from(
      { length: daysInMonth(value.year, value.month) },
      (_, index) => index + 1,
    ),
    (day) => `${pad(day)}일`,
  )

  return (
    <Filter>
      <Label>조회날짜</Label>
      <SelectMenu
        value={String(value.year)}
        options={yearOptions}
        onChange={(year) =>
          onChange(clampWorkLogDate({ ...value, year: Number(year) }))
        }
        ariaLabel="조회 연도"
        width={186}
      />
      <SelectMenu
        value={String(value.month)}
        options={monthOptions}
        onChange={(month) =>
          onChange(clampWorkLogDate({ ...value, month: Number(month) }))
        }
        ariaLabel="조회 월"
        width={154}
      />
      <SelectMenu
        value={String(value.day)}
        options={dayOptions}
        onChange={(day) => onChange({ ...value, day: Number(day) })}
        ariaLabel="조회 일"
        width={156}
      />
    </Filter>
  )
}

function buildOptions(
  values: number[],
  toLabel: (value: number) => string,
): SelectMenuOption[] {
  return values.map((value) => ({
    value: String(value),
    label: toLabel(value),
  }))
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const Filter = styled.div`
  display: flex;
  margin-top: 32px;
  align-items: center;
  gap: 24px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`
