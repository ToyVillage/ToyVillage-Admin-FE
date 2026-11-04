import type { ComponentPropsWithoutRef } from 'react'
import styled from '@emotion/styled'
import radioOnIcon from './assets/radio-on.svg'

type RadioProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'>

// Figma `radio / on`·`off`(28px). native radio 의 모양만 바꾼다.
export function Radio(props: RadioProps) {
  return <Input type="radio" {...props} />
}

const Input = styled.input`
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  margin: 0;
  border: 2px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 14px;
  appearance: none;
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;

  /* 인라인된 SVG 데이터 URI 안에 작은따옴표가 있어 큰따옴표로 감싼다. */
  &:checked {
    border: 0;
    background: url("${radioOnIcon}") center / 28px no-repeat;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
