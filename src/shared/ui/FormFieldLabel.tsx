import type { ReactNode } from 'react'
import styled from '@emotion/styled'

interface FormFieldLabelProps {
  /** 지정하면 `<label for>` 로, 생략하면 텍스트(`span`)로 그린다. */
  htmlFor?: string
  id?: string
  required?: boolean
  /** 20 = 종·개체 폼 필드(기본), 32 = 관찰 수정 카드. */
  size?: 20 | 32
  children: ReactNode
}

// Figma 개체관리 `field / *` 카드의 `label`. 필수 별표는 시각 표시일 뿐이라
// 접근 가능한 이름에서 뺀다(필수 여부는 입력의 required/aria-required 가 전달한다).
export function FormFieldLabel({
  htmlFor,
  id,
  required,
  size = 20,
  children,
}: FormFieldLabelProps) {
  return (
    <Label
      as={htmlFor ? 'label' : 'span'}
      htmlFor={htmlFor}
      id={id}
      data-size={size}
    >
      {children}
      {required && <RequiredMark aria-hidden="true">*</RequiredMark>}
    </Label>
  )
}

const Label = styled.label`
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;

  &[data-size='32'] {
    color: ${({ theme }) => theme.colors.textStrong};
    font-size: 32px;
  }
`

const RequiredMark = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`
