import styled from '@emotion/styled'
import {
  individualSexes,
  individualSexLabels,
  individualSexSymbols,
  type IndividualSex,
} from '@/entities/individual'
import { FormFieldCard, PillRadioGroup } from '@/shared/ui'

const errorId = 'individual-sex-error'

interface IndividualSexFieldProps {
  value: IndividualSex | null
  onChange: (value: IndividualSex) => void
  error?: string
}

// Figma `field / 성별`(127:9376). 기호(♀♂?)는 장식이고 선택 시 흰색으로 바뀐다(PillRadioGroup).
export function IndividualSexField({
  value,
  onChange,
  error,
}: IndividualSexFieldProps) {
  const options = individualSexes.map((sex) => ({
    value: sex,
    label: individualSexLabels[sex],
    icon: <SexSymbol data-sex={sex}>{individualSexSymbols[sex]}</SexSymbol>,
  }))

  function handleChange(nextValue: string) {
    const sex = individualSexes.find((candidate) => candidate === nextValue)
    if (sex) onChange(sex)
  }

  return (
    <FormFieldCard error={error} errorId={errorId}>
      <PillRadioGroup
        legend="성별"
        required
        name="individual-sex"
        options={options}
        value={value}
        onChange={handleChange}
        errorId={error ? errorId : undefined}
      />
    </FormFieldCard>
  )
}

// Figma 기호 색: ♀ danger / ♂ accent / ? textGuide.
const SexSymbol = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};

  &[data-sex='FEMALE'] {
    color: ${({ theme }) => theme.colors.danger};
  }

  &[data-sex='MALE'] {
    color: ${({ theme }) => theme.colors.accent};
  }
`
