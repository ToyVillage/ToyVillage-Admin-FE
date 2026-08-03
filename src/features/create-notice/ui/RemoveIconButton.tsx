import type { ComponentPropsWithoutRef } from 'react'
import styled from '@emotion/styled'

type RemoveIconButtonProps = ComponentPropsWithoutRef<'button'>

export function RemoveIconButton(props: RemoveIconButtonProps) {
  return (
    <Button {...props}>
      <Icon viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 0a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM5.76 6.82l1.06-1.06L10 8.94l3.18-3.18 1.06 1.06L11.06 10l3.18 3.18-1.06 1.06L10 11.06l-3.18 3.18-1.06-1.06L8.94 10 5.76 6.82Z"
        />
      </Icon>
    </Button>
  )
}

const Button = styled.button`
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 2px;
  }
`

const Icon = styled.svg`
  width: 20px;
  height: 20px;
  fill: currentColor;
`
