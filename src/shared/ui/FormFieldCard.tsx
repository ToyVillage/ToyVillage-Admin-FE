import { useId, type ReactNode } from 'react'
import styled from '@emotion/styled'
import { FormFieldLabel } from './FormFieldLabel'

interface FormFieldCardProps {
  /** 생략하면 라벨 없이 카드만 그린다(영문명·학명처럼 안에서 FormFieldLabel 을 여럿 쓰는 경우). */
  label?: string
  required?: boolean
  /** 라벨이 가리킬 입력 id. 생략하면 라벨은 텍스트로 그린다. */
  htmlFor?: string
  /** 라벨 요소 id. `role="group"` 의 `aria-labelledby` 연결에 쓴다. */
  labelId?: string
  /** 라벨 아래 안내 한 줄. 입력의 `aria-describedby` 로 `hintId` 를 연결한다. */
  hint?: string
  hintId?: string
  /** 카드 바로 아래 인라인 오류 줄 문구. */
  error?: string
  /** 오류 줄 id. 입력의 `aria-describedby` 로 연결한다. */
  errorId?: string
  labelSize?: 20 | 32
  children?: ReactNode
}

// Figma 개체관리 `field / *` 카드(127:9308·127:9323·127:9342·127:9354·127:9358) 공통 골격과
// 인라인 오류 줄(107:8777·107:8848). 오류 줄은 제출 시 검증 결과로만 바뀌고
// (reservation-form 패턴) `data-field-error` 로 첫 오류 스크롤 대상이 된다.
export function FormFieldCard({
  label,
  required,
  htmlFor,
  labelId,
  hint,
  hintId,
  error,
  errorId,
  labelSize = 20,
  children,
}: FormFieldCardProps) {
  const fallbackHintId = useId()

  return (
    <Field>
      <Card data-has-hint={hint ? 'true' : undefined}>
        {(label || hint) && (
          <Heading>
            {label && (
              <FormFieldLabel
                htmlFor={htmlFor}
                id={labelId}
                required={required}
                size={labelSize}
              >
                {label}
              </FormFieldLabel>
            )}
            {hint && <Hint id={hintId ?? fallbackHintId}>{hint}</Hint>}
          </Heading>
        )}
        {children}
      </Card>
      {error && (
        <ErrorRow role="alert" id={errorId} data-field-error="true">
          <ErrorMark aria-hidden="true">!</ErrorMark>
          {error}
        </ErrorRow>
      )}
    </Field>
  )
}

// 오류 줄은 카드와 폼 간격(16px) 그대로 떨어진다.
const Field = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
`

const Card = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
  padding: 28px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  &[data-has-hint='true'] {
    gap: 20px;
  }

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`

const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.optionMuted};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const ErrorRow = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding-left: 32px;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;

  @media (max-width: 980px) {
    padding-left: 24px;
  }
`

const ErrorMark = styled.span`
  display: inline-flex;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
`
