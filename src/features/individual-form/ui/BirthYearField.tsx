import styled from '@emotion/styled'
import { FormFieldCard } from '@/shared/ui'

const inputId = 'individual-birth-year'
const errorId = 'individual-birth-year-error'

interface BirthYearFieldProps {
  /** 숫자 0~4자리 원문 */
  value: string
  onChange: (value: string) => void
  error?: string
}

// Figma `field / 출생연도`(127:9384). 숫자만 최대 4자리 받고 접미사 `년` 은 항상 보인다
// (reservation-form `digits` 서식 승계).
export function BirthYearField({
  value,
  onChange,
  error,
}: BirthYearFieldProps) {
  return (
    <FormFieldCard
      label="출생연도"
      required
      htmlFor={inputId}
      error={error}
      errorId={errorId}
    >
      <InputBox>
        <Input
          id={inputId}
          inputMode="numeric"
          maxLength={4}
          aria-required="true"
          aria-describedby={error ? errorId : undefined}
          value={value}
          placeholder="0000"
          autoComplete="off"
          onChange={(event) =>
            onChange(event.target.value.replace(/\D/g, '').slice(0, 4))
          }
        />
        <Suffix aria-hidden="true">년</Suffix>
      </InputBox>
    </FormFieldCard>
  )
}

const InputBox = styled.div`
  display: flex;
  height: 66px;
  align-items: center;
  gap: 10px;
  padding: 0 24px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`

// 텍스트 입력에는 포커스 링을 그리지 않는다(task-create 2026-09-08 결정).
const Input = styled.input`
  width: 100%;
  min-width: 0;
  height: 100%;
  flex: 1;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 24px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
    opacity: 1;
  }
`

const Suffix = styled.span`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`
